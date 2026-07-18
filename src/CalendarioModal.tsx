import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Check, Calendar } from 'lucide-react';

interface CalendarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: string, anotacao: string) => void;
  tituloIdeia: string;
}

export default function CalendarioModal({ isOpen, onClose, onSave, tituloIdeia }: CalendarioModalProps) {
  const [mesAtual, setMesAtual] = useState(new Date().getMonth());
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);
  const [anotacao, setAnotacao] = useState('');
  const [etapa, setEtapa] = useState<'calendario' | 'anotacao'>('calendario');

  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

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

  const selecionarDia = (dia: number) => {
    const data = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    setDiaSelecionado(data);
    setEtapa('anotacao');
  };

  const confirmar = () => {
    if (diaSelecionado) {
      onSave(diaSelecionado, anotacao);
      onClose();
      setDiaSelecionado(null);
      setAnotacao('');
      setEtapa('calendario');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            {etapa === 'calendario' ? 'Escolha o dia' : 'Adicionar anotação'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {etapa === 'calendario' ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => mudarMes(-1)} className="text-gray-400 hover:text-white transition">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-white font-semibold">{meses[mesAtual]} {anoAtual}</span>
              <button onClick={() => mudarMes(1)} className="text-gray-400 hover:text-white transition">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-2">
              {diasSemana.map(d => <div key={d}>{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: primeiroDia }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: diasNoMes }).map((_, i) => {
                const dia = i + 1;
                const data = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                const isHoje = data === new Date().toISOString().split('T')[0];
                return (
                  <button
                    key={dia}
                    onClick={() => selecionarDia(dia)}
                    className={`h-10 rounded-lg text-sm font-medium transition ${
                      isHoje
                        ? 'bg-purple-500/30 text-white border border-purple-400'
                        : 'bg-white/5 text-gray-300 hover:bg-purple-500/20 hover:text-white'
                    }`}
                  >
                    {dia}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-3">
              Adicionar <strong className="text-white">"{tituloIdeia}"</strong> ao dia <strong className="text-white">{diaSelecionado?.split('-').reverse().join('/')}</strong>
            </p>
            <textarea
              value={anotacao}
              onChange={(e) => setAnotacao(e.target.value)}
              placeholder="Escreva uma anotação (opcional)..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none focus:border-purple-500/50 resize-none h-24 text-sm"
              maxLength={200}
            />
            <button
              onClick={confirmar}
              className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Confirmar
            </button>
          </>
        )}
      </div>
    </div>
  );
  }
