import { useState, useCallback, useEffect } from 'react';
import { User, Platform, AppState, GeneratedContent } from './types';
import { gerarConteudo, verificarStatus, StatusBackend, salvarUsuario, carregarUsuario, limparUsuario } from './api';
import PaginaLogin from './LoginPage';
import Header from './Header';
import Dashboard from './Dashboard';
import EstadoCarregando from './LoadingState';
import ExibirResultado from './ResultDisplay';


function TransicaoPagina({ children, pagina }: { children: React.ReactNode; pagina: string }) {
  return (
    <div key={pagina} className="animate-fade-in">
      {children}
    </div>
  );
}

export default function App() {
  const [estadoApp, setEstadoApp] = useState<AppState>('login');
  const [usuario, setUsuario] = useState<User | null>(null);
  const [conteudo, setConteudo] = useState<GeneratedContent | null>(null);
  const [temaAtual, setTemaAtual] = useState('');
  const [plataformaAtual, setPlataformaAtual] = useState<Platform | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [statusBackend, setStatusBackend] = useState<StatusBackend | null>(null);

  // Ao montar: verificar callback do Google OAuth e sessão salva
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    const nomeParam = params.get('nome');
    const emailParam = params.get('email');
    const avatarParam = params.get('avatar');
    const erroParam = params.get('erro');

    // Se veio erro do backend
    if (erroParam) {
      const mensagens: Record<string, string> = {
        google_nao_configurado: 'Login com Google não está configurado no servidor. Use o modo demonstração.',
        falha_autenticacao: 'Falha na autenticação com Google. Tente novamente.',
        falha_dados_usuario: 'Não foi possível obter seus dados do Google. Tente novamente.',
        erro_interno: 'Erro interno no servidor. Tente novamente mais tarde.',
      };
      setErro(mensagens[erroParam] || 'Erro ao fazer login. Tente novamente.');
      // Limpar URL
      window.history.replaceState({}, '', '/');
    }

    // Se veio token do Google OAuth (callback bem-sucedido)
    if (tokenParam && nomeParam) {
      const avatar = avatarParam || `https://ui-avatars.com/api/?name=${encodeURIComponent(nomeParam)}&background=6366f1&color=fff&size=128&bold=true`;
      const novoUsuario: User = {
        name: nomeParam,
        email: emailParam || '',
        avatar,
      };
      setUsuario(novoUsuario);
      salvarUsuario(novoUsuario, tokenParam);
      setEstadoApp('dashboard');
      // Limpar URL
      window.history.replaceState({}, '', '/');
      return;
    }

    // Se já tem sessão salva
    const sessao = carregarUsuario();
    if (sessao) {
      setUsuario(sessao.usuario);
      setEstadoApp('dashboard');
    }
  }, []);

  // Verificar status do backend quando entra no dashboard
  useEffect(() => {
    if (estadoApp === 'dashboard') {
      verificarStatus().then(status => setStatusBackend(status));
    }
  }, [estadoApp]);

  const aoEntrar = useCallback((nome: string, email: string, avatar?: string) => {
    const foto = avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=6366f1&color=fff&size=128&bold=true`;
    const novoUsuario: User = {
      name: nome,
      email,
      avatar: foto,
    };
    setUsuario(novoUsuario);
    // Login demo não tem token real
    if (!avatar) {
      salvarUsuario(novoUsuario, 'demo-token');
    }
    setEstadoApp('dashboard');
  }, []);

  const aoSair = useCallback(() => {
    setUsuario(null);
    setConteudo(null);
    setTemaAtual('');
    setPlataformaAtual(null);
    setErro(null);
    limparUsuario();
    setEstadoApp('login');
  }, []);

  const aoGerar = useCallback(async (tema: string, plataforma: Platform) => {
    setTemaAtual(tema);
    setPlataformaAtual(plataforma);
    setErro(null);
    setEstadoApp('loading');

    try {
      const resultado = await gerarConteudo(tema, plataforma);
      setConteudo(resultado);
      setEstadoApp('result');
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro desconhecido ao gerar conteúdo. Tente novamente.';
      setErro(mensagem);
      setEstadoApp('dashboard');
    }
  }, []);

  const aoVoltar = useCallback(() => {
    setConteudo(null);
    setErro(null);
    setEstadoApp('dashboard');
  }, []);

  const aoRegenerar = useCallback(() => {
    if (temaAtual && plataformaAtual) {
      aoGerar(temaAtual, plataformaAtual);
    }
  }, [temaAtual, plataformaAtual, aoGerar]);

  // Toast de erro
  const ToastErro = erro && (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-slide-up max-w-md w-[calc(100%-2rem)]">
      <div className="glass rounded-xl px-5 py-3 flex items-center gap-3 shadow-2xl border border-red-500/20">
        <div className="w-8 h-8 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
          <span className="text-red-400 text-sm">⚠️</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-red-300 font-medium">Erro</p>
          <p className="text-xs text-white/40 break-words">{erro}</p>
        </div>
        <button
          onClick={() => setErro(null)}
          className="ml-2 text-white/30 hover:text-white/60 text-lg transition-colors flex-shrink-0"
        >
          ✕
        </button>
      </div>
    </div>
  );

  // Tela de login
  if (estadoApp === 'login') {
    return (
      <>
        {ToastErro}
        <PaginaLogin aoEntrar={aoEntrar} statusBackend={statusBackend} />
      </>
    );
  }

  // Telas autenticadas
  const backendOk = statusBackend?.groq_configurado ?? false;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Header
        usuario={usuario!}
        aoSair={aoSair}
        statusBackend={statusBackend}
      />

      <TransicaoPagina pagina={estadoApp}>
        {estadoApp === 'dashboard' && (
          <Dashboard
            aoGerar={aoGerar}
            carregando={false}
            backendOk={backendOk}
            statusBackend={statusBackend}
          />
        )}

        {estadoApp === 'loading' && plataformaAtual && (
          <EstadoCarregando tema={temaAtual} plataforma={plataformaAtual} />
        )}

        {estadoApp === 'result' && conteudo && (
          <ExibirResultado
            conteudo={conteudo}
            aoVoltar={aoVoltar}
            aoRegenerar={aoRegenerar}
          />
        )}
      </TransicaoPagina>

      {ToastErro}
    </div>
  );
}
