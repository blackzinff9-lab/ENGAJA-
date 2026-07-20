"""
ENGAJAÍ — Backend FastAPI (Versão Estável Groq)
Deploy no Render

Variáveis de ambiente necessárias:
- GROQ_API_KEY (obrigatória)
- YOUTUBE_API_KEY, TRENDSMCP_API_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- JWT_SECRET, MP_ACCESS_TOKEN, SUPABASE_URL, SUPABASE_KEY (service_role)
"""

from fastapi import FastAPI, HTTPException, Query, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from pydantic import BaseModel
import requests, json, os, jwt, urllib.parse, re, traceback, uuid
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from supabase import create_client, Client
import mercadopago

load_dotenv()

app = FastAPI(title="ENGAJAÍ API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# ========== CONFIGURAÇÕES ==========
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")
TRENDSMCP_API_KEY = os.getenv("TRENDSMCP_API_KEY", "")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
JWT_SECRET = os.getenv("JWT_SECRET", "contentforge-secret-change-me")
GROQ_MODEL = "llama-3.3-70b-versatile"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MP_ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

mp_sdk = mercadopago.SDK(MP_ACCESS_TOKEN)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_base_url(request=None):
    if r := os.getenv("RENDER_EXTERNAL_URL"): return r.rstrip("/")
    if r := os.getenv("BASE_URL"): return r.rstrip("/")
    if request:
        scheme = request.url.scheme
        host = request.headers.get("host", "localhost:8000")
        return f"{scheme}://{host}"
    return "http://localhost:8000"

class RequisicaoConteudo(BaseModel):
    tema: str
    plataforma: str
    idioma: str = "pt"

class RequisicaoSequencia(BaseModel):
    tema: str
    plataforma: str
    idioma: str = "pt"

# ========== GOOGLE OAUTH ==========
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
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{params}")

@app.get("/api/auth/google/callback")
async def google_callback(request: Request, code: str = Query(...)):
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        return RedirectResponse("/?erro=google_nao_configurado")
    base_url = get_base_url(request)
    redirect_uri = f"{base_url}/api/auth/google/callback"
    try:
        token_response = requests.post("https://oauth2.googleapis.com/token", data={
            "code": code, "client_id": GOOGLE_CLIENT_ID, "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": redirect_uri, "grant_type": "authorization_code"
        }, timeout=15)
        if not token_response.ok: return RedirectResponse("/?erro=falha_autenticacao")
        tokens = token_response.json()
        access_token = tokens.get("access_token", "")
        userinfo = requests.get("https://www.googleapis.com/oauth2/v2/userinfo",
                               headers={"Authorization": f"Bearer {access_token}"}, timeout=10)
        if not userinfo.ok: return RedirectResponse("/?erro=falha_dados_usuario")
        user = userinfo.json()
        nome = user.get("name", "Usuário")
        email = user.get("email", "")
        avatar = user.get("picture", f"https://ui-avatars.com/api/?name={urllib.parse.quote(nome)}&background=6366f1&color=fff&size=128&bold=true")
        plano_inicial = "pro" if email in ["gustavofirmino0511@gmail.com", "blackzinff9@gmail.com"] else "free"
        user_id = ""
        try:
            res = supabase.table("users").select("id").eq("email", email).execute()
            if res.data and len(res.data) > 0:
                user_id = res.data[0]["id"]
                supabase.table("users").update({"name": nome, "plan": plano_inicial}).eq("id", user_id).execute()
            else:
                user_id = str(uuid.uuid4())
                supabase.table("users").insert({"id": user_id, "email": email, "name": nome, "plan": plano_inicial}).execute()
        except Exception as e:
            print(f"[Supabase] Erro ao buscar/criar usuário: {e}", flush=True)
            return RedirectResponse("/?erro=erro_interno")
        payload = {"sub": user_id, "nome": nome, "email": email, "avatar": avatar,
                   "exp": datetime.now(timezone.utc) + timedelta(days=7), "iat": datetime.now(timezone.utc)}
        token_jwt = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
        params = urllib.parse.urlencode({"token": token_jwt, "nome": nome, "email": email, "avatar": avatar})
        return RedirectResponse(f"/?{params}")
    except Exception as e:
        print(f"[Google OAuth] Exceção: {e}")
        return RedirectResponse("/?erro=erro_interno")

@app.get("/api/auth/verificar")
async def verificar_token(token: str = Query(...)):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub", "")
        email = payload.get("email", "")
        if email in ["gustavofirmino0511@gmail.com", "blackzinff9@gmail.com"]:
            return {"valido": True, "nome": payload.get("nome", ""), "email": email,
                    "avatar": payload.get("avatar", ""), "sub": user_id, "plano": "pro"}
        plano = "free"
        if user_id:
            try:
                res = supabase.table("users").select("plan").eq("id", user_id).execute()
                if res.data:
                    plano = res.data[0].get("plan", "free")
                    if plano == "pro":
                        verificacao = await verificar_status_assinatura(user_id)
                        if verificacao.get("status") == "free":
                            plano = "free"
            except: pass
        return {"valido": True, "nome": payload.get("nome", ""), "email": email,
                "avatar": payload.get("avatar", ""), "sub": user_id, "plano": plano}
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(401, detail="Token inválido")

def get_current_user(request: Request) -> str:
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(401, detail="Token não fornecido")
    token = auth.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload.get("sub", "")
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(401, detail="Token inválido")

# ========== UTILITÁRIOS ==========
def limpar_json(texto: str) -> dict:
    texto = re.sub(r'^```(?:json)?\s*', '', texto.strip())
    texto = re.sub(r'\s*```$', '', texto)
    try: return json.loads(texto)
    except: pass
    match = re.search(r'\{.*\}', texto, re.DOTALL)
    if match:
        try: return json.loads(match.group(0))
        except: pass
    return {}

def normalizar_chaves(dados: dict) -> dict:
    mapa = {'toreiro':'roteiro','ideiaedicao':'ideiaEdicao','ideia_edicao':'ideiaEdicao',
            'ideiasedicao':'ideiaEdicao','ideiasEdicao':'ideiaEdicao'}
    corrigido = {}
    for k, v in dados.items():
        chave = mapa.get(k.strip().lower(), k)
        corrigido[chave] = v
    return corrigido

def chamar_groq(prompt: str, max_tokens: int = 500) -> str:
    if not GROQ_API_KEY:
        raise HTTPException(500, detail="GROQ_API_KEY não configurada")
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {GROQ_API_KEY}"}
    request_body = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": "You are a helpful assistant. Reply ONLY with a valid JSON object."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.8,
        "max_tokens": max_tokens
    }
    resp = requests.post(GROQ_URL, headers=headers, json=request_body, timeout=90)
    if resp.status_code == 429:
        raise HTTPException(429, detail="Limite de requisições Groq atingido.")
    if not resp.ok:
        print(f"[Groq] Erro {resp.status_code}: {resp.text}", flush=True)
        raise HTTPException(502, detail=f"Erro Groq: {resp.text}")
    dados = resp.json()
    return dados["choices"][0]["message"]["content"]

