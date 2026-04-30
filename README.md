# ContentForge AI — Assistente de Criação de Conteúdo

App completo para gerar conteúdo viral para redes sociais usando IA real, com login via Google.

## 🏗️ Arquitetura

```
Usuário → Login Google → Frontend (React/Vite) → Backend (FastAPI) → APIs externas
                                                              ├── Groq API (IA - obrigatória)
                                                              ├── Google OAuth (login - obrigatório)
                                                              ├── YouTube API (tendências - opcional)
                                                              └── Trends MCP API (tendências - opcional)
```

**As chaves API ficam APENAS no servidor.** O usuário do app nunca vê nenhuma chave.

## 🔧 Fluxo de Geração

### YouTube
1. Backend pesquisa vídeos em alta via **YouTube Data API**
2. Backend envia tendências + tema para **Groq (Llama 4 Scout)**
3. Groq gera: título, descrição, hashtags, roteiro, ideias de edição

### TikTok / Instagram
1. Backend pesquisa tendências via **Trends MCP API**
2. Backend envia tendências + tema para **Groq (Llama 4 Scout)**
3. Groq gera o conteúdo completo

### Fallback automático
Se YouTube API ou Trends MCP falharem, o Groq faz a pesquisa de tendências sozinho.

## 🔐 Login com Google

Fluxo OAuth 2.0 real:
1. Usuário clica "Entrar com Google"
2. Redireciona para tela de login do Google
3. Google redireciona de volta com código de autorização
4. Backend troca código por dados do usuário
5. Cria JWT e envia para o frontend
6. Sessão mantida por 7 dias

## 🚀 Deploy no Render

### 1. Suba o código no GitHub
```bash
git init
git add .
git commit -m "ContentForge AI"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPO.git
git push -u origin main
```

### 2. No Render, crie um novo Web Service:
- **Runtime:** Python
- **Build Command:** `npm install && npm run build && cp -r dist backend/dist`
- **Start Command:** `cd backend && pip install -r requirements.txt && python main.py`

### 3. Configure as variáveis de ambiente:

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `GROQ_API_KEY` | ✅ | Chave da API Groq — [console.groq.com/keys](https://console.groq.com/keys) |
| `GOOGLE_CLIENT_ID` | ✅ | Client ID do Google OAuth |
| `GOOGLE_CLIENT_SECRET` | ✅ | Client Secret do Google OAuth |
| `JWT_SECRET` | ✅ | String aleatória para assinar tokens (gerar auto no Render) |
| `YOUTUBE_API_KEY` | ❌ | Chave YouTube Data API |
| `TRENDSMCP_API_KEY` | ❌ | Chave Trends MCP — [trendsmcp.ai](https://www.trendsmcp.ai/) |

### 4. Configurar Google OAuth

No [Google Cloud Console](https://console.cloud.google.com/):

1. Vá em **APIs & Services → Credentials**
2. Crie um **OAuth 2.0 Client ID** (tipo "Web application")
3. Em **Authorized redirect URIs**, adicione:
   ```
   https://SEU-APP.onrender.com/api/auth/google/callback
   ```
4. Copie o **Client ID** e **Client Secret** para as variáveis no Render

### 5. Obter as chaves:

- **Groq** (grátis): https://console.groq.com/keys
- **Google OAuth**: https://console.cloud.google.com/apis/credentials
- **YouTube API** (grátis): https://console.cloud.google.com/apis/credentials (mesmo projeto do OAuth)
- **Trends MCP** (100 req/mês grátis): https://www.trendsmcp.ai/

## 💻 Rodar Localmente

```bash
# Instalar dependências do frontend
npm install

# Buildar o frontend
npm run build
cp -r dist backend/dist

# Instalar dependências do backend
cd backend
pip install -r requirements.txt

# Configurar variáveis de ambiente
export GROQ_API_KEY="sua_chave_aqui"
export GOOGLE_CLIENT_ID="seu_client_id_aqui"
export GOOGLE_CLIENT_SECRET="seu_client_secret_aqui"
export JWT_SECRET="uma-string-aleatoria-longa"
export YOUTUBE_API_KEY="sua_chave_youtube"          # opcional
export TRENDSMCP_API_KEY="sua_chave_trends"          # opcional

# Iniciar servidor
python main.py
```

Acesse: http://localhost:8000

## 📁 Estrutura do Projeto

```
├── src/                          # Frontend (React + Vite + Tailwind)
│   ├── components/
│   │   ├── LoginPage.tsx         # Login com Google OAuth
│   │   ├── Header.tsx            # Barra superior com status
│   │   ├── Dashboard.tsx         # Formulário principal
│   │   ├── LoadingState.tsx      # Animação de carregamento
│   │   └── ResultDisplay.tsx     # Exibição do resultado
│   ├── lib/
│   │   └── api.ts                # Serviço de chamadas à API
│   ├── types.ts                  # Tipos TypeScript
│   └── App.tsx                   # Componente principal
├── backend/
│   ├── main.py                   # Servidor FastAPI (API + OAuth + Frontend)
│   └── requirements.txt          # Dependências Python
├── render.yaml                   # Configuração Render
├── .gitignore
└── README.md
```
