"""
ContentForge AI — Backend FastAPI
Deploy no Render, Railway ou Vercel

Variáveis de ambiente necessárias:
- GROQ_API_KEY (obrigatória)
- GOOGLE_CLIENT_ID (obrigatória para login Google)
- GOOGLE_CLIENT_SECRET (obrigatória para login Google)
- JWT_SECRET (obrigatória para sessões — gere uma string aleatória)
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
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="ContentForge AI API")

# CORS
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

# URL base do servidor (auto-detectada)
def get_base_url(request=None):
    """Detecta a URL base do servidor automaticamente."""
    # Prioridade: variável de ambiente > request > localhost
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


# ==========================================
# MODELOS DE DADOS
# ==========================================

class RequisicaoConteudo(BaseModel):
    tema: str
    plataforma: str


# ==========================================
# AUTENTICAÇÃO GOOGLE OAUTH
# ==========================================

@app.get("/api/auth/google/login")
async def google_login(request: Request):
    """
    Inicia o fluxo de login com Google.
    Redireciona o usuário para a tela de consentimento do Google.
    """
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
    """
    Callback do Google OAuth.
    Troca o código de autorização por dados do usuário.
    """
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        return RedirectResponse(url="/?erro=google_nao_configurado")

    base_url = get_base_url(request)
    redirect_uri = f"{base_url}/api/auth/google/callback"

    # Trocar código por tokens
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
            print(f"[Google OAuth] Erro ao trocar código: {token_response.text}")
            return RedirectResponse(url="/?erro=falha_autenticacao")

        tokens = token_response.json()
        access_token = tokens.get("access_token", "")

        # Buscar dados do usuário
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

        # Criar JWT com dados do usuário
        payload = {
            "nome": nome,
            "email": email,
            "avatar": avatar,
            "exp": datetime.now(timezone.utc) + timedelta(days=7),
            "iat": datetime.now(timezone.utc),
        }
        token_jwt = jwt.encode(payload, JWT_SECRET, algorithm="HS256")

        # Redirecionar para o frontend com o token
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
    """Verifica se um token JWT é válido e retorna os dados do usuário."""
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
# FUNÇÕES AUXILIARES - GERAÇÃO DE CONTEÚDO
# ==========================================

def chamar_groq(prompt: str) -> str:
    """Chama a API do Groq com o modelo Llama 4 Scout."""
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
                    "content": "Você é um especialista brasileiro em criação de conteúdo viral para redes sociais. Sempre responda em português brasileiro. Sempre responda em formato JSON válido, sem markdown, sem ```json, apenas o JSON puro.",
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.8,
            "max_tokens": 4000,
        },
        timeout=60,
    )

    if resposta.status_code == 429:
        raise HTTPException(
            status_code=429,
            detail="Limite de requisições do Groq atingido (30 req/min ou 1000 req/dia). Aguarde um momento e tente novamente.",
        )
    if resposta.status_code == 401:
        raise HTTPException(status_code=500, detail="Chave da API Groq inválida no servidor.")
    if not resposta.ok:
        raise HTTPException(status_code=502, detail=f"Erro na API Groq: {resposta.text}")

    dados = resposta.json()
    return dados.get("choices", [{}])[0].get("message", {}).get("content", "")


def pesquisar_tendencias_youtube(tema: str) -> str:
    """Pesquisa tendências reais no YouTube usando a API oficial."""
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
    """Pesquisa tendências via Trends MCP API (TikTok e Instagram)."""
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
    """Usa o próprio Groq como fallback para pesquisar tendências."""
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
# ENDPOINTS DE CONTEÚDO
# ==========================================

@app.post("/api/gerar")
async def gerar_conteudo(req: RequisicaoConteudo):
    """
    Endpoint principal: recebe tema e plataforma, retorna conteúdo gerado pela IA.
    """
    if not req.tema.strip():
        raise HTTPException(status_code=400, detail="O tema não pode estar vazio.")
    if req.plataforma not in ("tiktok", "instagram", "youtube"):
        raise HTTPException(status_code=400, detail="Plataforma inválida. Use: tiktok, instagram ou youtube.")

    nome_plataforma = {
        "tiktok": "TikTok",
        "instagram": "Instagram",
        "youtube": "YouTube",
    }[req.plataforma]

    # PASSO 1: Pesquisar tendências reais
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

    # PASSO 2: Fallback para Groq
    if not dados_tendencias:
        try:
            dados_tendencias = fallback_groq_pesquisa(req.tema, nome_plataforma)
            fonte_tendencias = "groq_fallback"
        except Exception:
            dados_tendencias = ""
            fonte_tendencias = "groq_fallback"

    # PASSO 3: Gerar conteúdo com Groq
    prompt_principal = f"""Você é um especialista em criação de conteúdo viral para {nome_plataforma}. 
