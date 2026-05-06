"""
ENGAJAÍ — Backend FastAPI
Deploy no Render, Railway ou Vercel

Variáveis de ambiente necessárias:
- GROQ_API_KEY (obrigatória)
- GOOGLE_CLIENT_ID (obrigatória para login Google)
- GOOGLE_CLIENT_SECRET (obrigatória para login Google)
- JWT_SECRET (opcional no ambiente, usa valor padrão se não definida)
- YOUTUBE_API_KEY (opcional, para tendências do YouTube)
- TRENDSMCP_API_KEY (opcional, para tendências TikTok/Instagram)
"""

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from pydantic import BaseModel
import requests
import json
import os
import jwt
import urllib.parse
import re
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="ENGAJAÍ API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# CONFIGURAÇÃO DAS APIS
# ==========================================

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")
TRENDSMCP_API_KEY = os.getenv("TRENDSMCP_API_KEY", "")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")

JWT_SECRET = os.getenv("JWT_SECRET", "contentforge-secret-change-me")
GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


def get_base_url(request=None):
    render_url = os.getenv("RENDER_EXTERNAL_URL", "")
    if render_url:
        return render_url.rstrip("/")
    env_url = os.getenv("BASE_URL", "")
    if env_url:
        return env_url.rstrip("/")
    if request:
        scheme = request.url.scheme
        host = request.headers.get("host", "localhost:8000")
        return f"{scheme}://{host}"
    return "http://localhost:8000"


class RequisicaoConteudo(BaseModel):
    tema: str
    plataforma: str


# ==========================================
# AUTENTICAÇÃO GOOGLE OAUTH (inalterada)
# ==========================================

@app.get("/api/auth/google/login")
async def google_login(request: Request):
    base_url = get_base_url(request)
    redirect_uri = f"{base_url}/api/auth/google/callback"
    params = urllib.parse.urlencode({
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
    })
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{params}"
    return RedirectResponse(url=auth_url)


@app.get("/api/auth/google/callback")
async def google_callback(request: Request, code: str = Query(...)):
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        return RedirectResponse(url="/?erro=google_nao_configurado")
    base_url = get_base_url(request)
    redirect_uri = f"{base_url}/api/auth/google/callback"
    try:
        token_response = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
            timeout=15,
        )
        if not token_response.ok:
            return RedirectResponse(url="/?erro=falha_autenticacao")
        tokens = token_response.json()
        access_token = tokens.get("access_token", "")
        userinfo_response = requests.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
        if not userinfo_response.ok:
            return RedirectResponse(url="/?erro=falha_dados_usuario")
        user_info = userinfo_response.json()
        nome = user_info.get("name", "Usuário")
        email = user_info.get("email", "")
        avatar = user_info.get("picture", f"https://ui-avatars.com/api/?name={urllib.parse.quote(nome)}&background=6366f1&color=fff&size=128&bold=true")
        payload = {
            "nome": nome,
            "email": email,
            "avatar": avatar,
            "exp": datetime.now(timezone.utc) + timedelta(days=7),
            "iat": datetime.now(timezone.utc),
        }
        token_jwt = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
        params = urllib.parse.urlencode({
            "token": token_jwt,
            "nome": nome,
            "email": email,
            "avatar": avatar,
        })
        return RedirectResponse(url=f"/?{params}")
    except Exception as e:
        print(f"[Google OAuth] Exceção: {e}")
        return RedirectResponse(url="/?erro=erro_interno")


