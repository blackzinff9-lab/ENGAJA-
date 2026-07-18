import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface IdeiaCalendario {
  id: string;
  titulo: string;
  data: string;
  anotacao?: string;
}

export default function Calendario() {
  const [ideias, setIdeias] = useState<IdeiaCalendario[]>([]);
  const [mesAtual, setMesAtual] = useState(new Date().getMonth());
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());

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
            const ideiasDoDia = ideias.filter(ideia => ideia.data === data);
            const isHoje = data === new Date().toISOString().split('T')[0];
            return (
              <div
                key={dia}
                className={`min-h-[80px] p-1 rounded-lg border transition ${
                  isHoje ? 'bg-purple-500/10 border-purple-400/50' : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="text-right text-xs text-gray-400 mb-1">{dia}</div>
                {ideiasDoDia.slice(0, 3).map((ideia, idx) => (
                  <div key={idx} className="text-[10px] bg-purple-500/20 text-purple-300 rounded px-1 py-0.5 truncate mb-0.5" title={ideia.anotacao || ''}>
                    {ideia.titulo}
                  </div>
                ))}
                {ideiasDoDia.length > 3 && (
                  <div className="text-[10px] text-gray-500 text-center">+{ideiasDoDia.length - 3} mais</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
                  }
