import React, { useState } from 'react';
import { TrendingUp, Search, Smartphone, Play, Video, Hash, Film, ExternalLink, Loader2 } from 'lucide-react';

type PlataformaTendencia = 'tiktok' | 'instagram' | 'youtube';

const PLATAFORMAS = [
  { id: 'tiktok' as PlataformaTendencia, nome: 'TikTok', icone: Smartphone },
  { id: 'instagram' as PlataformaTendencia, nome: 'Instagram', icone: Play },
  { id: 'youtube' as PlataformaTendencia, nome: 'YouTube', icone: Video },
];

interface DadosTendencias {
  hashtags: string[];
  titulos: string[];
  videos: { titulo: string; url: string; video_id?: string }[];
}

export default function Tendencias() {
  const [dados, setDados] = useState<DadosTendencias | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [termo, setTermo] = useState('');
  const [plataforma, setPlataforma] = useState<PlataformaTendencia>('youtube');
  const [erro, setErro] = useState('');

  const buscarTendencias = async () => {
    if (!termo.trim()) return;
    setCarregando(true);
    setErro('');
    setDados(null);
    try {
      const resposta = await fetch('/api/tendencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termo, plataforma })
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.detail || dados.mensagem || 'Erro ao buscar tendências.');
        return;
      }

      setDados({
        hashtags: dados.hashtags || [],
        titulos: dados.titulos || [],
        videos: dados.videos || []
      });
    } catch (e) {
      setErro('Falha na conexão com o servidor.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-purple-400" />
          Tendências em Tempo Real
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          Pesquise um assunto e veja as principais hashtags, títulos e vídeos em alta.
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
            placeholder={`Buscar tendências em ${PLATAFORMAS.find(p => p.id === plataforma)?.nome}...`}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none focus:border-purple-500/50"
          />
          <button
            onClick={buscarTendencias}
            disabled={carregando || !termo.trim()}
            className="px-4 py-3 rounded-xl bg-purple-500/20 text-purple-400 font-bold hover:bg-purple-500/30 transition disabled:opacity-50"
          >
            {carregando ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </button>
        </div>

        {erro && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-amber-400 text-sm mb-6 flex items-start gap-2">
            <span>⚠️</span>
            <span>{erro}</span>
          </div>
        )}

        {dados && (
          <div className="space-y-8">
            {/* Hashtags - sempre aparece */}
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                <Hash className="w-5 h-5 text-purple-400" />
                Hashtags em alta
              </h3>
              <div className="flex flex-wrap gap-2">
                {dados.hashtags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-medium"
                  >
                    {tag.startsWith('#') ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
            </div>

            {/* Para YouTube: mostra vídeos (já contém os títulos) */}
            {plataforma === 'youtube' && dados.videos.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                  <Video className="w-5 h-5 text-red-400" />
                  Vídeos em destaque
                </h3>
                <div className="space-y-2">
                  {dados.videos.map((video, i) => (
                    <a
                      key={i}
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between hover:bg-white/10 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-400 w-6">{i + 1}</span>
                        <span className="text-white/80 text-sm">{video.titulo}</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Para TikTok/Instagram: mostra títulos (não temos vídeos com URL) */}
            {plataforma !== 'youtube' && dados.titulos.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                  <Film className="w-5 h-5 text-emerald-400" />
                  Títulos populares
                </h3>
                <div className="space-y-2">
                  {dados.titulos.map((titulo, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                      <span className="text-sm font-bold text-purple-400 w-6">{i + 1}</span>
                      <span className="text-white/80 text-sm">{titulo}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-gray-500 text-xs mt-8 text-center">
          Dados obtidos via {plataforma === 'youtube' ? 'YouTube Data API' : 'Trends MCP API'}.
          {!dados && !carregando && ' Pesquise algo para ver as tendências.'}
        </p>
      </div>
    </div>
  );
}
