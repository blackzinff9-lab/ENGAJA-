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
- MP_ACCESS_TOKEN (obrigatória para Mercado Pago)
- SUPABASE_URL (obrigatória para banco de dados)
- SUPABASE_KEY (obrigatória para banco de dados)
"""

from fastapi import FastAPI, HTTPException, Query, Request, Depends
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
from supabase import create_client, Client
import mercadopago

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

# Mercado Pago
MP_ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN", "")
mp_sdk = mercadopago.SDK(MP_ACCESS_TOKEN)

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


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


class RequisicaoSequencia(BaseModel):
    tema: str
    plataforma: str


# ==========================================
# AUTENTICAÇÃO GOOGLE OAUTH
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

        # Salvar ou atualizar usuário no Supabase
        user_id = user_info.get("sub", "")
        if user_id:
            try:
                supabase.table("users").upsert({
                    "id": user_id,
                    "email": email,
                }).execute()
            except Exception as e:
                print(f"[Supabase] Erro ao upsert user: {e}")

        payload = {
            "sub": user_id,
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
        user_id = payload.get("sub", "")

        # Buscar plano atual no Supabase
        plano = "free"
        if user_id:
            try:
                res = supabase.table("users").select("plan").eq("id", user_id).execute()
                if res.data:
                    plano = res.data[0].get("plan", "free")
            except Exception:
                pass

        return {
            "valido": True,
            "nome": payload.get("nome", ""),
            "email": payload.get("email", ""),
            "avatar": payload.get("avatar", ""),
            "sub": user_id,
            "plano": plano,
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado. Faça login novamente.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido.")


# ==========================================
# DEPENDÊNCIA PARA EXTRAIR USUÁRIO DO TOKEN
# ==========================================

def get_current_user(request: Request) -> str:
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token não fornecido")
    token = auth.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload.get("sub", "")
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")


# ==========================================
# FUNÇÕES AUXILIARES
# ==========================================

def limpar_e_extrair_json(texto: str) -> dict:
    texto = texto.strip()
    texto = re.sub(r'^```(?:json)?\s*', '', texto)
    texto = re.sub(r'\s*```$', '', texto)
    try:
        return json.loads(texto)
    except json.JSONDecodeError:
        pass
    match = re.search(r'\{.*\}', texto, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
    return {}


def normalizar_chaves_json(dados: dict) -> dict:
    mapeamento_chaves = {
        'toreiro': 'roteiro', 'roteiro': 'roteiro',
        'ideiaedicao': 'ideiaEdicao', 'ideia_edicao': 'ideiaEdicao',
        'ideiasedicao': 'ideiaEdicao', 'ideiasEdicao': 'ideiaEdicao',
        'ideiaEdicao': 'ideiaEdicao', 'titulo': 'titulo',
        'descricao': 'descricao', 'hashtags': 'hashtags',
        'tendencias': 'tendencias',
    }
    corrigido = {}
    for chave, valor in dados.items():
        chave_lower = chave.strip().lower()
        if chave_lower in mapeamento_chaves:
            corrigido[mapeamento_chaves[chave_lower]] = valor
        else:
            corrigido[chave] = valor
    return corrigido


def chamar_groq(prompt: str) -> str:
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY não configurada.")
    resposta = requests.post(
        GROQ_URL,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {GROQ_API_KEY}",
        },
        json={
            "model": GROQ_MODEL,
            "messages": [
                {"role": "system", "content": "Você é um especialista brasileiro em criação de conteúdo viral. Responda SEMPRE e APENAS com um objeto JSON válido e completo. NUNCA use markdown ou arrays para 'hashtags' ou 'roteiro'."},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.8,
            "max_tokens": 8000,
        },
        timeout=90,
    )
    if resposta.status_code == 429:
        raise HTTPException(status_code=429, detail="Limite de requisições do Groq atingido.")
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
        for i, v in enumerate(videos, 1):
            titulo = v.get("snippet", {}).get("title", "")
            canal = v.get("snippet", {}).get("channelTitle", "")
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
# CONTROLE DE LIMITES E PLANOS
# ==========================================

async def get_plano_usuario(user_id: str) -> str:
    try:
        res = supabase.table("users").select("plan").eq("id", user_id).execute()
        return res.data[0].get("plan", "free") if res.data else "free"
    except Exception:
        return "free"


async def get_uso_diario(user_id: str) -> int:
    try:
        hoje = datetime.now().strftime("%Y-%m-%d")
        res = supabase.table("usage_logs").select("*").eq("user_id", user_id).gte("created_at", hoje).execute()
        return len(res.data) if res.data else 0
    except Exception:
        return 0


async def pode_gerar(user_id: str) -> tuple:
    plano = await get_plano_usuario(user_id)
    limite = 10 if plano == "pro" else 3
    uso = await get_uso_diario(user_id)
    return uso < limite, max(0, limite - uso)


async def registrar_uso(user_id: str, action_type: str):
    try:
        supabase.table("usage_logs").insert({
            "user_id": user_id,
            "action_type": action_type,
            "created_at": datetime.now().isoformat()
        }).execute()
    except Exception as e:
        print(f"[Supabase] Erro ao registrar uso: {e}")
        
# ==========================================
# ENDPOINT DE GERAÇÃO DE CONTEÚDO
# ==========================================

@app.post("/api/gerar")
async def gerar_conteudo(req: RequisicaoConteudo, request: Request):
    if not req.tema.strip():
        raise HTTPException(status_code=400, detail="Tema não pode estar vazio")
    if req.plataforma not in ("tiktok", "instagram", "youtube"):
        raise HTTPException(status_code=400, detail="Plataforma inválida")

    user_id = None
    auth = request.headers.get("Authorization")
    if auth and auth.startswith("Bearer "):
        user_id = get_current_user(request)

    if user_id:
        pode, restante = await pode_gerar(user_id)
        if not pode:
            raise HTTPException(status_code=402, detail=f"Limite diário atingido. Faça upgrade para o Plano Pro para gerar até 10 ideias.")

    nome_plataforma = {"tiktok": "TikTok", "instagram": "Instagram", "youtube": "YouTube"}[req.plataforma]

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
        except Exception:
            dados_tendencias = ""

    instrucoes_especificas = ""
    if req.plataforma == "youtube":
        instrucoes_especificas = """