Com base nas informações abaixo, crie conteúdo completo para um vídeo sobre "{req.tema}".

{f"DADOS DE TENDÊNCIAS PESQUISADOS:\n{dados_tendencias}\n\n" if dados_tendencias else ""}
INSTRUÇÕES:
- Crie conteúdo otimizado para {nome_plataforma}
- Use ganchos psicológicos e técnicas de retenção
- O roteiro deve ser detalhado com marcações de tempo
- As hashtags devem ser uma mistura de populares + nicho
- Tudo em português brasileiro

Responda em JSON com EXATAMENTE esta estrutura (sem markdown, sem acentos nas chaves):
{{
  "titulo": "titulo otimizado e chamativo para o video",
  "descricao": "descricao envolvente com call-to-action",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "roteiro": "roteiro completo e detalhado com marcacoes de tempo e instrucoes de cena",
  "ideiasEdicao": ["ideia 1 de edicao", "ideia 2 de edicao"],
  "tendencias": ["tendencia 1 identificada", "tendencia 2 identificada"]
}}

Regras:
- titulo: máximo 100 caracteres, impactante
- descricao: entre 150-400 caracteres, com emojis estratégicos e CTA
- hashtags: entre 5 e 20 hashtags relevantes (sem o #, apenas o texto)
- roteiro: detalhado com [ABERTURA], [DESENVOLVIMENTO], [CLIMAX], [ENCERRAMENTO], incluindo falas sugeridas e instruções visuais
- ideiasEdicao: 4-8 dicas práticas de edição específicas para {nome_plataforma}
- tendencias: 3-5 tendências atuais identificadas na pesquisa
- NÃO use markdown no JSON. Responda APENAS o JSON puro."""

    resposta_groq = chamar_groq(prompt_principal)

    # PASSO 4: Parsear resposta
    try:
        json_limpo = resposta_groq.strip()
        if json_limpo.startswith("```"):
            json_limpo = json_limpo.replace("```json\n", "").replace("```\n", "").replace("```", "")
        conteudo = json.loads(json_limpo)
    except json.JSONDecodeError:
        conteudo = {
            "titulo": f"Conteúdo sobre: {req.tema}",
            "descricao": resposta_groq[:500],
            "hashtags": [],
            "roteiro": resposta_groq,
            "ideiasEdicao": [],
            "tendencias": [],
        }

    return {
        "titulo": conteudo.get("titulo", ""),
        "descricao": conteudo.get("descricao", ""),
        "hashtags": conteudo.get("hashtags", []),
        "roteiro": conteudo.get("roteiro", ""),
        "ideiasEdicao": conteudo.get("ideiasEdicao", []),
        "tendencias": conteudo.get("tendencias", []),
        "plataforma": req.plataforma,
        "tema": req.tema,
        "fonteTendencias": fonte_tendencias,
    }


@app.get("/api/status")
async def status():
    """Verifica se a API está online e quais serviços estão configurados."""
    return {
        "status": "online",
        "groq_configurado": bool(GROQ_API_KEY),
        "youtube_configurado": bool(YOUTUBE_API_KEY),
        "trends_mcp_configurado": bool(TRENDSMCP_API_KEY),
        "google_login_configurado": bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET),
    }


# ==========================================
# SERVIR FRONTEND (produção)
# ==========================================

frontend_path = os.path.join(os.path.dirname(__file__), "dist")
if not os.path.exists(frontend_path):
    frontend_path = os.path.join(os.path.dirname(__file__), "..", "dist")

if os.path.exists(frontend_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_path, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """Serve o index.html para qualquer rota que não seja /api/*"""
        return FileResponse(os.path.join(frontend_path, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
