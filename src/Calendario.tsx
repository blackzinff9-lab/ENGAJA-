import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, X, Plus, Trash2, Save, FileText, Hash, Video, Palette, StickyNote, MoveHorizontal, Circle, CheckCircle, Edit3, Play } from 'lucide-react';

type StatusIdeia = 'ideia' | 'gravando' | 'editando' | 'postado';

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
  status: StatusIdeia;
}

const STATUS_CONFIG: Record<StatusIdeia, { label: string; cor: string; icone: React.ReactNode }> = {
  ideia: { label: 'Ideia', cor: 'text-gray-400 bg-gray-500/20', icone: <Circle className="w-3 h-3" /> },
  gravando: { label: 'Gravando', cor: 'text-blue-400 bg-blue-500/20', icone: <Play className="w-3 h-3" /> },
  editando: { label: 'Editando', cor: 'text-amber-400 bg-amber-500/20', icone: <Edit3 className="w-3 h-3" /> },
  postado: { label: 'Postado', cor: 'text-emerald-400 bg-emerald-500/20', icone: <CheckCircle className="w-3 h-3" /> },
};

const PROXIMO_STATUS: Record<StatusIdeia, StatusIdeia> = {
  ideia: 'gravando',
  gravando: 'editando',
  editando: 'postado',
  postado: 'ideia',
};

