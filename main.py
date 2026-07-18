"""
ENGAJAÍ — Backend FastAPI
Deploy no Render

Variáveis de ambiente necessárias:
- DEEPSEEK_API_KEY_1, DEEPSEEK_API_KEY_2, ... (textos curtos)
- GROQ_API_KEY_1, GROQ_API_KEY_2, ... (roteiros longos)
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

# ========== CARREGAR MÚLTIPLAS CHAVES ==========
def carregar_chaves(prefixo: str):
    chaves = []
    for i in range(1, 11):
        key = os.getenv(f"{prefixo}_{i}", "")
        if key:
            chaves.append(key)
    return chaves

DEEPSEEK_API_KEYS = carregar_chaves("DEEPSEEK_API_KEY")
GROQ_API_KEYS = carregar_chaves("GROQ_API_KEY")

if not DEEPSEEK_API_KEYS:
    raise Exception("Nenhuma chave DeepSeek configurada. Defina DEEPSEEK_API_KEY_1.")
if not GROQ_API_KEYS:
    raise Exception("Nenhuma chave Groq configurada. Defina GROQ_API_KEY_1.")

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")
TRENDSMCP_API_KEY = os.getenv("TRENDSMCP_API_KEY", "")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
JWT_SECRET = os.getenv("JWT_SECRET", "contentforge-secret-change-me")
DEEPSEEK_MODEL = "deepseek-chat"
DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions"
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
def limpar_e_extrair_json(texto: str) -> dict:
    texto = re.sub(r'^```(?:json)?\s*', '', texto.strip())
    texto = re.sub(r'\s*```$', '', texto)
    try: return json.loads(texto)
    except: pass
    match = re.search(r'\{.*\}', texto, re.DOTALL)
    if match:
        try: return json.loads(match.group(0))
        except: pass
    return {}

def normalizar_chaves_json(dados: dict) -> dict:
    mapa = {'toreiro':'roteiro','ideiaedicao':'ideiaEdicao','ideia_edicao':'ideiaEdicao',
            'ideiasedicao':'ideiaEdicao','ideiasEdicao':'ideiaEdicao'}
    corrigido = {}
    for k, v in dados.items():
        chave = mapa.get(k.strip().lower(), k)
        corrigido[chave] = v
    return corrigido

def chamar_deepseek_com_chave(prompt: str, indice_chave: int, max_tokens: int = 500) -> str:
    if indice_chave < len(DEEPSEEK_API_KEYS):
        try:
            api_key = DEEPSEEK_API_KEYS[indice_chave]
            headers = {"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"}
            request_body = {
                "model": DEEPSEEK_MODEL,
                "messages": [
                    {"role": "system", "content": "You are a multilingual content creation specialist. Reply ONLY with a valid JSON object."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.8, "max_tokens": max_tokens,
                "response_format": {"type": "json_object"}
            }
            resp = requests.post(DEEPSEEK_URL, headers=headers, json=request_body, timeout=60)
            if resp.status_code == 429:
                print(f"[DeepSeek] Chave {indice_chave+1} esgotada.", flush=True)
            else:
                if not resp.ok:
                    raise HTTPException(502, detail=f"Erro DeepSeek: {resp.text}")
                dados = resp.json()
                return dados["choices"][0]["message"]["content"]
        except HTTPException:
            raise
        except Exception as e:
            print(f"[DeepSeek] Erro chave {indice_chave+1}: {e}", flush=True)

    for idx, api_key in enumerate(DEEPSEEK_API_KEYS):
        if idx == indice_chave:
            continue
        try:
            headers = {"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"}
            request_body = {
                "model": DEEPSEEK_MODEL,
                "messages": [
                    {"role": "system", "content": "You are a multilingual content creation specialist. Reply ONLY with a valid JSON object."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.8, "max_tokens": max_tokens,
                "response_format": {"type": "json_object"}
            }
            resp = requests.post(DEEPSEEK_URL, headers=headers, json=request_body, timeout=60)
            if resp.status_code == 429:
                print(f"[DeepSeek] Chave fallback {idx+1} também esgotada.", flush=True)
                continue
            if not resp.ok:
                raise HTTPException(502, detail=f"Erro DeepSeek: {resp.text}")
            dados = resp.json()
            return dados["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"[DeepSeek] Erro chave fallback {idx+1}: {e}", flush=True)
            continue

    raise HTTPException(429, detail="Todas as chaves DeepSeek atingiram o limite.")


def chamar_groq_com_chave(prompt: str, indice_chave: int) -> str:
    if indice_chave < len(GROQ_API_KEYS):
        try:
            api_key = GROQ_API_KEYS[indice_chave]
            headers = {"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"}
            request_body = {
                "model": GROQ_MODEL,
                "messages": [
                    {"role": "system", "content": "You are a multilingual content creation specialist. Reply ONLY with a valid JSON object."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.8, "max_tokens": 4000,
            }
            resp = requests.post(GROQ_URL, headers=headers, json=request_body, timeout=90)
            if resp.status_code == 429:
                print(f"[Groq] Chave {indice_chave+1} esgotada.", flush=True)
            else:
                if not resp.ok:
                    raise HTTPException(502, detail=f"Erro Groq: {resp.text}")
                dados = resp.json()
                return dados["choices"][0]["message"]["content"]
        except HTTPException:
            raise
        except Exception as e:
            print(f"[Groq] Erro chave {indice_chave+1}: {e}", flush=True)

    for idx, api_key in enumerate(GROQ_API_KEYS):
        if idx == indice_chave:
            continue
        try:
            headers = {"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"}
            request_body = {
                "model": GROQ_MODEL,
                "messages": [
                    {"role": "system", "content": "You are a multilingual content creation specialist. Reply ONLY with a valid JSON object."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.8, "max_tokens": 4000,
            }
            resp = requests.post(GROQ_URL, headers=headers, json=request_body, timeout=90)
            if resp.status_code == 429:
                print(f"[Groq] Chave fallback {idx+1} também esgotada.", flush=True)
                continue
            if not resp.ok:
                raise HTTPException(502, detail=f"Erro Groq: {resp.text}")
            dados = resp.json()
            return dados["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"[Groq] Erro chave fallback {idx+1}: {e}", flush=True)
            continue

    raise HTTPException(429, detail="Todas as chaves Groq atingiram o limite.")
    def pesquisar_tendencias_youtube(tema: str) -> str:
    if not YOUTUBE_API_KEY: return ""
    try:
        url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&q={urllib.parse.quote(tema)}&type=video&order=viewCount&maxResults=5&relevanceLanguage=pt&key={YOUTUBE_API_KEY}"
        resp = requests.get(url, timeout=10)
        if not resp.ok: return ""
        videos = resp.json().get("items", [])
        linhas = [f'{i+1}. "{v["snippet"]["title"]}" (Canal: {v["snippet"]["channelTitle"]})' for i, v in enumerate(videos)]
        return f'Tendências reais do YouTube sobre "{tema}":\n' + "\n".join(linhas)
    except Exception as e:
        print(f"[YouTube API] Erro: {e}")
        return ""

def pesquisar_tendencias_mcp(tema: str, plataforma: str) -> str:
    if not TRENDSMCP_API_KEY: return ""
    try:
        fonte = "tiktok" if plataforma == "tiktok" else "google trends"
        resp = requests.post("https://api.trendsmcp.ai/api",
                            headers={"Content-Type": "application/json", "Authorization": f"Bearer {TRENDSMCP_API_KEY}"},
                            json={"source": fonte, "keyword": tema}, timeout=10)
        if not resp.ok: return ""
        dados = resp.json()
        corpo = dados.get("body", [])
        if isinstance(corpo, str): corpo = json.loads(corpo)
        if not isinstance(corpo, list) or len(corpo) < 5: return ""
        ultimos = corpo[-5:]
        linhas = [f"- Data: {p.get('date', 'N/A')}, Popularidade: {p.get('value', 'N/A')}/100" for p in ultimos]
        return f'Dados de tendência do Trends MCP ({fonte}) para "{tema}":\n' + "\n".join(linhas)
    except Exception as e:
        print(f"[Trends MCP] Erro: {e}")
        return ""

def fallback_pesquisa(tema: str, plataforma: str) -> str:
    prompt = f"Com base no seu conhecimento, aja como um especialista em tendências do {plataforma}. Liste 3 tópicos em alta sobre '{tema}', hashtags relevantes e estilo de conteúdo."
    return chamar_deepseek_com_chave(prompt, indice_chave=0, max_tokens=300)

# ========== CONTROLE DE LIMITES ==========
async def get_plano_usuario(user_id: str) -> str:
    try:
        res = supabase.table("users").select("plan").eq("id", user_id).execute()
        return res.data[0].get("plan", "free") if res.data else "free"
    except: return "free"

async def get_uso_diario(user_id: str) -> int:
    try:
        hoje = datetime.now().strftime("%Y-%m-%d")
        res = supabase.table("usage_logs").select("*").eq("user_id", user_id).gte("created_at", hoje).execute()
        return len(res.data) if res.data else 0
    except: return 0

async def pode_gerar(user_id: str) -> tuple:
    plano = await get_plano_usuario(user_id)
    limite = 10 if plano == "pro" else 3
    uso = await get_uso_diario(user_id)
    return uso < limite, max(0, limite - uso)

async def registrar_uso(user_id: str, action_type: str):
    if not user_id or not isinstance(user_id, str) or len(user_id) < 5:
        print(f"[DEBUG] user_id inválido para inserção: {repr(user_id)}")
        return
    data = {"user_id": user_id, "action_type": action_type, "created_at": datetime.now().isoformat()}
    print(f"[DEBUG] Inserindo usage_logs: {data}")
    try:
        res = supabase.table("usage_logs").insert(data).execute()
        print(f"[DEBUG] Inserção OK: {res}")
    except Exception as e:
        print(f"[Supabase] ERRO ao inserir usage_logs:")
        traceback.print_exc()

async def verificar_status_assinatura(user_id: str):
    try:
        search = mp_sdk.preapproval().search({"external_reference": user_id})
        if search.get("status") == 200:
            results = search["response"]["results"]
            if not results:
                supabase.table("users").update({"plan": "free"}).eq("id", user_id).execute()
                return {"status": "free", "mensagem": "Nenhuma assinatura"}
            sub = results[0]
            status = sub.get("status", "cancelled")
            if status != "authorized":
                supabase.table("users").update({"plan": "free"}).eq("id", user_id).execute()
                return {"status": "free", "mensagem": f"Assinatura {status}"}
            return {"status": "pro", "mensagem": "Ativa"}
        return {"status": "unknown", "mensagem": "Não foi possível verificar"}
    except Exception as e:
        print(f"[Verificação Assinatura] Erro: {e}")
        return {"status": "error", "mensagem": str(e)}

# ==========================================
# ENDPOINT PRINCIPAL DE GERAÇÃO (DIVISÃO DE TAREFAS)
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
        pode, restante = await pode_gerar(user_id)
        if not pode:
            raise HTTPException(402, detail="Limite diário atingido. Faça upgrade para o Plano Pro para gerar até 10 ideias.")

    nome_plataforma = {"tiktok": "TikTok", "instagram": "Instagram", "youtube": "YouTube"}[req.plataforma]

    # Pesquisa de tendências
    dados_tendencias = ""
    fonte = "fallback"
    if req.plataforma == "youtube":
        dados_tendencias = pesquisar_tendencias_youtube(req.tema)
        if dados_tendencias: fonte = "youtube_api"
    else:
        dados_tendencias = pesquisar_tendencias_mcp(req.tema, req.plataforma)
        if dados_tendencias: fonte = "trends_mcp"
    if not dados_tendencias:
        dados_tendencias = fallback_pesquisa(req.tema, nome_plataforma) or ""

    # Instruções da plataforma
    instrucoes = ""
    if req.plataforma == "youtube":
        if idioma == "en":
            instrucoes = """YouTube: Objective title (max 75 chars). Long description (150-300 words) as mini article. 3-5 strategic hashtags at the end. Long/medium video script with strong hook and call to action."""
        else:
            instrucoes = """YouTube: Título objetivo (máx 75 caracteres). Descrição longa (150-300 palavras) como mini artigo. 3-5 hashtags estratégicas no final. Roteiro para vídeo longo/médio com gancho forte e call to action."""
    elif req.plataforma == "tiktok":
        if idioma == "en":
            instrucoes = """TikTok: Eye-catching title with long-tail keywords. Short description (100 chars). Few hashtags (1-2 trending, 1-2 niche, 1 brand). Dynamic short vertical script with explosive hook and quick cuts."""
        else:
            instrucoes = """TikTok: Título chamativo com palavras-chave de cauda longa. Descrição curta (100 caracteres). Poucas hashtags (1-2 de tendência, 1-2 de nicho, 1 da marca). Roteiro curto vertical dinâmico com gancho explosivo e cortes rápidos."""
    else:
        if idioma == "en":
            instrucoes = """Instagram: Creative title with main keyword in first 3 seconds. Description with strong hook and SEO. 3-5 relevant hashtags. Visually attractive Reel script encouraging saves and shares."""
        else:
            instrucoes = """Instagram: Título criativo com palavra-chave nos primeiros 3 segundos. Descrição com gancho forte e SEO. 3-5 hashtags relevantes. Roteiro para Reels visualmente atraente que incentive salvar e compartilhar."""

    # ========== PASSO 1: Título + Hashtags (DeepSeek 1) ==========
    prompt_titulo_hashtags = f"""{instrucoes}

