import React, { useState, useRef } from 'react';
import { 
  Sparkles, ArrowRight, Loader2, Lightbulb, Target, TrendingUp, Server, 
  Copy, CheckCircle, Video, Smartphone, Play, Share2, Layout, Zap 
} from 'lucide-react';
import { Platform, PLATFORM_CONFIG } from './types';
import { StatusBackend } from './api';

interface DashboardProps {
  aoGerar: (tema: string, plataforma: Platform) => void;
  carregando: boolean;
  backendOk: boolean;
  statusBackend: StatusBackend | null;
}

const sugestoesTemas = [
  { emoji: "🥗", rotulo: "Receitas veganas", valor: "receitas veganas" },
  { emoji: "🏋️", rotulo: "Treino HIIT", valor: "treino HIIT em casa" },
  { emoji: "💻", rotulo: "Dicas de programação", valor: "dicas de programação" },
  { emoji: "💰", rotulo: "Renda extra", valor: "como ganhar renda extra online" },
];

export default function Dashboard({ aoGerar, carregando, backendOk, statusBackend }: DashboardProps) {
  const [tema, setTema] = useState('');
  const [plataforma, setPlataforma] = useState<Platform | null>(null);
  const [focado, setFocado] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const aoEnviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (tema.trim() && plataforma) {
      aoGerar(tema.trim(), plataforma);
    }
  };

  // Lógica para formatar os serviços ativos (como no seu print)
  const serviçosTexto = statusBackend ? [
    statusBackend.groq_configurado && '✅ IA Groq',
    statusBackend.youtube_configurado && '✅ YouTube API',
    statusBackend.trends_mcp_configurado && '✅ Trends MCP'
  ].filter(Boolean).join('  •  ') : 'Verificando serviços...';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 noise-bg relative">
      <div className="relative z-10 w-full max-w-5xl">
        
        {/* Cabeçalho Hero */}
        <div className="text-center mb-10 animate-slide-up">
          <div className="inline-flex items-center gap-2 glass-light rounded-full px-4 py-1.5 mb-6 text-xs text-white/50">
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
            <span>Tendências reais • IA real • Resultados profissionais</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black mb-3 tracking-tight text-white">
            Crie conteúdo <span className="gradient-text">viral</span> em segundos
          </h2>
          <p className="text-white/40 text-sm max-w-md mx-auto">
            Digite o tema do seu vídeo, escolha a plataforma e deixe a IA criar tudo pra você
          </p>
        </div>

        {/* Status do Servidor */}
        <div className="mb-6 p-3 rounded-xl glass-light animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center gap-3 text-xs text-white/30">
            <Server className="w-3.5 h-3.5 text-purple-400/50" />
            <span>{serviçosTexto}</span>
          </div>
        </div>

        {/* Formulário Principal */}
        <form onSubmit={aoEnviar} className="space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
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
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/20 outline-none"
                placeholder="Ex: receitas veganas, dicas de finanças..."
                maxLength={200}
              />
            </div>
          </div>

          {/* Sugestões de Temas */}
          <div className="flex flex-wrap gap-2">
            {sugestoesTemas.map((sugestao) => (
              <button
                key={sugestao.valor}
                type="button"
                onClick={() => setTema(sugestao.valor)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full glass-light text-white/40 hover:text-white transition-all"
              >
                <span>{sugestao.emoji}</span>
                <span>{sugestao.rotulo}</span>
              </button>
            ))}
          </div>

          {/* Seletor de Plataforma */}
          <div className="grid grid-cols-3 gap-3">
            {(Object.keys(PLATFORM_CONFIG) as Platform[]).map((chave) => {
              const info = PLATFORM_CONFIG[chave];
              const selecionada = plataforma === chave;
              return (
                <button
                  key={chave}
                  type="button"
                  onClick={() => setPlataforma(chave)}
                  className={`relative rounded-2xl p-4 text-center transition-all duration-300 group ${
                    selecionada ? `${info.bgClasse} border-2 ${info.bordaClasse} scale-[1.02] shadow-lg` : 'glass-light border border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className={`text-2xl mb-2 group-hover:scale-110 transition-transform ${selecionada ? 'text-white' : 'text-white/40'}`}>
                    {/* Renderiza o ícone dinâmico do PLATFORM_CONFIG */}
                    {React.createElement(info.icone)}
                  </div>
                  <div className={`text-sm font-bold ${selecionada ? 'text-white' : 'text-white/60'}`}>{info.nome}</div>
                  <div className="text-[10px] text-white/25 mt-1">{info.descricao}</div>
                </button>
              );
            })}
          </div>

          {/* Botão Gerar */}
          <button
            type="submit"
            disabled={!tema.trim() || !plataforma || carregando || !backendOk}
            className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${
              !tema.trim() || !plataforma ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20'
            }`}
          >
            {carregando ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Gerando conteúdo...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Gerar Conteúdo</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* ÁREA DE RESULTADO (ONDE ESTAVA O ERRO) */}
        {/* Aqui você deve renderizar o componente <ExibirResultado /> passando os dados da sua API */}
      </div>
    </div>
  );
}
