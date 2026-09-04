import React, { useState } from 'react';
import { TrendingUp, Loader2, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

export default function DiagnosticoViral() {
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
      const resp = await fetch('/api/diagnostico-viral', {
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

  return (
    <div className="min-h-screen bg-gray-950 text-white py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-purple-400" />
          Diagnóstico de Viralização
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          Cole o link de um vídeo e descubra os motivos pelos quais ele viralizou (ou não).
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
            {carregando ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Diagnosticar'}
          </button>
        </div>

        {erro && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-6">
            {erro}
          </div>
        )}

        {resultado && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <h2 className="font-bold text-lg truncate">{resultado.titulo}</h2>
              <p className="text-sm text-gray-400">{resultado.canal}</p>
              <a href={resultado.url} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-400 hover:underline flex items-center gap-1">
                Ver original <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <span className="text-sm text-gray-400">Viralizou?</span>
              <div className="text-2xl font-bold">
                {resultado.viralizou ? (
                  <span className="text-green-400">✅ SIM</span>
                ) : (
                  <span className="text-red-400">❌ NÃO (ou não estimado)</span>
                )}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-purple-400 font-bold">🎯 Motivos</h3>
              <ul className="mt-2 space-y-1">
                {resultado.motivos?.map((m: string, i: number) => (
                  <li key={i} className="text-sm text-gray-300">• {m}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-emerald-400 font-bold">🔥 Fatores Chave</h3>
              <ul className="mt-2 space-y-1">
                {resultado.fatores_chave?.map((f: string, i: number) => (
                  <li key={i} className="text-sm text-gray-300">• {f}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-amber-400 font-bold">📚 Lições</h3>
              <ul className="mt-2 space-y-1">
                {resultado.licoes?.map((l: string, i: number) => (
                  <li key={i} className="text-sm text-gray-300">• {l}</li>
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