export default function Calendario() {
  const [ideias, setIdeias] = useState<IdeiaCalendario[]>([]);
  const [mesAtual, setMesAtual] = useState(new Date().getMonth());
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [modoAdicao, setModoAdicao] = useState(false);

  // Campos do formulário manual
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novasHashtags, setNovasHashtags] = useState('');
  const [novaAnotacao, setNovaAnotacao] = useState('');

  // Estado para mover ideia
  const [ideiaParaMover, setIdeiaParaMover] = useState<string | null>(null);
  const [novaData, setNovaData] = useState('');

  useEffect(() => {
    const salvas = JSON.parse(localStorage.getItem('engajai_calendario') || '[]');
    // Garantir que ideias antigas sem status recebam o status 'ideia'
    const normalizadas = salvas.map((i: any) => ({ ...i, status: i.status || 'ideia' }));
    setIdeias(normalizadas);
  }, []);

  const salvarNoLocalStorage = (novasIdeias: IdeiaCalendario[]) => {
    localStorage.setItem('engajai_calendario', JSON.stringify(novasIdeias));
    setIdeias(novasIdeias);
  };

  const adicionarIdeiaManual = () => {
    if (!novoTitulo.trim() || !diaSelecionado) return;
    const nova: IdeiaCalendario = {
      id: Date.now().toString(),
      titulo: novoTitulo,
      descricao: novaDescricao,
      hashtags: novasHashtags,
      roteiro: '',
      ideiaEdicao: '',
      data: diaSelecionado,
      anotacao: novaAnotacao,
      plataforma: 'manual',
      status: 'ideia',
    };
    const novasIdeias = [...ideias, nova];
    salvarNoLocalStorage(novasIdeias);
    setNovoTitulo('');
    setNovaDescricao('');
    setNovasHashtags('');
    setNovaAnotacao('');
    setModoAdicao(false);
  };

  const excluirIdeia = (id: string) => {
    const novasIdeias = ideias.filter(i => i.id !== id);
    salvarNoLocalStorage(novasIdeias);
  };

  const alterarStatus = (id: string) => {
    const novasIdeias = ideias.map(i => {
      if (i.id === id) {
        return { ...i, status: PROXIMO_STATUS[i.status] };
      }
      return i;
    });
    salvarNoLocalStorage(novasIdeias);
  };

  const moverIdeia = (id: string) => {
    if (!novaData) return;
    const novasIdeias = ideias.map(i => {
      if (i.id === id) {
        return { ...i, data: novaData };
      }
      return i;
    });
    salvarNoLocalStorage(novasIdeias);
    setIdeiaParaMover(null);
    setNovaData('');
  };

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
    setModoAdicao(false);
    setModalAberto(true);
  };

  const ideiasDoDia = diaSelecionado ? ideias.filter(ideia => ideia.data === diaSelecionado) : [];

  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="min-h-screen bg-gray-950 text-white py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Mensagem de boas-vindas */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            Calendário Editorial
          </h1>
          <p className="text-gray-400 text-sm">
            📅 Clique em qualquer dia para ver suas ideias ou adicionar uma nova.
          </p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <button onClick={() => mudarMes(-1)} className="text-2xl px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xl font-semibold">{meses[mesAtual]} {anoAtual}</span>
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
                <div className="text-center text-gray-600 hover:text-purple-400 mt-1">
                  <Plus className="w-4 h-4 mx-auto" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal de visualização / adição */}
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

            {!modoAdicao ? (
              <>
                {ideiasDoDia.length === 0 && (
                  <p className="text-gray-400 text-sm mb-4">Nenhuma ideia para este dia.</p>
                )}
                <div className="space-y-4 mb-4">
                  {ideiasDoDia.map((ideia) => {
                    const statusConfig = STATUS_CONFIG[ideia.status];
                    return (
                      <div key={ideia.id} className="bg-white/5 border border-white/10 rounded-xl p-4 relative space-y-3">
                        <div className="absolute top-2 right-2 flex gap-1">
                          {/* Botão Mover */}
                          <button
                            onClick={() => {
                              setIdeiaParaMover(ideia.id);
                              setNovaData(ideia.data);
                            }}
                            className="text-gray-500 hover:text-blue-400 transition"
                            title="Mover para outro dia"
                          >
                            <MoveHorizontal className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => excluirIdeia(ideia.id)}
                            className="text-gray-500 hover:text-red-400 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Status */}
                        <button
                          onClick={() => alterarStatus(ideia.id)}
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${statusConfig.cor}`}
                        >
                          {statusConfig.icone}
                          {statusConfig.label}
                        </button>

                        {/* Título */}
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-[10px] text-purple-400 uppercase tracking-wider font-bold">Título</span>
                            <p className="text-white font-semibold">{ideia.titulo}</p>
                          </div>
                        </div>

                        {/* Descrição */}
                        {ideia.descricao && (
                          <div className="flex items-start gap-2">
                            <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Descrição</span>
                              <p className="text-gray-300 text-sm">{ideia.descricao}</p>
                            </div>
                          </div>
                        )}

                        {/* Hashtags */}
                        {ideia.hashtags && (
                          <div className="flex items-start gap-2">
                            <Hash className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold">Hashtags</span>
                              <p className="text-emerald-300 text-sm">{ideia.hashtags}</p>
                            </div>
                          </div>
                        )}

                        {/* Roteiro */}
                        {ideia.roteiro && (
                          <div className="flex items-start gap-2">
                            <Video className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="text-[10px] text-blue-400 uppercase tracking-wider font-bold">Roteiro</span>
                              <p className="text-gray-400 text-sm whitespace-pre-line">{ideia.roteiro}</p>
                            </div>
                          </div>
                        )}

                        {/* Ideia de Edição */}
                        {ideia.ideiaEdicao && (
                          <div className="flex items-start gap-2">
                            <Palette className="w-4 h-4 text-pink-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="text-[10px] text-pink-400 uppercase tracking-wider font-bold">Ideia de Edição</span>
                              <p className="text-gray-400 text-sm">{ideia.ideiaEdicao}</p>
                            </div>
                          </div>
                        )}

                        {/* Anotação */}
                        {ideia.anotacao && (
                          <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                            <StickyNote className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="text-[10px] text-yellow-400 uppercase tracking-wider font-bold">Anotação</span>
                              <p className="text-gray-300 text-sm">{ideia.anotacao}</p>
                            </div>
                          </div>
                        )}

                        {/* Plataforma */}
                        {ideia.plataforma && ideia.plataforma !== 'manual' && (
                          <p className="text-[10px] text-purple-400/60">Gerado para: {ideia.plataforma}</p>
                        )}

                        {/* Modal de mover (mini) */}
                        {ideiaParaMover === ideia.id && (
                          <div className="bg-gray-800 border border-gray-600 rounded-xl p-3 mt-2">
                            <p className="text-xs text-gray-400 mb-2">Mover para:</p>
                            <input
                              type="date"
                              value={novaData}
                              onChange={(e) => setNovaData(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-purple-500/50"
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => setIdeiaParaMover(null)}
                                className="flex-1 py-2 rounded-lg bg-white/5 text-gray-400 text-xs hover:bg-white/10 transition"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => moverIdeia(ideia.id)}
                                disabled={!novaData}
                                className="flex-1 py-2 rounded-lg bg-purple-500/20 text-purple-400 text-xs font-bold hover:bg-purple-500/30 transition disabled:opacity-50"
                              >
                                Mover
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => setModoAdicao(true)}
                  className="w-full py-3 rounded-xl bg-purple-500/20 text-purple-400 font-bold hover:bg-purple-500/30 transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nova ideia
                </button>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Título da ideia"
                    value={novoTitulo}
                    onChange={(e) => setNovoTitulo(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none focus:border-purple-500/50"
                  />
                  <textarea
                    placeholder="Descrição (opcional)"
                    value={novaDescricao}
                    onChange={(e) => setNovaDescricao(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none focus:border-purple-500/50 resize-none h-20"
                  />
                  <input
                    type="text"
                    placeholder="Hashtags (opcional, ex: #tag1 #tag2)"
                    value={novasHashtags}
                    onChange={(e) => setNovasHashtags(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none focus:border-purple-500/50"
                  />
                  <textarea
                    placeholder="Anotação pessoal (opcional)"
                    value={novaAnotacao}
                    onChange={(e) => setNovaAnotacao(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none focus:border-purple-500/50 resize-none h-20"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setModoAdicao(false)}
                      className="flex-1 py-3 rounded-xl bg-white/5 text-gray-400 font-bold hover:bg-white/10 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={adicionarIdeiaManual}
                      disabled={!novoTitulo.trim()}
                      className="flex-1 py-3 rounded-xl bg-purple-500/20 text-purple-400 font-bold hover:bg-purple-500/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Salvar
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
                }
