import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import PaginaLogin from './LoginPage';
import Termos from './Termos';
import Privacidade from './Privacidade';
import ConsentPage from './ConsentPage';
import { Platform } from './types';
import { StatusBackend } from './api';
import { Zap, Sparkles, CheckCircle2, Menu, X } from 'lucide-react';
import { useLanguage } from './LanguageContext';

function App() {
  const { lang, setLang, t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [backendOk, setBackendOk] = useState(false);
  const [statusBackend, setStatusBackend] = useState<StatusBackend | null>(null);
  const [conteudoGerado, setConteudoGerado] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [consentiu, setConsentiu] = useState(false);
  const [menuDropdownAberto, setMenuDropdownAberto] = useState(false);

  const verificarConsentimento = () => {
    const aceito = localStorage.getItem('termos_aceitos');
    setConsentiu(aceito === 'true');
  };

  const getUserIdFromToken = (token: string) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.email;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    verificarConsentimento();
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      const nome = params.get('nome') || 'Usuário';
      const email = params.get('email') || '';
      const avatar = params.get('avatar') || '';
      fetch(`/api/auth/verificar?token=${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.valido) {
            const sub = data.sub || getUserIdFromToken(token);
            setUsuario({
              nome: data.nome || nome,
              email: data.email || email,
              avatar: data.avatar || avatar,
              sub: sub,
              plano: data.plano || 'free'
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
              const sub = data.sub || getUserIdFromToken(savedToken);
              setUsuario({
                nome: data.nome,
                email: data.email,
                avatar: data.avatar,
                sub: sub,
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
          'Authorization': `Bearer ${token}`
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
      alert(erro.message);
    } finally {
      setCarregando(false);
    }
  };

  const handleLoginSucesso = (nome: string, email: string, avatar: string) => {
    setUsuario({ nome, email, avatar });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('termos_aceitos');
    setUsuario(null);
    setConteudoGerado(null);
    setConsentiu(false);
  };

  const handleConsent = () => {
    localStorage.setItem('termos_aceitos', 'true');
    setConsentiu(true);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const path = window.location.pathname;
  if (path === '/termos') return <Termos />;
  if (path === '/privacidade') return <Privacidade />;

  if (!usuario) {
    return (
      <PaginaLogin
        aoEntrar={handleLoginSucesso}
        statusBackend={statusBackend}
      />
    );
  }

  if (!consentiu) {
    return <ConsentPage onConsent={handleConsent} />;
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

            {/* Seletor de idioma */}
            <button
              onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
              className="text-xs px-2 py-1 rounded-lg bg-white/5 text-white/60 hover:text-white transition"
              title={lang === 'pt' ? 'Switch to English' : 'Mudar para Português'}
            >
              {lang === 'pt' ? '🇧🇷 PT' : '🇺🇸 EN'}
            </button>

            {/* Menu de três barras */}
            <div className="relative">
              <button
                onClick={() => setMenuDropdownAberto(!menuDropdownAberto)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 text-white/60 hover:text-white transition"
              >
                <div className="flex flex-col gap-1">
                  <span className="w-4 h-0.5 bg-white/60 rounded-full"></span>
                  <span className="w-4 h-0.5 bg-white/60 rounded-full"></span>
                  <span className="w-4 h-0.5 bg-white/60 rounded-full"></span>
                </div>
              </button>

              {menuDropdownAberto && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-lg py-2 z-50">
                  <a
                    href="mailto:engajaibrasil00@gmail.com"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition"
                    onClick={() => setMenuDropdownAberto(false)}
                  >
                    {t('menu_support')}
                  </a>
                  <a
                    href="/termos"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition"
                    onClick={() => setMenuDropdownAberto(false)}
                  >
                    {t('menu_terms')}
                  </a>
                  <a
                    href="/privacidade"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition"
                    onClick={() => setMenuDropdownAberto(false)}
                  >
                    {t('menu_privacy')}
                  </a>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {t('nav_logout')}
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
              <span>{t('hero_badge')}</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter leading-[0.9]">
              {t('hero_title')} <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                {t('hero_highlight')}
              </span>
            </h1>
            <p className="text-gray-400 text-xl md:text-2xl max-w-3xl mx-auto mb-8">
              {t('hero_subtitle')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/40 border border-gray-700/50">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-gray-300">{t('hero_feature1')}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/40 border border-gray-700/50">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-gray-300">{t('hero_feature2')}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/40 border border-gray-700/50">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-gray-300">{t('hero_feature3')}</span>
              </div>
            </div>
          </section>

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
