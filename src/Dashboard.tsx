import { useState } from 'react';
import { Sparkles, ArrowRight, Loader2, Lightbulb, Target, TrendingUp, Server } from 'lucide-react';
import { Platform } from './types';
import { PLATFORM_CONFIG } from './types';
import { StatusBackend } from './api';



interface DashboardProps {
  aoGerar: (tema: string, plataforma: Platform) => void;
  carregando: boolean;
  backendOk: boolean;
  statusBackend: StatusBackend | null;
}

const sugestoesTemas = [
  { emoji: '🍳', rotulo: 'Receitas veganas', valor: 'receitas veganas' },
  { emoji: '💪', rotulo: 'Treino HIIT', valor: 'treino HIIT em casa' },
  { emoji: '💻', rotulo: 'Dicas de programação', valor: 'dicas de programação' },
  { emoji: '✈️', rotulo: 'Viagem econômica', valor: 'viagem econômica' },
  { emoji: '🎨', rotulo: 'Design gráfico', valor: 'design gráfico para iniciantes' },
  { emoji: '💰', rotulo: 'Renda extra', valor: 'como ganhar renda extra online' },
  { emoji: '📱', rotulo: 'Review de apps', valor: 'review de apps úteis' },
  { emoji: '🎮', rotulo: 'Dicas de games', valor: 'dicas de jogos mobile' },
];