def pesquisar_youtube(tema: str) -> str:
    if not YOUTUBE_API_KEY: return ""
    try:
        url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&q={urllib.parse.quote(tema)}&type=video&order=viewCount&maxResults=3&relevanceLanguage=pt&key={YOUTUBE_API_KEY}"
        resp = requests.get(url, timeout=10)
        if not resp.ok: return ""
        videos = resp.json().get("items", [])
        linhas = [f'{i+1}. {v["snippet"]["title"]}' for i, v in enumerate(videos)]
        return "\n".join(linhas)
    except Exception as e:
        print(f"[YouTube] Erro: {e}")
        return ""

def pesquisar_trendsmcp(tema: str, plataforma: str) -> str:
    if not TRENDSMCP_API_KEY: return ""
    try:
        fonte = "tiktok" if plataforma == "tiktok" else "google trends"
        resp = requests.post(
            "https://api.trendsmcp.ai/api",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {TRENDSMCP_API_KEY}"
            },
            json={"source": fonte, "keyword": tema},
            timeout=10
        )
        if not resp.ok: return ""
        dados = resp.json()
        corpo = dados.get("body", [])
        if isinstance(corpo, str):
            corpo = json.loads(corpo)
        if not isinstance(corpo, list) or len(corpo) < 3: return ""
        ultimos = corpo[-5:]
        linhas = [f"- {p.get('date', 'N/A')}: popularidade {p.get('value', 'N/A')}/100" for p in ultimos]
        return f"Tendências ({fonte}):\n" + "\n".join(linhas)
    except Exception as e:
        print(f"[Trends MCP] Erro: {e}")
        return ""