Tema do vídeo: "{req.tema}"

Dados de tendências:
{f"DADOS:\n{dados_tendencias}\n" if dados_tendencias else "Sem dados externos."}

Gere APENAS um JSON com estas chaves:
- "titulo": título chamativo e otimizado para {nome_plataforma} (máx. 100 caracteres).
- "hashtags": string única com hashtags separadas por espaço (ex.: "#tag1 #tag2 #tag3").

Responda SOMENTE com o JSON puro, sem markdown."""
    resposta_titulo = chamar_deepseek_com_chave(prompt_titulo_hashtags, indice_chave=0, max_tokens=300)
    dados_titulo = normalizar_chaves_json(limpar_e_extrair_json(resposta_titulo))
    titulo = dados_titulo.get("titulo") or f"{req.tema.split()[0].capitalize()}: Ideia Principal"
    hashtags = dados_titulo.get("hashtags", "")
    if isinstance(hashtags, list):
        hashtags = " ".join(f"#{h.strip().lstrip('#')}" for h in hashtags if h.strip())
    if not hashtags:
        palavras = req.tema.split()[:3]
        hashtags = " ".join([f"#{p.capitalize()}" for p in palavras]) + " #conteudo #viral"

    # ========== PASSO 2: Descrição (DeepSeek 2) ==========
    prompt_descricao = f"""{instrucoes}

