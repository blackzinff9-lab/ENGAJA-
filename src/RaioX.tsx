import React, { useState } from 'react';
import { Search, Loader2, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

export default function RaioX() {
  const [url, setUrl] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [erro, setErro] = useState('');

  const analisar = async () => {
    if (!url.trim()) return;
    setCarregando(true);
    setErro('');
    setResultado(null);
    try {
      const resp = await fetch('/api/raio-x', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const dados = await resp.json();
      if (!resp.ok) {
        setErro(dados.detail || 'Erro ao analisar vídeo');
        return;
      }
      setResultado(dados);
    } catch (e) {
      setErro('Falha na conexão com o servidor.');
    } finally {
      setCarregando(false);
    }
  };

  const renderNota = (nota: number) => {
    const cor = nota >= 7 ? 'text-green-400' : nota >= 5 ? 'text-yellow-400' : 'text-red-400';
    return <span className={`text-2xl font-bold ${cor}`}>{nota}/10</span>;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Search className="w-6 h-6 text-purple-400" />
          Raio-X do Vídeo
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          Cole o link de um vídeo (YouTube, TikTok ou Instagram) e receba uma análise detalhada.
          {resultado?.transcricao_disponivel && <span className="text-green-400 ml-2">✅ Transcrição disponível</span>}
          {resultado && !resultado.transcricao_disponivel && <span className="text-yellow-400 ml-2">⚠️ Análise baseada apenas em metadados</span>}
        </p>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Cole o link do vídeo aqui..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none focus:border-purple-500/50"
          />
          <button
            onClick={analisar}
            disabled={carregando || !url.trim()}
            className="px-6 py-3 rounded-xl bg-purple-500/20 text-purple-400 font-bold hover:bg-purple-500/30 transition disabled:opacity-50"
          >
            {carregando ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Analisar'}
          </button>
        </div>

        {erro && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-6">
            {erro}
          </div>
        )}

        {resultado && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4">
              {resultado.thumbnail && (
                <img src={resultado.thumbnail} alt={resultado.titulo} className="w-32 h-20 object-cover rounded-lg" />
              )}
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-lg truncate">{resultado.titulo}</h2>
                <p className="text-sm text-gray-400">{resultado.canal}</p>
                <a href={resultado.url} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-400 hover:underline flex items-center gap-1">
                  Ver original <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['gancho', 'retencao', 'cta', 'storytelling'].map((key) => (
                <div key={key} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <span className="text-xs text-gray-400 uppercase">{key}</span>
                  <div className="mt-1">{renderNota(resultado[key]?.nota || 0)}</div>
                  <p className="text-xs text-gray-400 mt-1">{resultado[key]?.explicacao?.slice(0, 60)}...</p>
                </div>
              ))}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <span className="text-sm text-gray-400">Qualidade Geral</span>
              <div className="text-3xl font-bold text-purple-400">{resultado.qualidade}/10</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                <h3 className="text-emerald-400 font-bold flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Pontos Fortes</h3>
                <ul className="mt-2 space-y-1">
                  {resultado.pontos_fortes?.map((p: string, i: number) => (
                    <li key={i} className="text-sm text-gray-300">• {p}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                <h3 className="text-amber-400 font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Pontos a Melhorar</h3>
                <ul className="mt-2 space-y-1">
                  {resultado.pontos_melhores?.map((p: string, i: number) => (
                    <li key={i} className="text-sm text-gray-300">• {p}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-purple-400 font-bold">💡 Sugestões</h3>
              <ul className="mt-2 space-y-1">
                {resultado.sugestoes?.map((s: string, i: number) => (
                  <li key={i} className="text-sm text-gray-300">• {s}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-sm text-gray-300">{resultado.resumo}</p>
              {resultado.aviso && <p className="text-xs text-yellow-400 mt-2">{resultado.aviso}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
