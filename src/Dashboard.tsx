import React, { useState } from 'react';
import { 
  Send, 
  Youtube, 
  Instagram, 
  Video,
  Sparkles,
  Layout,
  Clock,
  Zap,
  Target,
  Share2,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface DashboardProps {
  user: {
    nome: string;
    avatar: string;
  };
}

interface GeneratedContent {
  titulo: string;
  descricao: string;
  hashtags: string[];
  roteiro: string;
  ideiasEdicao: string[];
  tendencias: string[];
  plataforma: string;
  tema: string;
  fonteTendencias: string;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [tema, setTema] = useState('');
  const [plataforma, setPlataforma] = useState<'tiktok' | 'instagram' | 'youtube'>('tiktok');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<GeneratedContent | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const handleGerar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tema.trim()) return;

    setLoading(true);
    setErro(null);
    
    try {
      const response = await fetch('/api/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema, plataforma }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erro ao gerar conteúdo');
      }

      const data = await response.json();
      setResultado(data);
      
      // Scroll suave para o resultado
      setTimeout(() => {
        document.getElementById('resultado')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header de Boas-vindas */}
      <div className="flex items-center gap-4 mb-10 animate-fade-in">
        <img 
          src={user.avatar} 
          alt={user.nome} 
          className="w-16 h-16 rounded-full border-2 border-indigo-500 p-0.5 shadow-lg shadow-indigo-500/20"
        />
        <div>
          <h1 className="text-2xl font-bold text-white">Olá, {user.nome.split(' ')[0]}! 👋</h1>
          <p className="text-slate-400">O que vamos criar de viral hoje?</p>
        </div>
      </div>

      {/* Formulário Principal */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 md:p-8 shadow-2xl shadow-black/20 mb-10">
        <form onSubmit={handleGerar} className="space-y-6">
          {/* Campo de Tema */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">
              Qual o tema do seu vídeo? (Seja o mais detalhado possível)
            </label>
            <div className="relative group">
              <textarea
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                placeholder="Ex: Um vídeo curto de culinária sobre como fazer um bolo de chocolate fofinho passo a passo..."
                className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-2xl py-4 px-5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all min-h-[120px] resize-none group-hover:border-slate-600"
                required
              />
              <div className="absolute right-4 bottom-4 text-slate-500 text-xs">
                {tema.length} caracteres
              </div>
            </div>
          </div>

          {/* Seleção de Plataforma */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300 ml-1">Escolha a Plataforma</label>
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              {[
                { id: 'tiktok', icon: Video, label: 'TikTok', color: 'hover:bg-pink-500/10 hover:border-pink-500/50 text-pink-500' },
                { id: 'instagram', icon: Instagram, label: 'Instagram', color: 'hover:bg-purple-500/10 hover:border-purple-500/50 text-purple-500' },
                { id: 'youtube', icon: Youtube, label: 'YouTube', color: 'hover:bg-red-500/10 hover:border-red-500/50 text-red-500' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPlataforma(item.id as any)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                    plataforma === item.id 
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' 
                      : `bg-slate-900/30 border-slate-700/50 text-slate-400 ${item.color}`
                  }`}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-xs font-semibold uppercase tracking-wider">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Botão Gerar */}
          <button
            type="submit"
            disabled={loading || !tema.trim()}
            className={`w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] ${
              loading 
                ? 'bg-slate-700 cursor-not-allowed' 
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analisando tendências e criando roteiro...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Gerar Conteúdo Viral
              </>
            )}
          </button>
        </form>
      </div>

      {/* Área de Erro */}
      {erro && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-2xl flex items-center gap-3 mb-8 animate-shake">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{erro}</p>
        </div>
      )}

      {/* Área de Resultado */}
      {resultado && (
        <div id="resultado" className="space-y-8 animate-fade-in pb-20">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Seu Conteúdo Gerado
            </h2>
            <button 
              onClick={() => window.print()}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 transition-colors"
            >
              Salvar como PDF
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Título e Descrição */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-6 space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold text-indigo-400 mb-2 block">Título Sugerido</label>
                  <h3 className="text-xl font-bold text-white leading-tight">{resultado.titulo}</h3>
                </div>
                <div className="h-px bg-slate-700/50 w-full" />
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold text-indigo-400 mb-2 block">Descrição / Legenda</label>
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{resultado.descricao}</p>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {resultado.hashtags.map((tag, i) => (
                    <span key={i} className="text-xs font-medium text-indigo-400 bg-indigo-500/5 px-2 py-1 rounded-md">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Roteiro */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Layout className="w-4 h-4 text-indigo-400" />
                  <label className="text-[10px] uppercase tracking-widest font-bold text-indigo-400">Roteiro Detalhado</label>
                </div>
                <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-mono bg-slate-900/50 p-4 rounded-xl border border-slate-700/30">
                  {resultado.roteiro}
                </div>
              </div>
            </div>

            {/* Sidebar de Dicas e Tendências */}
            <div className="space-y-6">
              {/* Tendências Identificadas */}
              <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-4 h-4 text-indigo-400" />
                  <label className="text-[10px] uppercase tracking-widest font-bold text-indigo-400">Por que isso vai viralizar?</label>
                </div>
                <ul className="space-y-3">
                  {resultado.tendencias.map((item, i) => (
                    <li key={i} className="flex gap-2 text-xs text-slate-300">
                      <div className="w-1 h-1 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Dicas de Edição */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Share2 className="w-4 h-4 text-indigo-400" />
                  <label className="text-[10px] uppercase tracking-widest font-bold text-indigo-400">Dicas de Edição</label>
                </div>
                <ul className="space-y-3">
                  {resultado.ideiasEdicao.map((item, i) => (
                    <li key={i} className="flex gap-2 text-xs text-slate-300">
                      <Zap className="w-3 h-3 text-yellow-500 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
