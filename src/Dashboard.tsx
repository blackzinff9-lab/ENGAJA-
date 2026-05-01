import React, { useState } from 'react';
import { 
  Sparkles, ArrowRight, Loader2, Server, 
  TrendingUp, Target, Copy, CheckCircle
} from 'lucide-react';
import { Platform, PLATFORM_CONFIG } from './types';
import { StatusBackend } from './api';

interface DashboardProps {
  aoGerar: (tema: string, plataforma: Platform) => void;
  carregando: boolean;
  backendOk: boolean;
  statusBackend: StatusBackend | null;
  conteudoGerado: any;
}

const sugestoesTemas = [
  { emoji: "🥗", rotulo: "Receitas veganas", valor: "receitas veganas" },
  { emoji: "🏋️", rotulo: "Treino HIIT", valor: "treino HIIT em casa" },
  { emoji: "💻", rotulo: "Dicas de programação", valor: "dicas de programação" },
  { emoji: "💰", rotulo: "Renda extra", valor: "como ganhar renda extra online" },
];

export default function Dashboard({ aoGerar, carregando, backendOk, statusBackend, conteudoGerado }: DashboardProps) {
  const [tema, setTema] = useState('');
  const [plataforma, setPlataforma] = useState<Platform | null>(null);
  const [focado, setFocado] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);

  const aoEnviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (tema.trim() && plataforma) {
      aoGerar(tema.trim(), plataforma);
    }
  };

  const copiarTexto = (texto: string, campo: string) => {
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(campo);
      setTimeout(() => setCopiado(null), 2000);
    });
  };

  const servicosTexto = statusBackend
    ? [
        statusBackend.groq_configurado && '✅ IA Groq',
        statusBackend.youtube_configurado && '✅ YouTube API',
        statusBackend.trends_mcp_configurado && '✅ Trends MCP'
      ].filter(Boolean).join('  •  ')
    : 'Verificando serviços...';

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Cabeçalho */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-white/5 rounded-full px-4 py-1.5 mb-4 text-xs text-white/50">
          <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
          <span>Tendências reais • IA real • Resultados profissionais</span>
        </div>
      </div>

      {/* Status do Servidor */}
      <div className="mb-6 p-3 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-3 text-xs text-white/40">
          <Server className="w-3.5 h-3.5 text-purple-400/70" />
          <span>{servicosTexto}</span>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={aoEnviar} className="space-y-5">
        <div className="relative">
          <label className="block text-sm font-medium text-white/60 mb-2">
            <Target className="w-4 h-4 inline mr-1.5 text-purple-400" />
            Qual o tema do seu vídeo?
          </label>
          <input 
            type="text"
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            onFocus={() => setFocado(true)}
            onBlur={() => setFocado(false)}
            className={`w-full bg-white/5 border rounded-2xl px-5 py-4 text-white placeholder-white/20 outline-none transition ${
              focado ? 'border-purple-500/50' : 'border-white/10'
            }`}
            placeholder="Ex: receitas veganas, dicas de finanças..."
            maxLength={200}
          />
        </div>

        {/* Sugestões */}
        <div className="flex flex-wrap gap-2">
          {sugestoesTemas.map((sugestao) => (
            <button
              key={sugestao.valor}
              type="button"
              onClick={() => setTema(sugestao.valor)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition"
            >
              <span>{sugestao.emoji}</span>
              <span>{sugestao.rotulo}</span>
            </button>
          ))}
        </div>

        {/* Plataformas */}
        <div className="grid grid-cols-3 gap-3">
          {(Object.keys(PLATFORM_CONFIG) as Platform[]).map((chave) => {
            const info = PLATFORM_CONFIG[chave];
            const selecionada = plataforma === chave;
            return (
              <button
                key={chave}
                type="button"
                onClick={() => setPlataforma(chave)}
                className={`rounded-2xl p-4 text-center transition-all ${
                  selecionada
                    ? 'bg-purple-500/20 border-2 border-purple-400 shadow-lg shadow-purple-500/10 scale-[1.02]'
                    : 'bg-white/5 border border-white/10 hover:border-white/20'
                }`}
              >
                <div className={`text-2xl mb-2 ${selecionada ? 'text-white' : 'text-white/40'}`}>
                  {React.createElement(info.icone)}
                </div>
                <div className={`text-sm font-bold ${selecionada ? 'text-white' : 'text-white/60'}`}>
                  {info.nome}
                </div>
                <div className="text-[10px] text-white/25 mt-1">{info.descricao}</div>
              </button>
            );
          })}
        </div>

        {/* Botão Gerar */}
        <button
          type="submit"
          disabled={!tema.trim() || !plataforma || carregando}
          className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${
            !tema.trim() || !plataforma || carregando
              ? 'bg-white/5 text-white/20 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20'
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

        {!backendOk && (
          <p className="text-xs text-amber-400/70 text-center">
            ⚠️ Serviços ainda não verificados – o conteúdo pode demorar mais.
          </p>
        )}
      </form>

      {/* EXIBIÇÃO DO CONTEÚDO GERADO */}
      {conteudoGerado && (
        <div className="mt-10 space-y-6 animate-fade-in">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            Seu Conteúdo Viral
          </h2>

          {/* Título */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Título</span>
              <button 
                onClick={() => copiarTexto(conteudoGerado.titulo, 'titulo')}
                className="text-white/30 hover:text-white transition"
              >
                {copiado === 'titulo' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-white text-lg font-semibold">{conteudoGerado.titulo}</p>
          </div>

          {/* Descrição */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Descrição</span>
              <button 
                onClick={() => copiarTexto(conteudoGerado.descricao, 'descricao')}
                className="text-white/30 hover:text-white transition"
              >
                {copiado === 'descricao' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-white/80">{conteudoGerado.descricao}</p>
          </div>

          {/* Hashtags */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Hashtags</span>
              <button 
                onClick={() => copiarTexto(conteudoGerado.hashtags, 'hashtags')}
                className="text-white/30 hover:text-white transition"
              >
                {copiado === 'hashtags' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-emerald-400 font-medium whitespace-pre-wrap break-words">
              {conteudoGerado.hashtags}
            </p>
          </div>

          {/* Roteiro */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Roteiro</span>
              <button 
                onClick={() => copiarTexto(conteudoGerado.roteiro, 'roteiro')}
                className="text-white/30 hover:text-white transition"
              >
                {copiado === 'roteiro' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-white/80 whitespace-pre-line">{conteudoGerado.roteiro}</p>
          </div>

          {/* Ideia de Edição */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Ideia de Edição</span>
              <button 
                onClick={() => copiarTexto(conteudoGerado.ideiaEdicao, 'ideiaEdicao')}
                className="text-white/30 hover:text-white transition"
              >
                {copiado === 'ideiaEdicao' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-white/80">{conteudoGerado.ideiaEdicao}</p>
          </div>
        </div>
      )}
    </div>
  );
                }