@app.get("/api/auth/verificar")
async def verificar_token(token: str = Query(...)):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return {
            "valido": True,
            "nome": payload.get("nome", ""),
            "email": payload.get("email", ""),
            "avatar": payload.get("avatar", ""),
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado. Faça login novamente.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido.")


# ==========================================
# FUNÇÕES AUXILIARES
# ==========================================

def limpar_e_extrair_json(texto: str) -> dict:
    """Tenta extrair um JSON válido de qualquer resposta do Groq."""
    texto = texto.strip()
    # Remove crases triplas e indicadores de linguagem
    texto = re.sub(r'^```(?:json)?\s*', '', texto)
    texto = re.sub(r'\s*```$', '', texto)
    # Remove possíveis quebras de linha excessivas que podem quebrar strings
    texto = re.sub(r'(?<!\\)\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})', '', texto)  # Remove escapes inválidos
    try:
        return json.loads(texto)
    except json.JSONDecodeError:
        pass
    # Procura por um objeto JSON no meio do texto
    match = re.search(r'\{.*\}', texto, re.DOTALL)
    if match:
        try:
            # Tenta corrigir chaves com aspas simples (comum)
            candidate = match.group(0)
            # Substitui aspas simples por duplas em chaves e valores, mas cuidado com strings internas
            # Não é perfeito, mas ajuda
            candidate = re.sub(r"'([^']*)':", r'"\1":', candidate)
            return json.loads(candidate)
        except json.JSONDecodeError:
            pass
    return {}


def normalizar_chaves_json(dados: dict) -> dict:
    """Corrige nomes de chaves com erros comuns do Groq."""
    mapeamento_chaves = {
        'toreiro': 'roteiro',
        'roteiro': 'roteiro',
        'ideiaedicao': 'ideiaEdicao',
        'ideia_edicao': 'ideiaEdicao',
        'ideiasedicao': 'ideiaEdicao',
        'ideiasEdicao': 'ideiaEdicao',
        'ideiaEdicao': 'ideiaEdicao',
        'titulo': 'titulo',
        'descricao': 'descricao',
        'hashtags': 'hashtags',
        'tendencias': 'tendencias',
    }
    corrigido = {}
    for chave, valor in dados.items():
        chave_lower = chave.strip().lower()
        if chave_lower in mapeamento_chaves:
            corrigido[mapeamento_chaves[chave_lower]] = valor
        else:
            corrigido[chave] = valor  # mantém outras chaves
    return corrigido


def chamar_groq(prompt: str) -> str:
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY não configurada no servidor.")
    resposta = requests.post(
        GROQ_URL,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {GROQ_API_KEY}",
        },
        json={
            "model": GROQ_MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": "Você é um especialista brasileiro em criação de conteúdo viral. Responda SEMPRE e APENAS com um objeto JSON válido e completo. NUNCA use markdown, NUNCA use array para 'hashtags' ou 'roteiro' (devem ser strings). As chaves devem ser exatamente: titulo, descricao, hashtags, roteiro, ideiaEdicao, tendencias.",
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.8,
            "max_tokens": 8000,  # Aumentado para dar espaço para roteiro e edição detalhados
        },
        timeout=90,
    )
    if resposta.status_code == 429:
        raise HTTPException(status_code=429, detail="Limite de requisições do Groq atingido.")
    if resposta.status_code == 401:
        raise HTTPException(status_code=500, detail="Chave da API Groq inválida.")
    if not resposta.ok:
        raise HTTPException(status_code=502, detail=f"Erro na API Groq: {resposta.text}")
    dados = resposta.json()
    return dados.get("choices", [{}])[0].get("message", {}).get("content", "")


def pesquisar_tendencias_youtube(tema: str) -> str:
    if not YOUTUBE_API_KEY:
        return ""
    try:
        url = (
            f"https://www.googleapis.com/youtube/v3/search"
            f"?part=snippet&q={urllib.parse.quote(tema)}"
            f"&type=video&order=viewCount&maxResults=5"
            f"&relevanceLanguage=pt&key={YOUTUBE_API_KEY}"
        )
        resposta = requests.get(url, timeout=10)
        if not resposta.ok:
            return ""
        dados = resposta.json()
        videos = dados.get("items", [])
        if not videos:
            return ""
        linhas = []
        for i, item in enumerate(videos, 1):
            titulo = item.get("snippet", {}).get("title", "")
            canal = item.get("snippet", {}).get("channelTitle", "")
            linhas.append(f'{i}. "{titulo}" (Canal: {canal})')
        return f'Tendências reais do YouTube sobre "{tema}":\n' + "\n".join(linhas)
    except Exception as e:
        print(f"[YouTube API] Erro: {e}")
        return ""