# ========== CONTROLE DE LIMITES ==========
async def get_plano(user_id: str) -> str:
    try:
        res = supabase.table("users").select("plan").eq("id", user_id).execute()
        return res.data[0].get("plan", "free") if res.data else "free"
    except: return "free"

async def get_uso_hoje(user_id: str) -> int:
    try:
        hoje = datetime.now().strftime("%Y-%m-%d")
        res = supabase.table("usage_logs").select("*").eq("user_id", user_id).gte("created_at", hoje).execute()
        return len(res.data) if res.data else 0
    except: return 0

async def pode_gerar(user_id: str) -> tuple:
    plano = await get_plano(user_id)
    limite = 10 if plano == "pro" else 3
    uso = await get_uso_hoje(user_id)
    return uso < limite, max(0, limite - uso)

async def registrar_uso(user_id: str, action_type: str):
    if not user_id or len(user_id) < 5: return
    data = {"user_id": user_id, "action_type": action_type, "created_at": datetime.now().isoformat()}
    try:
        supabase.table("usage_logs").insert(data).execute()
    except Exception as e:
        print(f"[Supabase] Erro ao registrar uso: {e}")

async def verificar_assinatura(user_id: str):
    try:
        search = mp_sdk.preapproval().search({"external_reference": user_id})
        if search.get("status") == 200:
            results = search["response"]["results"]
            if not results:
                supabase.table("users").update({"plan": "free"}).eq("id", user_id).execute()
                return {"status": "free"}
            sub = results[0]
            if sub.get("status") != "authorized":
                supabase.table("users").update({"plan": "free"}).eq("id", user_id).execute()
                return {"status": "free"}
            return {"status": "pro"}
        return {"status": "unknown"}
    except Exception as e:
        print(f"[Verificação Assinatura] Erro: {e}")
        return {"status": "error"}
# ==========================================
# ENDPOINT PRINCIPAL DE GERAÇÃO (PROMPTS OTIMIZADOS)
# ==========================================