Tema: "{req.tema}"
Título: "{titulo}"

Gere APENAS um JSON com a chave:
- "descricao": descrição envolvente com call-to-action e palavras-chave (máx. 400 caracteres).

Responda SOMENTE com o JSON puro, sem markdown."""
    resposta_desc = chamar_deepseek_com_chave(prompt_descricao, indice_chave=1, max_tokens=400)
    dados_desc = normalizar_chaves_json(limpar_e_extrair_json(resposta_desc))
    descricao = dados_desc.get("descricao") or f"Conteúdo sobre {req.tema}. Assista e compartilhe!"

    # ========== PASSO 3: Roteiro (Groq 1) ==========
    prompt_roteiro = f"""Você é um criador de conteúdo viral especializado em {nome_plataforma}.
Crie o roteiro COMPLETO para o vídeo com base nas informações abaixo.

Tema: "{req.tema}"
Título: "{titulo}"
Descrição: "{descricao}"
Hashtags: "{hashtags}"

Instruções da plataforma: {instrucoes}
Dados de tendências: {dados_tendencias if dados_tendencias else "Nenhum"}

Gere APENAS um JSON com a chave:
- "roteiro": string única com o roteiro completo, dividido em cenas com [CENA X – ABERTURA (0s-3s)], descrevendo enquadramento, falas, sons e transições. Adapte ao formato da plataforma ({'Shorts/Reels' if req.plataforma in ['tiktok', 'instagram'] else 'vídeo longo/médio'}).