**YouTube:**
- Título: Objetivo, com a palavra-chave principal à esquerda e no **máximo 75 caracteres**. Deve gerar curiosidade.
- Descrição: A peça central do SEO. Deve ser longa (**150–300 palavras**), funcionando como um mini artigo. Repita a palavra-chave principal **2–4 vezes** e inclua palavras-chave relacionadas **2–3 vezes**. Inclua uma chamada para ação (inscrever-se, comentar). Use de **3 a 5 hashtags** estratégicas no final da descrição.
- Roteiro: Para um vídeo de formato longo ou médio. Deve ter uma introdução que resuma o valor, desenvolvimento detalhado e uma conclusão com call to action forte.
"""
    elif req.plataforma == "tiktok":
        instrucoes_especificas = """
**TikTok:**
- Título (Texto na tela e legenda): Use **palavras-chave de cauda longa** e texto chamativo nos primeiros segundos para incentivar a retenção. A IA do TikTok analisa o texto na tela, então ele é crucial. Crie um gancho fortíssimo nos primeiros 3 segundos.
- Descrição: Curta e direta, com as **palavras-chave mais importantes nos primeiros 100 caracteres**.
- Hashtags: Use **poucas e boas**: 1-2 de tendência, 1-2 de nicho e 1 da sua marca (#ENGAJAÍ).
- Roteiro: Para um vídeo curto e vertical. Deve ser dinâmico, com cortes rápidos, texto na tela (que serve como SEO). Foque em retenção e um gancho inicial explosivo.
"""
    elif req.plataforma == "instagram":
        instrucoes_especificas = """
**Instagram:**
- Título (Texto na tela): Criativo, com uma **palavra-chave principal nos primeiros 3 segundos** do texto na tela. O objetivo é gerar "salvamentos" e conexão.
- Descrição: A primeira frase é crucial (**gancho + SEO**). Use parágrafos, emojis e formatação para criar um texto escaneável. Inclua uma chamada para ação. Use de **3 a 5 hashtags** relevantes (de preferência no final ou no primeiro comentário).
- Roteiro: Para um Reels. Deve ser visualmente atraente, com uma introdução que prenda a atenção imediatamente, desenvolvimento do valor e uma conclusão que incentive a salvar ou compartilhar.
"""

    prompt_principal = f"""
Você é um criador de conteúdo viral brasileiro especializado em {nome_plataforma}.

Tema do vídeo: "{req.tema}"

Dados de tendências (use como inspiração):
{f"INÍCIO DOS DADOS DE TENDÊNCIA:\n{dados_tendencias}\nFIM DOS DADOS DE TENDÊNCIA\n" if dados_tendencias else "Nenhum dado externo disponível."}

INSTRUÇÕES ESTRITAS E ADAPTADAS À PLATAFORMA:
{instrucoes_especificas}

FORMATO DE RESPOSTA OBRIGATÓRIO:
1. Responda APENAS com o JSON puro, sem introdução, sem markdown, sem comentários.
2. O JSON DEVE ter exatamente as chaves: "titulo", "descricao", "hashtags", "roteiro", "ideiaEdicao", "tendencias".
3. "hashtags": STRING ÚNICA com tags separadas por espaço, cada uma começando com #. NÃO USE ARRAY.
4. "roteiro": STRING ÚNICA contendo o roteiro COMPLETO do vídeo. Divida em cenas com [CENA X – ABERTURA (0s-3s)], descreva enquadramento, falas, texto na tela (para SEO), sons e transições. O roteiro deve ser adaptado ao formato da plataforma (Shorts/Reels para TikTok/Instagram, vídeo mais longo para YouTube). NÃO USE ARRAY.
5. "ideiaEdicao": STRING ÚNICA descritiva com no MÍNIMO 150 PALAVRAS, incluindo paleta de cores (códigos hex), fontes, filtros, música (gênero e BPM), efeitos sonoros, elementos gráficos.
6. "tendencias": array de 3 strings curtas.
7. Todas as strings devem estar em português brasileiro.

Agora gere o JSON para o tema "{req.tema}" seguindo rigorosamente o formato e as instruções específicas para {nome_plataforma}.
"""

    resposta_groq = chamar_groq(prompt_principal)
    conteudo = normalizar_chaves_json(limpar_e_extrair_json(resposta_groq))

    titulo = conteudo.get("titulo") or f"{req.tema.split()[0].capitalize()}: O Segredo!"
    descricao = conteudo.get("descricao") or "Descubra mais sobre " + req.tema
    hashtags = conteudo.get("hashtags") or f"#{req.tema.replace(' ', '')} #dicas #viral"
    if isinstance(hashtags, list):
        hashtags = " ".join(f"#{h.strip().lstrip('#')}" for h in hashtags if h.strip())
    roteiro = conteudo.get("roteiro") or resposta_groq[:1500]
    if isinstance(roteiro, list):
        roteiro = "\n".join([f"[{c.get('nome', 'Cena')}] {c.get('fala', '')}" for c in roteiro])
    ideia_edicao = conteudo.get("ideiaEdicao") or "Paleta: #0A0A0A #FFD700. Fonte Montserrat. Música eletrônica 120 BPM."
    if isinstance(ideia_edicao, list):
        ideia_edicao = "\n".join(ideia_edicao)
    tendencias = conteudo.get("tendencias", [])
    if not isinstance(tendencias, list):
        tendencias = [tendencias]

    if user_id:
        await registrar_uso(user_id, "gerar")

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


# ==========================================
# ENDPOINT DE SEQUÊNCIA DE IDEIAS (10 vídeos)
# ==========================================

@app.post("/api/gerar-sequencia")
async def gerar_sequencia(req: RequisicaoSequencia, request: Request):
    if not req.tema.strip():
        raise HTTPException(status_code=400, detail="Tema vazio")
    if req.plataforma not in ("tiktok", "instagram", "youtube"):
        raise HTTPException(status_code=400, detail="Plataforma inválida")

    user_id = get_current_user(request)
    plano = await get_plano_usuario(user_id)
    if plano != "pro":
        raise HTTPException(status_code=402, detail="Recurso exclusivo para assinantes Pro.")

    nome_plataforma = {"tiktok": "TikTok", "instagram": "Instagram", "youtube": "YouTube"}[req.plataforma]

    prompt = f"""
Você é um estrategista de conteúdo para {nome_plataforma}. Um criador acabou de gerar um vídeo sobre "{req.tema}" e agora quer planejar os próximos 10 vídeos, todos relacionados ao universo do tema, mas com abordagens DIVERSIFICADAS e COMPLEMENTARES.

Gere uma lista com EXATAMENTE 10 ideias. Cada ideia deve ter:
- "titulo": um título curto e chamativo (máx. 80 caracteres).
- "temaCurto": uma frase curta (máx. 100 caracteres) descrevendo o tema específico daquele vídeo.

REGRAS IMPORTANTES:
- EVITE repetir o mesmo enfoque. Explore ângulos diferentes: curiosidades, mitos, passo a passo, erros comuns, ferramentas, entrevistas, desafios, listas, cases reais, tendências, etc.
- As ideias devem formar uma SÉRIE COESA, mas cada vídeo deve ter valor assistindo sozinho.
- Otimize os títulos para o algoritmo do {nome_plataforma}.
- Inclua ganchos e palavras-chave relevantes.

Responda APENAS com um JSON puro contendo a chave "ideias", que é um array de objetos com "titulo" e "temaCurto". Exemplo:
{{"ideias": [{{"titulo": "...", "temaCurto": "..."}}, ...]}}
"""

    resposta = chamar_groq(prompt)
    dados = limpar_e_extrair_json(resposta)
    ideias = dados.get("ideias", [])
    if not isinstance(ideias, list) or len(ideias) == 0:
        ideias = [{"titulo": f"{req.tema} - Parte {i+1}", "temaCurto": f"Continuação de {req.tema}"} for i in range(10)]
    while len(ideias) < 10:
        ideias.append({"titulo": f"{req.tema} - Extra {len(ideias)+1}", "temaCurto": f"Mais sobre {req.tema}"})

    await registrar_uso(user_id, "sequencia")
    return {"ideias": ideias[:10], "temaOriginal": req.tema, "plataforma": req.plataforma}


# ==========================================
# ENDPOINTS MERCADO PAGO
# ==========================================

@app.post("/api/assinar-pro")
async def assinar_pro(request: Request):
    body = await request.json()
    user_id = body.get("user_id")
    email = body.get("email")
    if not user_id or not email:
        raise HTTPException(status_code=400, detail="Dados incompletos")

    preference_data = {
        "items": [{"title": "Plano Pro ENGAJAÍ", "quantity": 1, "unit_price": 14.00, "currency_id": "BRL"}],
        "payer": {"email": email},
        "back_urls": {
            "success": f"{get_base_url(request)}/sucesso",
            "failure": f"{get_base_url(request)}/erro",
            "pending": f"{get_base_url(request)}/pendente"
        },
        "auto_return": "approved",
        "notification_url": f"{get_base_url(request)}/api/notificacao-pagamento",
        "external_reference": user_id
    }
    try:
        preference = mp_sdk.preference().create(preference_data)
        if preference.get("status") == 201:
            return {"init_point": preference["response"]["init_point"], "preference_id": preference["response"]["id"]}
        else:
            raise HTTPException(status_code=400, detail="Erro ao criar preferência")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro Mercado Pago: {str(e)}")


@app.post("/api/notificacao-pagamento")
async def notificacao_pagamento(request: Request):
    try:
        payload = await request.json()
        if payload.get("type") == "payment":
            payment_id = payload["data"]["id"]
            payment = mp_sdk.payment().get(payment_id)
            if payment.get("status") == 200 and payment["response"]["status"] == "approved":
                user_id = payment["response"]["external_reference"]
                supabase.table("users").update({"plan": "pro"}).eq("id", user_id).execute()
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro webhook: {str(e)}")


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
# SERVIR FRONTEND (ultra compatível)
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
