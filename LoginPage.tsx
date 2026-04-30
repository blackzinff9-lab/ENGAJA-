import { useState } from 'react';
import { Zap, Sparkles, TrendingUp, Video, Hash, Wand2, ArrowRight, Loader2 } from 'lucide-react';
import { StatusBackend, urlLoginGoogle } from '../lib/api';

interface LoginProps {
  aoEntrar: (nome: string, email: string, avatar: string) => void;
  statusBackend: StatusBackend | null;
}

export default function PaginaLogin({ aoEntrar, statusBackend }: LoginProps) {
  const [carregandoDemo, setCarregandoDemo] = useState(false);
  const googleConfigurado = statusBackend?.google_login_configurado ?? false;

  const aoEntrarGoogle = () => {
    window.location.href = urlLoginGoogle();
  };

  const aoEntrarDemo = () => {
    setCarregandoDemo(true);
    setTimeout(() => {
      aoEntrar('Usuário Demo', 'demo@contentforge.ai', '');
      setCarregandoDemo(false);
    }, 500);
  };

  const recursos = [
    { icone: TrendingUp, rotulo: 'Tendências Reais', desc: 'APIs oficiais + IA' },
    { icone: Video, rotulo: 'Roteiros Completos', desc: 'Prontos para gravar' },
    { icone: Hash, rotulo: 'Hashtags Estratégicas', desc: 'Maximize seu alcance' },
    { icone: Wand2, rotulo: 'IA Avançada', desc: 'Llama 4 Scout 17B' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 noise-bg relative overflow-hidden">
      {/* Orbes de fundo */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-float"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[200px]"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 mb-6 shadow-2xl shadow-purple-500/30 animate-pulse-glow">
            <Zap className="w-10 h-10 text-white" fill="white" />
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-2">
            <span className="gradient-text">ContentForge</span>
            <span className="text-white/30 font-light"> AI</span>
          </h1>
          <p className="text-white/50 text-sm max-w-xs mx-auto">
            Seu assistente inteligente para criar conteúdo viral nas redes sociais
          </p>
        </div>

        {/* Grid de recursos */}
        <div className="grid grid-cols-2 gap-3 mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {recursos.map((recurso, i) => (
            <div
              key={i}
              className="glass-light rounded-xl p-3 text-center hover:bg-white/5 transition-all duration-300 group"
            >
              <recurso.icone className="w-5 h-5 mx-auto mb-2 text-purple-400 group-hover:text-purple-300 transition-colors" />
              <div className="text-xs font-semibold text-white/80">{recurso.rotulo}</div>
              <div className="text-[10px] text-white/30 mt-0.5">{recurso.desc}</div>
            </div>
          ))}
        </div>

        {/* Card de login */}
        <div
          className="glass rounded-2xl p-8 animate-slide-up relative overflow-hidden"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>

          <h2 className="text-xl font-bold text-center mb-2">Comece Agora</h2>
          <p className="text-white/40 text-sm text-center mb-6">
            Faça login com sua conta Google para começar
          </p>

          {/* Botão de login com Google */}
          {googleConfigurado ? (
            <button
              onClick={aoEntrarGoogle}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-semibold py-3.5 px-6 rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-lg shadow-white/10 hover:shadow-white/20 hover:scale-[1.02] active:scale-[0.98] mb-4"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Entrar com Google</span>
              <ArrowRight className="w-4 h-4"/>
            </button>
          ) : (
            <button
              onClick={aoEntrarDemo}
              disabled={carregandoDemo}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-semibold py-3.5 px-6 rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-lg shadow-white/10 hover:shadow-white/20 hover:scale-[1.02] active:scale-[0.98] mb-4 disabled:opacity-70"
            >
              {carregandoDemo ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Entrar com Google</span>
                  <ArrowRight className="w-4 h-4"/>
                </>
              )}
            </button>
          )}

          {/* Divisor */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/5"></div>
            <span className="text-[10px] text-white/20">ou</span>
            <div className="flex-1 h-px bg-white/5"></div>
          </div>

          {/* Botão demo */}
          <button
            onClick={aoEntrarDemo}
            disabled={carregandoDemo}
            className="w-full flex items-center justify-center gap-2 glass-light text-white/50 hover:text-white/80 py-3 px-4 rounded-xl hover:bg-white/5 transition-all text-sm disabled:opacity-50"
          >
            {carregandoDemo ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>Entrar como demonstração</span>
          </button>

          {/* Nota sobre segurança */}
          <div className="mt-5 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-center gap-2 text-xs text-purple-300/80">
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                Login seguro via Google OAuth 2.0. Não armazenamos sua senha.
              </span>
            </div>
          </div>

          {/* Plataformas */}
          <div className="flex items-center justify-center gap-6 mt-5 pt-5 border-t border-white/5">
            <span className="text-xs text-white/20">Compatível com:</span>
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-[#FE2C55]">TikTok</span>
              <span className="text-sm font-bold bg-gradient-to-r from-[#833AB4] via-[#E4405F] to-[#FCAF45] bg-clip-text text-transparent">Instagram</span>
              <span className="text-sm font-bold text-[#FF0000]">YouTube</span>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <p className="text-center text-white/20 text-xs mt-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          IA powered by Groq • Modelo Llama 4 Scout 17B • Chamadas reais à API
        </p>
      </div>
    </div>
  );
}