Responda SOMENTE com o JSON puro, sem markdown."""
    resposta_roteiro = chamar_groq_com_chave(prompt_roteiro, indice_chave=0)
    dados_roteiro = normalizar_chaves_json(limpar_e_extrair_json(resposta_roteiro))
    roteiro = dados_roteiro.get("roteiro")
    if isinstance(roteiro, list):
        roteiro = "\n".join([f"[{c.get('nome', 'Cena')}] {c.get('fala', '')}" for c in roteiro])
    if not roteiro:
        roteiro = f"[ABERTURA] Apresentação do tema '{req.tema}'. [DESENVOLVIMENTO] Principais pontos. [ENCERRAMENTO] Chamada para ação."

    # ========== PASSO 4: Ideia de Edição + Tendências (Groq 2) ==========
    prompt_edicao = f"""Você é um especialista em edição de vídeos para {nome_plataforma}.
Crie a ideia de edição e identifique tendências com base nas informações abaixo.

Tema: "{req.tema}"
Título: "{titulo}"
Descrição: "{descricao}"
Hashtags: "{hashtags}"
Roteiro: {roteiro[:500]}... (resumo)

Gere APENAS um JSON com as chaves:
- "ideiaEdicao": string única descritiva com NO MÍNIMO 150 PALAVRAS, incluindo paleta de cores (hex), fontes, filtros, música (gênero e BPM), efeitos sonoros e elementos gráficos.
- "tendencias": array de 3 strings curtas sobre tendências identificadas.