def pesquisar_tendencias_mcp(tema: str, plataforma: str) -> str:
    if not TRENDSMCP_API_KEY:
        return ""
    try:
        fonte = "tiktok" if plataforma == "tiktok" else "google trends"
        resposta = requests.post(
            "https://api.trendsmcp.ai/api",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {TRENDSMCP_API_KEY}",
            },
            json={"source": fonte, "keyword": tema},
            timeout=10,
        )
        if not resposta.ok:
            return ""
        dados = resposta.json()
        corpo = dados.get("body", [])
        if isinstance(corpo, str):
            corpo = json.loads(corpo)
        if not corpo:
            return ""
        ultimos = corpo[-5:]
        linhas = [f"- Data: {p.get('date', 'N/A')}, Popularidade: {p.get('value', 'N/A')}/100" for p in ultimos]
        return f'Dados de tendência do Trends MCP ({fonte}) para "{tema}":\n' + "\n".join(linhas)
    except Exception as e:
        print(f"[Trends MCP] Erro: {e}")
        return ""


def fallback_groq_pesquisa(tema: str, plataforma: str) -> str:
    prompt = (
        f"Com base no seu vasto conhecimento sobre o que é popular na internet, "
        f"aja como um especialista em tendências do {plataforma}. "
        f'Realize uma análise do tema "{tema}" e me forneça exatamente:\n'
        f"1. Os 3 principais tópicos ou formatos em alta AGORA sobre este tema.\n"
        f"2. As hashtags mais usadas e relevantes.\n"
        f"3. Uma breve descrição do estilo de conteúdo que está performando melhor.\n"
        f"Seja específico e responda como se tivesse acabado de vasculhar a rede social."
    )
    return chamar_groq(prompt)


# ==========================================
# ENDPOINT PRINCIPAL DE GERAÇÃO
# ==========================================

