import React, { useState } from 'react';
import { 
  Sparkles, ArrowRight, Loader2, Server, 
  TrendingUp, Target, Copy, CheckCircle, Crown, AlertCircle, Lock, Unlock
} from 'lucide-react';
import { Platform, PLATFORM_CONFIG } from './types';
import { StatusBackend } from './api';

interface DashboardProps {
  aoGerar: (tema: string, plataforma: Platform) => void;
  carregando: boolean;
  backendOk: boolean;
  statusBackend: StatusBackend | null;
  conteudoGerado: any;
  usuario: any;
}

const sugestoesTemas = [
  { emoji: "🥗", rotulo: "Receitas veganas", valor: "receitas veganas" },
  { emoji: "🏋️", rotulo: "Treino HIIT", valor: "treino HIIT em casa" },
  { emoji: "💻", rotulo: "Dicas de programação", valor: "dicas de programação" },
  { emoji: "💰", rotulo: "Renda extra", valor: "como ganhar renda extra online" },
];

export default function Dashboard({ aoGerar, carregando, backendOk, statusBackend, conteudoGerado, usuario }: DashboardProps) {
  const [tema, setTema] = useState('');
  const [plataforma, setPlataforma] = useState<Platform | null>(null);
  const [focado, setFocado] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [erroLimite, setErroLimite] = useState<string | null>(null);

  // Estados para a sequência de ideias
  const [sequenciaIdeias, setSequenciaIdeias] = useState<any[] | null>(null);
  const [carregandoSequencia, setCarregandoSequencia] = useState(false);
  const [ideiaExpandida, setIdeiaExpandida] = useState<number | null>(null);
  const [conteudoExtra, setConteudoExtra] = useState<any>(null);
  const [carregandoExtra, setCarregandoExtra] = useState(false);

  const aoEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tema.trim() || !plataforma) return;
    setErroLimite(null);
    try {
      await aoGerar(tema.trim(), plataforma);
    } catch (err: any) {
      if (err.message && err.message.includes("Limite")) {
        setErroLimite(err.message);
      }
    }
  };

  const copiarTexto = (texto: string, campo: string) => {
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(campo);
      setTimeout(() => setCopiado(null), 2000);
    });
  };

  const servicosTexto = statusBackend
    ? [
        statusBackend.groq_configurado && '✅ IA Groq',
        statusBackend.youtube_configurado && '✅ YouTube API',
        statusBackend.trends_mcp_configurado && '✅ Trends MCP'
      ].filter(Boolean).join('  •  ')
    : 'Verificando serviços...';

  const gerarSequencia = async () => {
    if (!tema || !plataforma) return;
    // Se não for Pro, redireciona para assinatura
    if (usuario?.plano !== 'pro') {
      handleAssinarPro();
      return;
    }
    setCarregandoSequencia(true);
    try {
      const token = localStorage.getItem('token');
      const resposta = await fetch('/api/gerar-sequencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ tema, plataforma }),
      });
      if (!resposta.ok) {
        const err = await resposta.json();
        alert(err.detail);
        return;
      }
      const dados = await resposta.json();
      setSequenciaIdeias(dados.ideias);
    } catch (erro) {
      alert('Erro ao gerar sequência de ideias.');
    } finally {
      setCarregandoSequencia(false);
    }
  };

  const expandirIdeia = async (index: number, temaCurto: string) => {
    setIdeiaExpandida(index);
    setCarregandoExtra(true);
    setConteudoExtra(null);
    try {
      const token = localStorage.getItem('token');
      const resposta = await fetch('/api/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ tema: temaCurto, plataforma }),
      });
      const dados = await resposta.json();
      setConteudoExtra(dados);
    } catch (erro) {
      alert('Erro ao gerar conteúdo completo.');
    } finally {
      setCarregandoExtra(false);
    }
  };

  const handleAssinarPro = async () => {
    if (!usuario || !usuario.email) {
      alert('Faça login para assinar o plano Pro.');
      return;
    }
    if (!usuario.sub) {
      alert('ID do usuário não encontrado. Faça logout e login novamente.');
      return;
    }
    try {
      const resposta = await fetch('/api/assinar-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: usuario.sub, email: usuario.email }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        alert(dados.detail || 'Erro ao criar assinatura');
        return;
      }
      if (dados.init_point) {
        window.location.href = dados.init_point;
      } else {
        alert('Erro ao iniciar assinatura.');
      }
    } catch (erro) {
      alert('Erro ao conectar com Mercado Pago.');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Cabeçalho */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-white/5 rounded-full px-4 py-1.5 mb-4 text-xs text-white/50">
          <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
          <span>Tendências reais • IA real • Resultados profissionais</span>
        </div>

        {/* Indicador de plano e upgrade */}
        {usuario && (
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-white/5 text-white/60">
              Plano atual: <span className="font-bold text-white">{usuario.plano === 'pro' ? 'PRO' : 'FREE'}</span>
            </div>

            {/* BENEFÍCIOS DO PRO (aparece apenas para FREE) */}
            {usuario.plano !== 'pro' && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-4 max-w-md mx-auto">
                <h3 className="text-sm font-bold text-amber-400 mb-2 flex items-center gap-1">
                  <Crown className="w-4 h-4" /> Vantagens do Plano Pro
                </h3>
                <ul className="text-xs text-gray-300 space-y-1 text-left">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                    Até <strong className="text-white">10 ideias por dia</strong> (3x mais que o Free)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                    Gere <strong className="text-white">10 ideias futuras</strong> em sequência
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                    Roteiros <strong className="text-white">ainda mais detalhados</strong> e otimizados
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                    Tenha acesso a <strong className="text-white">funcionalidades exclusivas</strong>
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* BOTÃO ASSINAR PRO (apenas se não for Pro) */}
        {usuario && usuario.plano !== 'pro' && (
          <div className="mb-6">
            <button
              onClick={handleAssinarPro}
              className="relative inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-gray-900 shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 transition-all overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity"></span>
              <Crown className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Assinar Pro (R$14,97/mês)</span>
              <ArrowRight className="w-5 h-5 relative z-10" />
            </button>
          </div>
        )}
      </div>

      {/* Status do Servidor */}
      <div className="mb-6 p-3 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-3 text-xs text-white/40">
          <Server className="w-3.5 h-3.5 text-purple-400/70" />
          <span>{servicosTexto}</span>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={aoEnviar} className="space-y-5">
        <div className="relative">
          <label className="block text-sm font-medium text-white/60 mb-2">
            <Target className="w-4 h-4 inline mr-1.5 text-purple-400" />
            Qual o tema do seu vídeo?
          </label>
          <input 
            type="text"
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            onFocus={() => setFocado(true)}
            onBlur={() => setFocado(false)}
            className={`w-full bg-white/5 border rounded-2xl px-5 py-4 text-white placeholder-white/20 outline-none transition ${
              focado ? 'border-purple-500/50' : 'border-white/10'
            }`}
            placeholder="Ex: receitas veganas, dicas de finanças..."
            maxLength={200}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {sugestoesTemas.map((sugestao) => (
            <button
              key={sugestao.valor}
              type="button"
              onClick={() => setTema(sugestao.valor)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition"
            >
              <span>{sugestao.emoji}</span>
              <span>{sugestao.rotulo}</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {(Object.keys(PLATFORM_CONFIG) as Platform[]).map((chave) => {
            const info = PLATFORM_CONFIG[chave];
            const selecionada = plataforma === chave;
            return (
              <button
                key={chave}
                type="button"
                onClick={() => setPlataforma(chave)}
                className={`rounded-2xl p-4 text-center transition-all ${
                  selecionada
                    ? 'bg-purple-500/20 border-2 border-purple-400 shadow-lg shadow-purple-500/10 scale-[1.02]'
                    : 'bg-white/5 border border-white/10 hover:border-white/20'
                }`}
              >
                <div className={`text-2xl mb-2 ${selecionada ? 'text-white' : 'text-white/40'}`}>
                  {React.createElement(info.icone)}
                </div>
                <div className={`text-sm font-bold ${selecionada ? 'text-white' : 'text-white/60'}`}>
                  {info.nome}
                </div>
                <div className="text-[10px] text-white/25 mt-1">{info.descricao}</div>
              </button>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={!tema.trim() || !plataforma || carregando}
          className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${
            !tema.trim() || !plataforma || carregando
              ? 'bg-white/5 text-white/20 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20'
          }`}
        >
          {carregando ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Gerando conteúdo...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Gerar Conteúdo</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
        {erroLimite && (
          <p className="text-xs text-amber-400/70 text-center flex items-center justify-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {erroLimite}
          </p>
        )}
        {!backendOk && (
          <p className="text-xs text-amber-400/70 text-center">
            ⚠️ Serviços ainda não verificados – o conteúdo pode demorar mais.
          </p>
        )}
      </form>
      
      {/* EXIBIÇÃO DO CONTEÚDO GERADO */}
      {conteudoGerado && (
        <div className="mt-10 space-y-6 animate-fade-in">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            Seu Conteúdo Viral
          </h2>

          {/* Título */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Título</span>
              <button onClick={() => copiarTexto(conteudoGerado.titulo, 'titulo')} className="text-white/30 hover:text-white transition">
                {copiado === 'titulo' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-white text-lg font-semibold">{conteudoGerado.titulo}</p>
          </div>

          {/* Descrição */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Descrição</span>
              <button onClick={() => copiarTexto(conteudoGerado.descricao, 'descricao')} className="text-white/30 hover:text-white transition">
                {copiado === 'descricao' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-white/80">{conteudoGerado.descricao}</p>
          </div>

          {/* Hashtags */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Hashtags</span>
              <button onClick={() => copiarTexto(conteudoGerado.hashtags, 'hashtags')} className="text-white/30 hover:text-white transition">
                {copiado === 'hashtags' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-emerald-400 font-medium whitespace-pre-wrap break-words">
              {conteudoGerado.hashtags}
            </p>
          </div>

          {/* Roteiro */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Roteiro</span>
              <button onClick={() => copiarTexto(conteudoGerado.roteiro, 'roteiro')} className="text-white/30 hover:text-white transition">
                {copiado === 'roteiro' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-white/80 whitespace-pre-line">{conteudoGerado.roteiro}</p>
          </div>

          {/* Ideia de Edição */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Ideia de Edição</span>
              <button onClick={() => copiarTexto(conteudoGerado.ideiaEdicao, 'ideiaEdicao')} className="text-white/30 hover:text-white transition">
                {copiado === 'ideiaEdicao' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-white/80">{conteudoGerado.ideiaEdicao}</p>
          </div>

          {/* BOTÃO GERAR 10 IDEIAS (SEMPRE DOURADO, COM CORRENTES SE FREE) */}
          {!sequenciaIdeias && (
            <div className="mt-10 text-center">
              {usuario?.plano === 'pro' ? (
                /* Versão desbloqueada para Pro */
                <div>
                  <button
                    onClick={gerarSequencia}
                    disabled={carregandoSequencia}
                    className="relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-gray-900 shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 transition-all disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden group"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {carregandoSequencia ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                        <span className="relative z-10">Gerando sequência...</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-5 h-5 relative z-10" />
                        <span className="relative z-10">Gerar 10 Ideias Futuras</span>
                        <ArrowRight className="w-5 h-5 relative z-10" />
                      </>
                    )}
                  </button>
                  <p className="text-xs text-amber-400/70 mt-2">
                    ✨ Gere ideias para os seus 10 próximos vídeos, interligados e otimizados para o algoritmo.
                  </p>
                </div>
              ) : (
                /* Versão bloqueada para Free (dourado com correntes) */
                <div>
                  <div className="relative inline-block">
                    {/* Correntes visuais (sobreposição) */}
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 rounded-2xl opacity-40 blur-sm"></div>
                    <button
                      onClick={gerarSequencia}
                      className="relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-gray-900 shadow-xl shadow-amber-500/30 hover:scale-105 transition-all overflow-hidden group"
                    >
                      <span className="absolute inset-0 bg-black/40 rounded-2xl z-10"></span>
                      <Lock className="w-5 h-5 relative z-20 text-white" />
                      <span className="relative z-20 text-white/90">Gerar 10 Ideias Futuras</span>
                      <span className="relative z-20 text-xs bg-black/40 px-2 py-0.5 rounded-full text-amber-400 ml-2">PRO</span>
                    </button>
                    {/* Ícones de corrente decorativos */}
                    <div className="absolute -top-2 -right-2 z-30">
                      <Lock className="w-5 h-5 text-amber-400 drop-shadow-lg" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    🔒 Gere ideias para os seus 10 próximos vídeos interligados. <button type="button" onClick={handleAssinarPro} className="underline text-amber-400 hover:text-amber-300">Assine o Pro para desbloquear</button>
                  </p>
                </div>
              )}
            </div>
          )}

          {sequenciaIdeias && (
            <div className="mt-10 space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-amber-400" />
                Próximos 10 Vídeos (Diversos)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sequenciaIdeias.map((ideia: any, idx: number) => (
                  <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-amber-400/30 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <span className="text-xs text-amber-400 font-bold">#{idx + 1}</span>
                        <h3 className="text-white font-semibold mt-1">{ideia.titulo}</h3>
                        <p className="text-white/50 text-sm mt-1">{ideia.temaCurto}</p>
                      </div>
                      <button
                        onClick={() => expandirIdeia(idx, ideia.temaCurto)}
                        disabled={carregandoExtra && ideiaExpandida === idx}
                        className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 text-xs font-bold hover:bg-amber-500/30 transition-all disabled:opacity-50"
                      >
                        {carregandoExtra && ideiaExpandida === idx ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Gerar Conteúdo'
                        )}
                      </button>
                    </div>
                    {ideiaExpandida === idx && conteudoExtra && (
                      <div className="mt-4 pt-4 border-t border-white/10 space-y-3 animate-fade-in">
                        <div className="bg-white/5 rounded-xl p-3">
                          <span className="text-xs text-purple-400 font-bold">TÍTULO</span>
                          <p className="text-white text-sm">{conteudoExtra.titulo}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3">
                          <span className="text-xs text-purple-400 font-bold">DESCRIÇÃO</span>
                          <p className="text-white/80 text-xs">{conteudoExtra.descricao}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3">
                          <span className="text-xs text-purple-400 font-bold">HASHTAGS</span>
                          <p className="text-emerald-400 text-xs">{conteudoExtra.hashtags}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3">
                          <span className="text-xs text-purple-400 font-bold">ROTEIRO</span>
                          <p className="text-white/80 text-xs whitespace-pre-line">{conteudoExtra.roteiro}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3">
                          <span className="text-xs text-purple-400 font-bold">IDEIA DE EDIÇÃO</span>
                          <p className="text-white/80 text-xs">{conteudoExtra.ideiaEdicao}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
          }
      