Responda SOMENTE com o JSON puro, sem markdown."""
    resposta_edicao = chamar_groq_com_chave(prompt_edicao, indice_chave=1)
    dados_edicao = normalizar_chaves_json(limpar_e_extrair_json(resposta_edicao))

    ideia_edicao = dados_edicao.get("ideiaEdicao")
    if isinstance(ideia_edicao, list):
        ideia_edicao = "\n".join(ideia_edicao)
    if not ideia_edicao or len(ideia_edicao.strip()) < 10:
        ideia_edicao = "Paleta: #0A0A0A, #FFD700, #00E5FF. Fonte Montserrat. Música eletrônica 120 BPM. Cortes rápidos com glitch."

    tendencias = dados_edicao.get("tendencias", [])
    if not isinstance(tendencias, list) or not tendencias:
        tendencias = [req.tema, f"Dicas de {req.tema}", f"Tendências em {req.tema}"]

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
        "fonteTendencias": fonte,
    }
# ==========================================
# ENDPOINT DE SEQUÊNCIA DE 10 IDEIAS
# ==========================================

@app.post("/api/gerar-sequencia")
async def gerar_sequencia(req: RequisicaoSequencia, request: Request):
    if not req.tema.strip() or req.plataforma not in ("tiktok", "instagram", "youtube"):
        raise HTTPException(400, detail="Dados inválidos")
    user_id = get_current_user(request)
    if await get_plano_usuario(user_id) != "pro":
        raise HTTPException(402, detail="Recurso exclusivo para assinantes Pro.")

    idioma = req.idioma if req.idioma in ("pt", "en") else "pt"
    nome_plataforma = {"tiktok": "TikTok", "instagram": "Instagram", "youtube": "YouTube"}[req.plataforma]

    if idioma == "en":
        prompt = f"""You are a content strategist specializing in {nome_plataforma}.
