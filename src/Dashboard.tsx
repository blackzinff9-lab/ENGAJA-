import React, { useState, useRef } from 'react';
import { 
  Send, 
  Video, 
  Smartphone, 
  Play, 
  Sparkles, 
  Layout, 
  Zap, 
  Target, 
  AlertCircle, 
  Loader2,
  Copy,
  CheckCircle,
  Share2,
  Bookmark,
  Clock,
  TrendingUp,
  Lightbulb
} from 'lucide-react';

interface DashboardProps {
  user: { nome: string; avatar: string; };
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [tema, setTema] = useState('');
  const [plataforma, setPlataforma] = useState<'tiktok' | 'instagram' | 'youtube'>('tiktok');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

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
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Erro ao gerar conteúdo');
      setResultado(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const text = `${resultado.titulo}\n\n${resultado.roteiro || resultado.descricao}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pb-20">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 bg-slate-800/30 p-6 rounded-3xl border border-slate-700/50">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img src={user.avatar} className="w-16 h-16 rounded-2xl border-2 border-indigo-500/50 object-cover" alt={user.nome} />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-[#0f172a] rounded-full" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Painel Criativo</h2>
            <p className="text-slate-400 text-sm">Bem-vindo de volta, {user.nome.split(' ')[0]}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-slate-900/50 rounded-xl border border-slate-700/50 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Pro Plan</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl -mr-32 -mt-32" />
        
        <form onSubmit={handleGerar} className="relative z-10 space-y-10">
          <div className="space-y-4">
            <div className="flex justify-between items-end px-1">
              <label className="text-sm font-bold text-slate-200 uppercase tracking-widest">O que vamos criar?</label>
              <span className="text-xs text-slate-500 font-medium">{tema.length}/500</span>
            </div>
            <textarea
              value={tema}
              onChange={(e) => setTema(e.target.value.slice(0, 500))}
              placeholder="Descreva sua ideia em detalhes para um roteiro mais preciso..."
              className="w-full bg-slate-900/80 border border-slate-700/50 text-white rounded-[2rem] p-6 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all min-h-[180px] text-lg font-light leading-relaxed"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'tiktok', icon: Video, label: 'TikTok Viral', desc: 'Foco em Retenção' },
              { id: 'instagram', icon: Smartphone, label: 'Instagram Reels', desc: 'Foco em Estética' },
              { id: 'youtube', icon: Play, label: 'YouTube Shorts', desc: 'Foco em SEO' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPlataforma(item.id as any)}
                className={`flex flex-col items-start gap-1 p-6 rounded-3xl border text-left transition-all duration-300 ${
                  plataforma === item.id 
                    ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-500/10' 
                    : 'bg-slate-900/40 border-slate-700/50 text-slate-400 hover:bg-slate-800/60'
                }`}
              >
                <item.icon className={`w-6 h-6 mb-2 ${plataforma === item.id ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span className={`text-sm font-bold ${plataforma === item.id ? 'text-white' : ''}`}>{item.label}</span>
                <span className="text-[10px] uppercase tracking-tighter opacity-60">{item.desc}</span>
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-6 rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 font-black text-white text-lg shadow-xl shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-4"
          >
            {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
            {loading ? 'PROCESSANDO TENDÊNCIAS...' : 'GERAR CONTEÚDO AGORA'}
          </button>
        </form>
      </div>

      <div ref={resultRef}>
        {resultado && (
          <div className="mt-16 space-y-8 animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-[2.5rem] p-10">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-indigo-400 text-xs font-black uppercase tracking-[0.3em] mb-3">Título Sugerido</h3>
                    <p className="text-3xl font-extrabold text-white leading-tight tracking-tight">{resultado.titulo}</p>
                  </div>
                  <button onClick={copyToClipboard} className="p-3 bg-slate-700/30 hover:bg-slate-700/60 rounded-2xl transition-colors">
                    {copied ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-slate-400" />}
                  </button>
                </div>
                
                <div className="h-px bg-gradient-to-r from-slate-700/50 via-transparent to-transparent mb-8" />
                
                <h3 className="text-indigo-400 text-xs font-black uppercase tracking-[0.3em] mb-4">Roteiro Completo</h3>
                <div className="bg-slate-900/60 rounded-[2rem] p-8 border border-slate-700/30 font-mono text-slate-300 leading-relaxed text-sm">
                  {resultado.roteiro || resultado.descricao}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 rounded-[2.5rem] p-8">
                  <div className="flex items-center gap-2 mb-6 text-indigo-400">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest">Estratégia Viral</span>
                  </div>
                  <ul className="space-y-4">
                    {['Hook de 3 segundos', 'Corte dinâmico', 'Legendas coloridas'].map((item, i) => (
                      <li key={i} className="flex gap-3 text-sm text-slate-200">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
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
    </div>
  );
};

export default Dashboard;
                    