@app.post("/api/gerar")
async def gerar_conteudo(req: RequisicaoConteudo, request: Request):
    if not req.tema.strip() or req.plataforma not in ("tiktok", "instagram", "youtube"):
        raise HTTPException(400, detail="Dados inválidos")

    idioma = req.idioma if req.idioma in ("pt", "en") else "pt"

    user_id = None
    auth = request.headers.get("Authorization")
    if auth and auth.startswith("Bearer "):
        try:
            user_id = get_current_user(request)
        except:
            pass

    if user_id:
        pode, _ = await pode_gerar(user_id)
        if not pode:
            raise HTTPException(402, detail="Limite diário atingido. Faça upgrade para o Plano Pro.")

    nome_plataforma = {"tiktok": "TikTok", "instagram": "Instagram", "youtube": "YouTube"}[req.plataforma]

    # Buscar tendências de múltiplas fontes
    dados_tendencias = ""
    dados_mcp = pesquisar_trendsmcp(req.tema, req.plataforma)
    if dados_mcp:
        dados_tendencias += f"[Trends MCP]\n{dados_mcp}\n\n"
    if req.plataforma == "youtube":
        dados_yt = pesquisar_youtube(req.tema)
        if dados_yt:
            dados_tendencias += f"[YouTube]\n{dados_yt}\n"
    if not dados_tendencias:
        dados_tendencias = "Nenhum dado externo disponível."

    # ========== PASSO 1: Título, descrição e hashtags (OTIMIZADO) ==========
    prompt_curto = f"""Crie conteúdo profissional para {nome_plataforma} sobre: "{req.tema}"

Dados de tendências reais (use como inspiração):
{dados_tendencias}

Gere APENAS um JSON com:
- "titulo": título chamativo e otimizado para SEO (máx 100 caracteres, com gancho emocional ou curiosidade)
- "descricao": descrição envolvente (150-300 caracteres) com call-to-action claro, emojis estratégicos e palavras-chave relevantes
- "hashtags": string única com 5-8 hashtags separadas por espaço (ex: "#tag1 #tag2 #tag3"), misturando tags amplas, de nicho e tendência

Responda em {idioma}. APENAS o JSON, sem markdown."""
    resposta_curta = chamar_groq(prompt_curto, max_tokens=800)
    dados_curtos = normalizar_chaves(limpar_json(resposta_curta))
    titulo = dados_curtos.get("titulo") or f"{req.tema.split()[0].capitalize()}: Ideia Principal"
    descricao = dados_curtos.get("descricao") or f"Conteúdo sobre {req.tema}."
    hashtags = dados_curtos.get("hashtags", "")
    if isinstance(hashtags, list):
        hashtags = " ".join(f"#{h.strip().lstrip('#')}" for h in hashtags if h.strip())
    if not hashtags:
        hashtags = f"#{req.tema.replace(' ', '')} #conteudo #viral"

    # ========== PASSO 2: Roteiro + Ideia de Edição (OTIMIZADO) ==========
    prompt_longo = f"""Crie um roteiro detalhado e uma ideia de edição profissional para {nome_plataforma}: "{req.tema}"

Título: "{titulo}"
Descrição: "{descricao}"
Hashtags: "{hashtags}"

Dados de tendências:
{dados_tendencias}

Gere APENAS um JSON com:
- "roteiro": string única com o roteiro COMPLETO, dividido em cenas numeradas com TEMPOS EXATOS (ex.: [CENA 1 – ABERTURA (0s-3s)]), descreva ENQUADRAMENTO (close, plongée, plano geral), movimentos de câmera, falas COMPLETAS (mínimo 2 frases por cena), texto na tela (para SEO), transições (corte seco, fade, slide) e sons ambientes. Use estrutura de storytelling (gancho → desenvolvimento → clímax → call to action). Mínimo 4 cenas.
- "ideiaEdicao": string descritiva com NO MÍNIMO 150 PALAVRAS, incluindo: paleta de cores (códigos hex), fontes (ex.: Montserrat Bold para títulos), filtros visuais (ex.: Vibrant +20 contraste), sugestão de música (gênero, BPM, clima), efeitos sonoros (ex.: whoosh em transições, pop no texto animado), elementos gráficos (ex.: linhas cinéticas, stick text amarelo, emojis animados), transições específicas entre cenas.
- "tendencias": array com 3 strings curtas sobre tendências identificadas.

Responda em {idioma}. APENAS o JSON, sem markdown."""
    resposta_longa = chamar_groq(prompt_longo, max_tokens=2500)
    dados_longos = normalizar_chaves(limpar_json(resposta_longa))
    roteiro = dados_longos.get("roteiro", f"[ABERTURA] {req.tema}. [DESENVOLVIMENTO] Principais pontos. [ENCERRAMENTO] Call to action.")
    ideia_edicao = dados_longos.get("ideiaEdicao", "Paleta: #0A0A0A, #FFD700, #00E5FF. Fonte Montserrat. Música eletrônica 120 BPM.")
    tendencias_lista = dados_longos.get("tendencias", [req.tema, f"Dicas de {req.tema}", f"Tendências em {req.tema}"])
    if isinstance(tendencias_lista, str):
        tendencias_lista = [tendencias_lista]

    if user_id:
        await registrar_uso(user_id, "gerar")

    return {
        "titulo": titulo,
        "descricao": descricao,
        "hashtags": hashtags,
        "roteiro": roteiro,
        "ideiaEdicao": ideia_edicao,
        "tendencias": tendencias_lista,
        "plataforma": req.plataforma,
        "tema": req.tema,
        "fonteTendencias": "trendsmcp+youtube" if req.plataforma == "youtube" else "trendsmcp",
    }