A creator is producing a series of videos EXACTLY about this topic: "{req.tema}".
He needs 10 title ideas and short descriptions for the next videos, ALL WITHIN THIS SAME TOPIC.

Generate EXACTLY 10 ideas. Each idea must have:
- "titulo": a short, catchy and SPECIFIC title about "{req.tema}" (max. 80 characters). DO NOT use generic titles like "How to give CONTINUATION".
- "temaCurto": a short phrase (max. 100 characters) explaining the specific focus of that video within the topic "{req.tema}".

IMPORTANT RULES:
- ALL ideas must be EXACTLY about "{req.tema}". DO NOT stray to other subjects.
- Vary the angles within the same subject: tutorials, lists, common mistakes, cases, tools, curiosities, etc.
- Optimize for SEO on {nome_plataforma}.

Reply ONLY with a pure JSON containing the key "ideias", which is an array of 10 objects with "titulo" and "temaCurto"."""
    else:
        prompt = f"""Você é um estrategista de conteúdo especializado em {nome_plataforma}.
Um criador está fazendo uma série de vídeos EXATAMENTE sobre este tema: "{req.tema}".
Ele precisa de 10 ideias de títulos e descrições curtas para os próximos vídeos, TODAS DENTRO DESTE MESMO TEMA.

Gere EXATAMENTE 10 ideias. Cada ideia deve ter:
- "titulo": um título curto, chamativo e ESPECÍFICO sobre "{req.tema}" (máx. 80 caracteres). NÃO use títulos genéricos como "Dê um jeito de dar CONTINUAÇÃO".
- "temaCurto": uma frase curta (máx. 100 caracteres) que explique o foco específico daquele vídeo dentro do tema "{req.tema}".

REGRAS IMPORTANTES:
- TODAS as ideias devem ser EXATAMENTE sobre "{req.tema}". NÃO desvie para outros assuntos.
- Varie os ângulos dentro do mesmo assunto: tutoriais, listas, erros comuns, cases, ferramentas, curiosidades, etc.
- Otimize para SEO no {nome_plataforma}.

Responda APENAS com um JSON puro contendo a chave "ideias", que é um array de 10 objetos com "titulo" e "temaCurto"."""

    resposta = chamar_deepseek_com_chave(prompt, indice_chave=0, max_tokens=1000)
    dados = limpar_e_extrair_json(resposta)
    ideias = dados.get("ideias", [])
    if not isinstance(ideias, list) or len(ideias) == 0:
        if idioma == "en":
            ideias = [{"titulo": f"{req.tema} - Part {i+1}", "temaCurto": f"Deepening in {req.tema}"} for i in range(10)]
        else:
            ideias = [{"titulo": f"{req.tema} - Parte {i+1}", "temaCurto": f"Aprofundando em {req.tema}"} for i in range(10)]
    while len(ideias) < 10:
        if idioma == "en":
            ideias.append({"titulo": f"{req.tema} - Extra {len(ideias)+1}", "temaCurto": f"More about {req.tema}"})
        else:
            ideias.append({"titulo": f"{req.tema} - Extra {len(ideias)+1}", "temaCurto": f"Mais sobre {req.tema}"})

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
        "deepseek_configurado": len(DEEPSEEK_API_KEYS) > 0,
        "groq_configurado": len(GROQ_API_KEYS) > 0,
        "youtube_configurado": bool(YOUTUBE_API_KEY),
        "trends_mcp_configurado": bool(TRENDSMCP_API_KEY),
        "google_login_configurado": bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET),
    }

# ==========================================
# ENDPOINT DE HEALTH CHECK
# ==========================================

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

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
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
else:
    @app.get("/")
    async def erro_dist():
        return {"erro": "Pasta dist nao encontrada"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
