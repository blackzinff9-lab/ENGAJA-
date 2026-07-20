import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react';

interface IdeiaCalendario {
  id: string;
  titulo: string;
  descricao?: string;
  hashtags?: string;
  roteiro?: string;
  ideiaEdicao?: string;
  data: string;
  anotacao?: string;
  plataforma?: string;
}

export default function Calendario() {
  const [ideias, setIdeias] = useState<IdeiaCalendario[]>([]);
  const [mesAtual, setMesAtual] = useState(new Date().getMonth());
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    const salvas = JSON.parse(localStorage.getItem('engajai_calendario') || '[]');
    setIdeias(salvas);
  }, []);

  const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
  const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay();

  const mudarMes = (direcao: number) => {
    let novoMes = mesAtual + direcao;
    let novoAno = anoAtual;
    if (novoMes < 0) { novoMes = 11; novoAno--; }
    else if (novoMes > 11) { novoMes = 0; novoAno++; }
    setMesAtual(novoMes);
    setAnoAtual(novoAno);
  };

  const abrirDia = (data: string) => {
    setDiaSelecionado(data);
    setModalAberto(true);
  };

  const ideiasDoDia = diaSelecionado ? ideias.filter(ideia => ideia.data === diaSelecionado) : [];

  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="min-h-screen bg-gray-950 text-white py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => mudarMes(-1)} className="text-2xl px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            {meses[mesAtual]} {anoAtual}
          </h1>
          <button onClick={() => mudarMes(1)} className="text-2xl px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-2">
          {diasSemana.map(d => <div key={d} className="py-1">{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: primeiroDia }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[80px]" />
          ))}
          {Array.from({ length: diasNoMes }).map((_, i) => {
            const dia = i + 1;
            const data = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
            const ideiasDoDiaCount = ideias.filter(ideia => ideia.data === data).length;
            const isHoje = data === new Date().toISOString().split('T')[0];
            return (
              <button
                key={dia}
                onClick={() => abrirDia(data)}
                className={`min-h-[80px] p-1 rounded-lg border transition text-left ${
                  isHoje ? 'bg-purple-500/10 border-purple-400/50' : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="text-right text-xs text-gray-400 mb-1">{dia}</div>
                {ideiasDoDiaCount > 0 && (
                  <div className="text-[10px] bg-purple-500/20 text-purple-300 rounded px-1 py-0.5 text-center">
                    {ideiasDoDiaCount} ideia{ideiasDoDiaCount > 1 ? 's' : ''}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal de visualização das ideias do dia */}
      {modalAberto && diaSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-5 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">
                {diaSelecionado.split('-').reverse().join('/')}
              </h2>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {ideiasDoDia.length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhuma ideia salva para este dia.</p>
            ) : (
              <div className="space-y-4">
                {ideiasDoDia.map((ideia, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                    <h3 className="text-white font-bold text-lg">{ideia.titulo}</h3>
                    {ideia.plataforma && <p className="text-xs text-purple-400">{ideia.plataforma}</p>}
                    {ideia.descricao && <p className="text-gray-300 text-sm">{ideia.descricao}</p>}
                    {ideia.hashtags && <p className="text-emerald-400 text-sm">{ideia.hashtags}</p>}
                    {ideia.roteiro && (
                      <details className="text-gray-400 text-sm">
                        <summary className="cursor-pointer text-purple-400">Ver roteiro</summary>
                        <p className="mt-2 whitespace-pre-line">{ideia.roteiro}</p>
                      </details>
                    )}
                    {ideia.ideiaEdicao && (
                      <details className="text-gray-400 text-sm">
                        <summary className="cursor-pointer text-purple-400">Ver ideia de edição</summary>
                        <p className="mt-2">{ideia.ideiaEdicao}</p>
                      </details>
                    )}
                    {ideia.anotacao && (
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 mt-2">
                        <p className="text-yellow-400 text-xs font-bold mb-1">📝 Anotação</p>
                        <p className="text-gray-300 text-xs">{ideia.anotacao}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