# ==========================================
# ENDPOINT DE SEQUÊNCIA DE 10 IDEIAS
# ==========================================

@app.post("/api/gerar-sequencia")
async def gerar_sequencia(req: RequisicaoSequencia, request: Request):
    if not req.tema.strip() or req.plataforma not in ("tiktok", "instagram", "youtube"):
        raise HTTPException(400, detail="Dados inválidos")
    user_id = get_current_user(request)
    if await get_plano(user_id) != "pro":
        raise HTTPException(402, detail="Recurso exclusivo para assinantes Pro.")

    idioma = req.idioma if req.idioma in ("pt", "en") else "pt"
    nome_plataforma = {"tiktok": "TikTok", "instagram": "Instagram", "youtube": "YouTube"}[req.plataforma]
    prompt = f"""Gere 10 ideias de títulos e descrições curtas para série de {nome_plataforma}: "{req.tema}"
Responda JSON: "ideias" (array com "titulo" e "temaCurto"). Em {idioma}."""
    resposta = chamar_groq(prompt, max_tokens=1000)
    dados = limpar_json(resposta)
    ideias = dados.get("ideias", [])
    if not isinstance(ideias, list) or len(ideias) == 0:
        ideias = [{"titulo": f"{req.tema} - Parte {i+1}", "temaCurto": "Continuação"} for i in range(10)]
    while len(ideias) < 10:
        ideias.append({"titulo": f"{req.tema} - Extra", "temaCurto": "Mais sobre o tema"})

    await registrar_uso(user_id, "sequencia")
    return {"ideias": ideias[:10], "temaOriginal": req.tema, "plataforma": req.plataforma}

# ==========================================
# MERCADO PAGO
# ==========================================

@app.post("/api/assinar-pro")
async def assinar_pro(request: Request):
    body = await request.json()
    user_id, email = body.get("user_id"), body.get("email")
    if not user_id or not email: raise HTTPException(400, detail="Dados incompletos")
    pref = {
        "items": [{"title": "Plano Pro ENGAJAÍ", "quantity": 1, "unit_price": 14.00, "currency_id": "BRL"}],
        "payer": {"email": email},
        "back_urls": {"success": f"{get_base_url(request)}/sucesso", "failure": f"{get_base_url(request)}/erro", "pending": f"{get_base_url(request)}/pendente"},
        "auto_return": "approved",
        "notification_url": f"{get_base_url(request)}/api/notificacao-pagamento",
        "external_reference": user_id
    }
    try:
        pref_resp = mp_sdk.preference().create(pref)
        if pref_resp.get("status") == 201:
            return {"init_point": pref_resp["response"]["init_point"]}
        raise HTTPException(400, detail="Erro ao criar preferência")
    except Exception as e:
        raise HTTPException(500, detail=f"Erro Mercado Pago: {str(e)}")

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
        raise HTTPException(500, detail=f"Erro webhook: {str(e)}")

@app.get("/api/status")
async def status():
    return {
        "status": "online",
        "groq_configurado": bool(GROQ_API_KEY),
        "youtube_configurado": bool(YOUTUBE_API_KEY),
        "trendsmcp_configurado": bool(TRENDSMCP_API_KEY),
        "google_login_configurado": bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET),
    }

@app.get("/api/health")
async def health():
    return {"status": "ok"}

# ==========================================
# SERVIR FRONTEND (CORRIGIDO)
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
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(404)
        index_file = os.path.join(frontend_path, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        raise HTTPException(404)
else:
    @app.get("/")
    async def erro_dist():
        return {"erro": "Pasta dist nao encontrada"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