export default function Dashboard({ aoGerar, carregando, backendOk, statusBackend }: DashboardProps) {
  const [tema, setTema] = useState('');
  const [plataforma, setPlataforma] = useState<Platform | null>(null);
  const [focado, setFocado] = useState(false);

  const aoEnviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (tema.trim() && plataforma) {
      aoGerar(tema.trim(), plataforma);
    }
  };

  const podeEnviar = tema.trim().length >= 3 && plataforma !== null;

  // Texto informativo sobre serviços disponíveis
  const servicosTexto = statusBackend
    ? [
        statusBackend.groq_configurado && '✅ IA Groq',
        statusBackend.youtube_configurado ? '✅ YouTube API' : '⚪ YouTube API (não configurada)',
        statusBackend.trends_mcp_configurado ? '✅ Trends MCP' : '⚪ Trends MCP (não configurado)',
      ].filter(Boolean).join('   ·   ')
    : 'Verificando serviços...';

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-4 noise-bg relative">
      {/* Fundo decorativo */}
      <div className="absolute top-20 left-1/4 w-80 h-80 bg-indigo-600/15 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-[120px]"></div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Texto hero */}
        <div className="text-center mb-10 animate-slide-up">
          <div className="inline-flex items-center gap-2 glass-light rounded-full px-4 py-1.5 mb-6 text-xs text-white/50">
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
            <span>Tendências reais • IA real • Resultados profissionais</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black mb-3 tracking-tight">
            Crie conteúdo{' '}
            <span className="gradient-text">viral</span>{' '}
            em segundos
          </h2>
          <p className="text-white/40 text-sm sm:text-base max-w-md mx-auto">
            Digite o tema do seu vídeo, escolha a plataforma e deixe a IA criar tudo pra você
          </p>
        </div>

        {/* Aviso se backend não está configurado */}
        {!backendOk && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 animate-slide-up">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-amber-300">Servidor em configuração</p>
                <p className="text-xs text-amber-200/60">
                  O backend precisa estar rodando com a GROQ_API_KEY configurada. Se você é o administrador, verifique as variáveis de ambiente no servidor.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Serviços disponíveis */}
        <div className="mb-6 p-3 rounded-xl glass-light animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center gap-2 text-xs text-white/30">
            <Server className="w-3.5 h-3.5 text-purple-400/50" />
            <span>{servicosTexto}</span>
          </div>
        </div>

        {/* Formulário principal */}
        <form onSubmit={aoEnviar} className="space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {/* Campo de tema */}
          <div className="relative">
            <label className="block text-sm font-medium text-white/60 mb-2">
              <Target className="w-4 h-4 inline mr-1.5 text-purple-400" />
              Qual o tema do seu vídeo?
            </label>
            <div className={`relative rounded-2xl transition-all duration-300 ${focado ? 'ring-2 ring-purple-500/50' : ''}`}>
              <input
                type="text"
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                onFocus={() => setFocado(true)}
                onBlur={() => setFocado(false)}
                placeholder="Ex: receitas veganas, dicas de finanças, review de iPhone..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/25 text-base focus:outline-none focus:border-purple-500/50 transition-all"
                disabled={carregando}
                maxLength={200}
              />
              {tema && (
                <button
                  type="button"
                  onClick={() => setTema('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 text-sm transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[11px] text-white/20">Seja específico para melhores resultados</span>
              <span className="text-[11px] text-white/20">{tema.length}/200</span>
            </div>
          </div>

          {/* Sugestões de temas */}
          <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center gap-1.5 mb-3">
              <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs text-white/40">Sugestões populares:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {sugestoesTemas.map((sugestao, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTema(sugestao.valor)}
                  disabled={carregando}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
                    tema === sugestao.valor
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'glass-light text-white/40 hover:text-white/60 hover:bg-white/5'
                  }`}
                >
                  <span>{sugestao.emoji}</span>
                  <span>{sugestao.rotulo}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Seletor de plataforma */}
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <label className="block text-sm font-medium text-white/60 mb-3">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Escolha a plataforma
              </span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(PLATFORM_CONFIG) as Platform[]).map((chave) => {
                const info = PLATFORM_CONFIG[chave];
                const selecionada = plataforma === chave;
                return (
                  <button
                    key={chave}
                    type="button"
                    onClick={() => setPlataforma(chave)}
                    disabled={carregando}
                    className={`relative rounded-2xl p-4 text-center transition-all duration-300 group ${
                      selecionada
                        ? `${info.bgClasse} border-2 ${info.bordaClasse} scale-[1.02] shadow-lg`
                        : 'glass-light border border-white/5 hover:border-white/15 hover:bg-white/5'
                    }`}
                  >
                    {selecionada && (
                      <div className={`absolute top-2 right-2 w-2 h-2 rounded-full bg-gradient-to-r ${info.gradiente}`}></div>
                    )}
                    <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">
                      {info.icone}
                    </div>
                    <div className={`text-sm font-bold transition-colors ${
                      selecionada ? info.textoClasse : 'text-white/60 group-hover:text-white/80'
                    }`}>
                      {info.nome}
                    </div>
                    <div className={`text-[10px] mt-1 ${selecionada ? 'text-white/50' : 'text-white/25'}`}>
                      {info.descricao}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botão enviar */}
          <div className="animate-slide-up" style={{ animationDelay: '0.25s' }}>
            <button
              type="submit"
              disabled={!podeEnviar || carregando || !backendOk}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-300 ${
                podeEnviar && !carregando && backendOk
                  ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.01] active:scale-[0.99]'
                  : 'bg-white/5 text-white/20 cursor-not-allowed'
              }`}
            >
              {carregando ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Gerando conteúdo...</span>
                </>
              ) : !backendOk ? (
                <>
                  <span>⚠️ Servidor em configuração</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Gerar Conteúdo</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Cards de info */}
        <div className="grid grid-cols-3 gap-3 mt-10 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          {[
            { icone: '🔍', rotulo: 'APIs Reais', desc: 'YouTube + Trends MCP' },
            { icone: '🤖', rotulo: 'IA Groq', desc: 'Llama 4 Scout 17B' },
            { icone: '⚡', rotulo: 'Rápido', desc: 'Resposta em segundos' },
          ].map((item, i) => (
            <div key={i} className="glass-light rounded-xl p-3 text-center">
              <div className="text-lg mb-1">{item.icone}</div>
              <div className="text-[11px] font-semibold text-white/60">{item.rotulo}</div>
              <div className="text-[10px] text-white/25">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
