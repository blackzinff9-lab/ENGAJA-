import { LogOut, Zap, Wifi, WifiOff, Server } from 'lucide-react';
// Altera as linhas de import para estas:
import { User, Platform, AppState, GeneratedContent } from './types';
import { gerarConteudo, verificarStatus, StatusBackend, salvarUsuario, carregarUsuario, limparUsuario } from './api';
import PaginaLogin from './LoginPage';
import Header from './Header';
import Dashboard from './Dashboard';
import EstadoCarregando from './LoadingState';
import ExibirResultado from './ResultDisplay';

}

export default function Header({ usuario, aoSair, statusBackend }: HeaderProps) {
  const online = statusBackend?.status === 'online';
  const groqOk = statusBackend?.groq_configurado ?? false;

  return (
    <header className="glass sticky top-0 z-50 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Zap className="w-5 h-5 text-white" fill="white" />
            </div>
            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0a0a0f] ${online && groqOk ? 'bg-green-400' : 'bg-amber-400 animate-pulse'}`}></div>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              <span className="gradient-text">ContentForge</span>
              <span className="text-white/40 font-light ml-1">AI</span>
            </h1>
            <div className="flex items-center gap-1.5 text-[10px] text-white/30">
              {online ? (
                <>
                  <Wifi className="w-3 h-3 text-green-400" />
                  <span className="text-green-400/60">Servidor online</span>
                  <span className="text-white/15 mx-1">•</span>
                  <Server className="w-3 h-3" />
                  <span>
                    {[
                      groqOk && 'Groq ✓',
                      statusBackend?.youtube_configurado && 'YouTube ✓',
                      statusBackend?.trends_mcp_configurado && 'Trends ✓',
                    ].filter(Boolean).join(' · ') || 'Configurando...'}
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-amber-400" />
                  <span className="text-amber-400/60">Conectando ao servidor...</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-3 glass-light rounded-full px-4 py-2">
            <img
              src={usuario.avatar}
              alt={usuario.name}
              className="w-7 h-7 rounded-full ring-2 ring-purple-500/30"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white/90 leading-tight">{usuario.name}</span>
              <span className="text-[11px] text-white/40 leading-tight">{usuario.email}</span>
            </div>
          </div>

          <button
            onClick={aoSair}
            className="flex items-center gap-2 text-sm text-white/40 hover:text-white/80 transition-colors glass-light rounded-full px-3 py-2 hover:bg-white/5"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}
