import React, { useState } from 'react';
import { Sparkles, Loader2, Calendar, Clock, Hash } from 'lucide-react';

export default function SugestaoDia() {
  const [tema, setTema] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [erro, setErro] = useState('');

  const buscarSugestao = async () => {
    if (!tema.trim()) return;
    setCarregando(true);
    setErro('');
    setResultado(null);
    try {
      const resp = await fetch('/api/sugestao-dia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema })
      });
      const dados = await resp.json();
      if (!resp.ok) {
        setErro(dados.detail || 'Erro ao buscar sugestão');
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
          <Sparkles className="w-6 h-6 text-purple-400" />
          Sugestão do Dia
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          Digite um tema e receba uma sugestão de conteúdo para postar hoje, baseado em tendências.
        </p>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            placeholder="Ex: futebol, receitas veganas, programação..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none focus:border-purple-500/50"
          />
          <button
            onClick={buscarSugestao}
            disabled={carregando || !tema.trim()}
            className="px-6 py-3 rounded-xl bg-purple-500/20 text-purple-400 font-bold hover:bg-purple-500/30 transition disabled:opacity-50"
          >
            {carregando ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sugerir'}
          </button>
        </div>

        {erro && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-6">
            {erro}
          </div>
        )}

        {resultado && (
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-purple-400">{resultado.titulo_sugerido}</h2>
              <p className="text-gray-300 mt-2">{resultado.descricao_sugerida}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <Hash className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                <p className="text-xs text-gray-400">Hashtags</p>
                <div className="flex flex-wrap gap-1 justify-center mt-1">
                  {resultado.hashtags_sugeridas?.map((h: string) => (
                    <span key={h} className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">{h}</span>
                  ))}
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <Calendar className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <p className="text-xs text-gray-400">Formato</p>
                <p className="text-sm font-bold">{resultado.formato}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <Clock className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <p className="text-xs text-gray-400">Melhor horário</p>
                <p className="text-sm font-bold">{resultado.horario}</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-sm text-gray-400">💡 Por que esse conteúdo é relevante hoje?</h3>
              <p className="text-gray-300 mt-1">{resultado.motivo}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
            }
