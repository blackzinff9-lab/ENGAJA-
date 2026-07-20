import React, { useState } from 'react';
import { TrendingUp, Search, Smartphone, Play, Video, Info, ExternalLink } from 'lucide-react';

type PlataformaTendencia = 'tiktok' | 'instagram' | 'youtube';

const PLATAFORMAS = [
  { id: 'tiktok' as PlataformaTendencia, nome: 'TikTok', icone: Smartphone },
  { id: 'instagram' as PlataformaTendencia, nome: 'Instagram', icone: Play },
  { id: 'youtube' as PlataformaTendencia, nome: 'YouTube', icone: Video },
];

interface VideoTendencia {
  titulo: string;
  data: string;
  posicao: number;
}

export default function Tendencias() {
  const [videos, setVideos] = useState<VideoTendencia[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [termo, setTermo] = useState('');
  const [plataforma, setPlataforma] = useState<PlataformaTendencia>('youtube');
  const [erro, setErro] = useState('');

  const buscarTendencias = async () => {
    if (!termo.trim()) return;
    setCarregando(true);
    setErro('');
    try {
      const resposta = await fetch('/api/tendencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termo, plataforma })
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.detail || dados.mensagem || 'Erro ao buscar tendências.');
        setVideos([]);
        return;
      }

      if (dados.videos && dados.videos.length > 0) {
        setVideos(dados.videos);
      } else if (dados.tendencias && dados.tendencias.length > 0) {
        // Formato antigo compatível
        setVideos(dados.tendencias.map((t: any) => ({
          titulo: t.titulo || t.date || '',
          data: t.date || '',
          posicao: t.value || 0
        })));
      } else {
        setVideos([]);
        setErro(dados.mensagem || 'Nenhum dado encontrado para este termo.');
      }
    } catch (e) {
      setErro('Falha na conexão com o servidor.');
      setVideos([]);
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
          Veja os vídeos em alta no YouTube. TikTok e Instagram em breve.
        </p>

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
            placeholder={`Buscar tendências no YouTube...`}
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
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-amber-400 text-sm mb-6 flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {videos.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              Vídeos em alta: "{termo}"
            </h2>
            {videos.map((video, idx) => (
              <div
                key={idx}
                className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-3 hover:bg-white/10 transition"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400 font-bold text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{video.titulo}</p>
                  <p className="text-gray-500 text-xs mt-1">{video.data}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-500 flex-shrink-0 mt-1" />
              </div>
            ))}
          </div>
        )}

        <p className="text-gray-500 text-xs mt-6 text-center">
          Dados fornecidos pela API oficial do YouTube.
        </p>
      </div>
    </div>
  );
}
