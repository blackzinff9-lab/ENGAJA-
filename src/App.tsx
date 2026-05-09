import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import PaginaLogin from './LoginPage';
import { Platform } from './types';
import { StatusBackend } from './api';
import {
  Zap,
  Sparkles,
  CheckCircle2,
  Menu,
  X
} from 'lucide-react';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [backendOk, setBackendOk] = useState(false);
  const [statusBackend, setStatusBackend] = useState<StatusBackend | null>(null);
  const [conteudoGerado, setConteudoGerado] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null); // dados do usuário logado

  // Verifica se há token JWT na URL (após login Google) ou salvo
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      const nome = params.get('nome') || 'Usuário';
      const email = params.get('email') || '';
      const avatar = params.get('avatar') || '';
      // Agora também obtém o sub e busca o plano do usuário
      fetch(`/api/auth/verificar?token=${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.valido) {
            setUsuario({
              nome: data.nome || nome,
              email: data.email || email,
              avatar: data.avatar || avatar,
              sub: data.sub,   // ID do Supabase
              plano: data.plano || 'free'  // plano retornado pelo backend
            });
          }
        })
        .catch(() => {});
      window.history.replaceState({}, document.title, '/');
    } else {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        fetch(`/api/auth/verificar?token=${savedToken}`)
          .then(res => res.json())
          .then(data => {
            if (data.valido) {
              setUsuario({
                nome: data.nome,
                email: data.email,
                avatar: data.avatar,
                sub: data.sub,
                plano: data.plano || 'free'
              });
            } else {
              localStorage.removeItem('token');
            }
          })
          .catch(() => localStorage.removeItem('token'));
      }
    }
  }, []);

  // Verifica status dos serviços
  useEffect(() => {
    const verificarServicos = async () => {
      try {
        const resposta = await fetch('/api/status');
        const dados = await resposta.json();
        setStatusBackend(dados);
        setBackendOk(dados?.groq_configurado && dados?.youtube_configurado && dados?.trends_mcp_configurado);
      } catch {
        setBackendOk(false);
        setStatusBackend(null);
      }
    };
    verificarServicos();
  }, []);

  const aoGerar = async (tema: string, plataforma: Platform) => {
    setCarregando(true);
    setConteudoGerado(null);
    try {
      const token = localStorage.getItem('token');
      const resposta = await fetch('/api/gerar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`  // envia o token para controle de limite
        },
        body: JSON.stringify({ tema, plataforma }),
      });
      if (!resposta.ok) {
        const erro = await resposta.json();
        throw new Error(erro.detail || 'Erro ao gerar conteúdo');
      }
      const resultado = await resposta.json();
      setConteudoGerado(resultado);
    } catch (erro: any) {
      alert(erro.message || 'Erro ao gerar conteúdo. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const handleLoginSucesso = (nome: string, email: string, avatar: string) => {
    setUsuario({ nome, email, avatar });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUsuario(null);
    setConteudoGerado(null);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!usuario) {
    return (
      <PaginaLogin
        aoEntrar={handleLoginSucesso}
        statusBackend={statusBackend}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-indigo-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${scrolled ? 'bg-gray-900/80 backdrop-blur-lg border-gray-800 py-4' : 'bg-transparent border-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="w-6 h-6 text-white" fill="currentColor" />
            </div>
            <span className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              ENGAJA<span className="text-indigo-400">Í</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              {usuario.avatar && (
                <img src={usuario.avatar} alt={usuario.nome} className="w-8 h-8 rounded-full" />
              )}
              <span className="text-sm text-gray-400">{usuario.nome}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Sair
            </button>
          </div>

          <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <section className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold mb-8 tracking-wide uppercase">
              <Sparkles className="w-4 h-4" />
              <span>A Revolução da Criação de Conteúdo</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter leading-[0.9]">
              CRIE VÍDEOS <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                EXPLOSIVOS
              </span>
            </h1>
            <p className="text-gray-400 text-xl md:text-2xl max-w-3xl mx-auto mb-8">
              Nossa IA analisa as tendências de última hora para gerar roteiros que retêm a atenção e dominam o "For You".
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/40 border border-gray-700/50">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-gray-300">Roteiros Otimizados</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/40 border border-gray-700/50">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-gray-300">Hooks Virais</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/40 border border-gray-700/50">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-gray-300">Análise de Dados</span>
              </div>
            </div>
          </section>

          {/* Dashboard agora recebe a prop usuario */}
          <Dashboard
            aoGerar={aoGerar}
            carregando={carregando}
            backendOk={backendOk}
            statusBackend={statusBackend}
            conteudoGerado={conteudoGerado}
            usuario={usuario}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
