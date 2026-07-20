import React, { useState } from 'react';
import { TrendingUp, Search, BarChart3, Smartphone, Play, Video } from 'lucide-react';

type PlataformaTendencia = 'tiktok' | 'instagram' | 'youtube';

const PLATAFORMAS = [
  { id: 'tiktok' as PlataformaTendencia, nome: 'TikTok', icone: Smartphone },
  { id: 'instagram' as PlataformaTendencia, nome: 'Instagram', icone: Play },
  { id: 'youtube' as PlataformaTendencia, nome: 'YouTube', icone: Video },
];

interface Trend {
  date: string;
  value: number;
}

export default function Tendencias() {
  const [tendencias, setTendencias] = useState<Trend[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [termo, setTermo] = useState('');
  const [plataforma, setPlataforma] = useState<PlataformaTendencia>('tiktok');
  const [erro, setErro] = useState('');

  const buscarTendencias = async () => {
    if (!termo.trim()) return;
    setCarregando(true);
    setErro('');
    try {
      const apiKey = import.meta.env.VITE_TRENDSMCP_API_KEY || '';
      // Define a fonte de acordo com a plataforma
      const fonte = plataforma === 'tiktok' ? 'tiktok' : 'google trends';
      const resposta = await fetch('https://api.trendsmcp.ai/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ source: fonte, keyword: termo })
      });
      if (!resposta.ok) {
        setErro('Erro ao buscar tendências. Verifique o termo e tente novamente.');
        return;
      }
      const dados = await resposta.json();
      const corpo = typeof dados.body === 'string' ? JSON.parse(dados.body) : dados.body;
      const ultimos = corpo.slice(-7).map((p: any) => ({
        date: p.date || '',
        value: parseInt(p.value) || 0
      }));
      setTendencias(ultimos);
    } catch (e) {
      setErro('Falha na conexão. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-purple-400" />
          Tendências em Tempo Real
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          Pesquise qualquer termo e veja a popularidade nos últimos 7 períodos para cada plataforma.
        </p>

        {/* Seletor de plataforma */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {PLATAFORMAS.map((plat) => (
            <button
              key={plat.id}
              onClick={() => setPlataforma(plat.id)}
              className={`rounded-2xl p-3 text-center transition-all ${
                plataforma === plat.id
                  ? 'bg-purple-500/20 border-2 border-purple-400 shadow-lg shadow-purple-500/10 scale-[1.02]'
                  : 'bg-white/5 border border-white/10 hover:border-white/20'
              }`}
            >
              <plat.icone className={`w-6 h-6 mx-auto mb-1 ${plataforma === plat.id ? 'text-white' : 'text-white/40'}`} />
              <span className={`text-sm font-bold ${plataforma === plat.id ? 'text-white' : 'text-white/60'}`}>
                {plat.nome}
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && buscarTendencias()}
            placeholder={`Buscar tendências no ${PLATAFORMAS.find(p => p.id === plataforma)?.nome}...`}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none focus:border-purple-500/50"
          />
          <button
            onClick={buscarTendencias}
            disabled={carregando || !termo.trim()}
            className="px-4 py-3 rounded-xl bg-purple-500/20 text-purple-400 font-bold hover:bg-purple-500/30 transition disabled:opacity-50"
          >
            {carregando ? (
              <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </button>
        </div>

        {erro && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-6">
            {erro}
          </div>
        )}

        {tendencias.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              Popularidade — "{termo}" no {PLATAFORMAS.find(p => p.id === plataforma)?.nome}
            </h2>
            <div className="flex items-end gap-2 h-40">
              {tendencias.map((ponto, idx) => {
                const altura = Math.max(4, (ponto.value / 100) * 100);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-purple-500/40 to-purple-400 rounded-t"
                      style={{ height: `${altura}%` }}
                    ></div>
                    <span className="text-[10px] text-gray-400 mt-1 rotate-45 origin-left whitespace-nowrap">
                      {ponto.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-gray-500 text-xs mt-6 text-center">
          Dados fornecidos por Trends MCP. As buscas são limitadas a 20 por dia.
        </p>
      </div>
    </div>
  );
}