@app.post("/api/gerar")
async def gerar_conteudo(req: RequisicaoConteudo):
    if not req.tema.strip():
        raise HTTPException(status_code=400, detail="O tema não pode estar vazio.")
    if req.plataforma not in ("tiktok", "instagram", "youtube"):
        raise HTTPException(status_code=400, detail="Plataforma inválida.")

    nome_plataforma = {
        "tiktok": "TikTok",
        "instagram": "Instagram",
        "youtube": "YouTube",
    }[req.plataforma]

    # PASSO 1 — Pesquisar tendências
    dados_tendencias = ""
    fonte_tendencias = "groq_fallback"
    if req.plataforma == "youtube":
        dados_tendencias = pesquisar_tendencias_youtube(req.tema)
        if dados_tendencias:
            fonte_tendencias = "youtube_api"
    else:
        dados_tendencias = pesquisar_tendencias_mcp(req.tema, req.plataforma)
        if dados_tendencias:
            fonte_tendencias = "trends_mcp"
    if not dados_tendencias:
        try:
            dados_tendencias = fallback_groq_pesquisa(req.tema, nome_plataforma)
            fonte_tendencias = "groq_fallback"
        except Exception:
            dados_tendencias = ""

    # PASSO 2 — Prompt rigoroso com formato exato
    prompt_principal = f"""
Você é um criador de conteúdo viral brasileiro especializado em {nome_plataforma}.

Tema do vídeo: "{req.tema}"

Dados de tendências (use como inspiração):
{f"INÍCIO DOS DADOS DE TENDÊNCIA:\n{dados_tendencias}\nFIM DOS DADOS DE TENDÊNCIA\n" if dados_tendencias else "Nenhum dado externo disponível."}

INSTRUÇÕES ESTRITAS:
1. Responda APENAS com o JSON puro, sem introdução, sem markdown, sem comentários.
2. O JSON DEVE ter exatamente as chaves: "titulo", "descricao", "hashtags", "roteiro", "ideiaEdicao", "tendencias".
3. "hashtags": STRING ÚNICA com tags separadas por espaço, cada uma começando com #. Exemplo: "#DicasDeProgramação #AprendaProgramar #DevLife". NÃO USE ARRAY.
4. "roteiro": STRING ÚNICA contendo o roteiro COMPLETO do vídeo. Divida em cenas com [CENA X – ABERTURA (0s-3s)], descreva enquadramento, falas, sons e transições. O roteiro deve ter no MÍNIMO 300 PALAVRAS. NÃO USE ARRAY.
5. "ideiaEdicao": STRING ÚNICA descritiva com no MÍNIMO 150 PALAVRAS, incluindo paleta de cores (códigos hex), fontes, filtros, música (gênero e BPM), efeitos sonoros, elementos gráficos.
6. "tendencias": array de 3 strings curtas.
7. Todas as strings devem estar em português brasileiro.

EXEMPLO DE RESPOSTA VÁLIDA (note que roteiro e hashtags são strings longas, não arrays):
{{
  "titulo": "5 Dicas Infalíveis de Programação para Iniciantes! 💻",
  "descricao": "Aprenda programação com essas dicas práticas! 🚀 Python, Java e mais. Assista e turbine sua carreira tech.",
  "hashtags": "#DicasDeProgramação #AprendaProgramar #DevLife #Tecnologia #Coding #ProgramaçãoParaIniciantes",
  "roteiro": "[CENA 1 – ABERTURA (0s-3s)] Close em teclado RGB com luzes piscando. Câmera sobe lentamente revelando o rosto do apresentador. Fala enérgica: 'E aí, dev! Pronto para dominar a programação de uma vez por todas?' Som: teclado mecânico + fade in de música eletrônica animada.\\n[CENA 2 – GANCHO (3s-8s)] Corte seco para plano médio. Apresentador gesticula: 'Hoje eu vou te mostrar 5 dicas que todo iniciante precisa saber pra acelerar o aprendizado e não travar nos bugs.' Texto sobreposto: '5 DICAS INFALÍVEIS'. Transição: slide lateral com efeito glitch.\\n[CENA 3 – DESENVOLVIMENTO (8s-25s)] Close em tela de código. A cada dica, motion graphics coloridos destacam a técnica. Dica 1: Python; Dica 2: Git; Dica 3: Debug. Som: pop a cada nova dica, música de fundo crescente.\\n[CENA 4 – CLÍMAX (25s-28s)] Fala: 'E a dica secreta... não tenha medo de errar, é nos bugs que a gente mais aprende!' Cortes rápidos entre código quebrado e funcionando. Trilha sonora atinge o pico.\\n[CENA 5 – ENCERRAMENTO (28s-30s)] Volta ao plano médio. Fala: 'Curtiu? Salva esse vídeo, compartilha com aquele amigo que tá começando e se inscreve pra mais dicas como essa!' Animação do logo ENGAJAÍ com partículas brilhantes. Fade out da música. Som: notificação de 'inscreva-se'.",
  "ideiaEdicao": "Paleta de cores: fundo preto (#0A0A0A), texto amarelo (#FFD700) e ciano (#00E5FF). Fonte Montserrat Bold 48px para títulos, Inter Regular 28px para corpo. Filtro: Vibrant +20 contraste, +10 saturação, leve vignette. Música eletrônica 120 BPM (Future Bass) com drop no clímax. Efeitos sonoros: whoosh em transições, pop ao exibir dicas, clique de teclado na cena de código. Elementos gráficos: linhas cinéticas atrás do texto, stick text amarelo com outline preto, emojis animados (🚀💡) nos cantos. Transições: glitch entre cenas, slide blur, cortes secos. Sobreposição de partículas brilhantes durante todo o vídeo.",
  "tendencias": ["Vídeos de dicas numeradas com edição acelerada", "Uso de humor e identificação com iniciantes", "Motion graphics coloridos sobre tela preta"]
}}

Agora gere o JSON para o tema "{req.tema}" seguindo rigorosamente o formato acima.
"""

    resposta_groq = chamar_groq(prompt_principal)

    # PASSO 3 — Extrair, normalizar e tratar campos
    conteudo_bruto = limpar_e_extrair_json(resposta_groq)
    conteudo = normalizar_chaves_json(conteudo_bruto)

    titulo = conteudo.get("titulo", "")
    descricao = conteudo.get("descricao", "")
    hashtags = conteudo.get("hashtags", "")
    roteiro = conteudo.get("roteiro", "")
    ideia_edicao = conteudo.get("ideiaEdicao", "")
    tendencias = conteudo.get("tendencias", [])

    # Tratamento de hashtags
    if isinstance(hashtags, list):
        hashtags = " ".join(f"#{h.strip().lstrip('#')}" for h in hashtags if h.strip())
    if not hashtags or not any(c.isalpha() for c in hashtags):
        # Fallback mais inteligente: pega palavras-chave do tema
        palavras = req.tema.split()
        hashtags = " ".join([f"#{palavra.capitalize()}" for palavra in palavras[:4]]) + " #dicas #viral"

    # Tratamento do roteiro
    if isinstance(roteiro, list):
        # Converte lista de cenas em string legível
        partes = []
        for idx, cena in enumerate(roteiro, start=1):
            if isinstance(cena, dict):
                nome = cena.get("nome", cena.get("cena", f"Cena {idx}"))
                tempo = cena.get("tempo", "")
                fala = cena.get("fala", "")
                enquadramento = cena.get("enquadramento", "")
                partes.append(f"[{nome} - {tempo}] Enquadramento: {enquadramento}. Fala: {fala}")
            else:
                partes.append(str(cena))
        roteiro = "\n".join(partes)
    if not roteiro or len(roteiro) < 50:
        roteiro = resposta_groq[:1500]  # usa resposta bruta como texto se roteiro vazio

    # Tratamento ideiaEdicao
    if isinstance(ideia_edicao, list):
        ideia_edicao = "\n".join(ideia_edicao)
    if not ideia_edicao or len(ideia_edicao.strip()) < 20:
        ideia_edicao = "Paleta: #0A0A0A, #FFD700, #00E5FF. Fonte Montserrat Bold. Música eletrônica 120 BPM. Cortes rápidos com glitch."

    # Título e descrição com fallback mais criativo
    if not titulo:
        titulo = f"{req.tema.split()[0].capitalize()}: O Segredo Revelado!"
    if not descricao:
        descricao = f"Descubra tudo sobre {req.tema}. Assista e compartilhe! #dicas #viral"

    if not isinstance(tendencias, list):
        tendencias = [tendencias] if tendencias else []

    return {
        "titulo": titulo,
        "descricao": descricao,
        "hashtags": hashtags,
        "roteiro": roteiro,
        "ideiaEdicao": ideia_edicao,
        "tendencias": tendencias,
        "plataforma": req.plataforma,
        "tema": req.tema,
        "fonteTendencias": fonte_tendencias,
    }


@app.get("/api/status")
async def status():
    return {
        "status": "online",
        "groq_configurado": bool(GROQ_API_KEY),
        "youtube_configurado": bool(YOUTUBE_API_KEY),
        "trends_mcp_configurado": bool(TRENDSMCP_API_KEY),
        "google_login_configurado": bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET),
    }


# ==========================================
# SERVIR FRONTEND
# ==========================================

possiveis_caminhos = [
    os.path.join(os.path.dirname(__file__), "dist"),
    os.path.join(os.path.dirname(__file__), "..", "dist"),
    "/opt/render/project/src/dist"
]

frontend_path = ""
for caminho in possiveis_caminhos:
    if os.path.exists(caminho):
        frontend_path = caminho
        break

if frontend_path:
    assets_path = os.path.join(frontend_path, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api/"):
            return None
        index_file = os.path.join(frontend_path, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"erro": "index.html nao encontrado"}
else:
    @app.get("/")
    async def erro_dist():
        return {"erro": "Pasta dist nao encontrada no servidor"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
