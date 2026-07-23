import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Loader2, Server, TrendingUp, Target, Copy, CheckCircle, Crown, AlertCircle, Lock, Unlock, LogIn } from 'lucide-react';
import { Platform, PLATFORM_CONFIG } from './types';
import { StatusBackend } from './api';
import { useLanguage } from './LanguageContext';
import CalendarioModal from './CalendarioModal';

interface DashboardProps {
  aoGerar: (tema: string, plataforma: Platform) => void;
  carregando: boolean;
  backendOk: boolean;
  statusBackend: StatusBackend | null;
  conteudoGerado: any;
  usuario: any;
  temaInicial?: string;
  plataformaInicial?: Platform | null;
  onLimparCamposSalvos?: () => void;
}

const sugestoesTemasPt = [
  { emoji: "🍳", rotulo: 'Receitas veganas', valor: "receitas veganas" },
  { emoji: "💪", rotulo: 'Treino HIIT', valor: "treino HIIT em casa" },
  { emoji: "💻", rotulo: 'Dicas de programação', valor: "dicas de programação" },
  { emoji: "💰", rotulo: 'Renda extra', valor: "como ganhar renda extra online" },
];

const sugestoesTemasEn = [
  { emoji: "🍳", rotulo: 'Vegan Recipes', valor: "vegan recipes" },
  { emoji: "💪", rotulo: 'HIIT Workout', valor: "hiit workout at home" },
  { emoji: "💻", rotulo: 'Programming Tips', valor: "programming tips" },
  { emoji: "💰", rotulo: 'Extra Income', valor: "how to earn extra income online" },
];

export default function Dashboard({
  aoGerar,
  carregando,
  backendOk,
  statusBackend,
  conteudoGerado,
  usuario,
  temaInicial,
  plataformaInicial,
  onLimparCamposSalvos
}: DashboardProps) {
  const { t, lang } = useLanguage();
  const sugestoesTemas = lang === 'pt' ? sugestoesTemasPt : sugestoesTemasEn;

  const [tema, setTema] = useState('');
  const [plataforma, setPlataforma] = useState<Platform | null>(null);
  const [focado, setFocado] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [erroLimite, setErroLimite] = useState<string | null>(null);
  const [sequenciaIdeias, setSequenciaIdeias] = useState<any[] | null>(null);
  const [carregandoSequencia, setCarregandoSequencia] = useState(false);
  const [ideiaExpandida, setIdeiaExpandida] = useState<number | null>(null);
  const [conteudoExtra, setConteudoExtra] = useState<any | null>(null);
  const [carregandoExtra, setCarregandoExtra] = useState(false);

  const [calendarioAberto, setCalendarioAberto] = useState(false);
  const [ideiaParaCalendario, setIdeiaParaCalendario] = useState('');
  const [ideiaCompletaParaCalendario, setIdeiaCompletaParaCalendario] = useState<any>(null);

  useEffect(() => {
    if (temaInicial) {
      setTema(temaInicial);
    }
    if (plataformaInicial) {
      setPlataforma(plataformaInicial);
    }
    if (onLimparCamposSalvos && (temaInicial || plataformaInicial)) {
      onLimparCamposSalvos();
    }
  }, [temaInicial, plataformaInicial, onLimparCamposSalvos]);

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
        statusBackend.trendsmcp_configurado && '✅ Trends MCP'
      ].filter(Boolean).join(' • ')
    : t('dash_status_verifying');

  const gerarSequencia = async () => {
    if (!tema || !plataforma) return;
    if (!usuario) {
      aoGerar(tema, plataforma);
      return;
    }
    if (usuario?.plano !== 'pro') {
      handleAssinarPro();
      return;
    }
    setCarregandoSequencia(true);
    try {
      const token = localStorage.getItem('token');
      const resposta = await fetch('/api/gerar-sequencia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tema, plataforma, idioma: lang }),
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
    if (!usuario) {
      aoGerar(temaCurto, plataforma || 'tiktok');
      return;
    }
    setIdeiaExpandida(index);
    setCarregandoExtra(true);
    setConteudoExtra(null);
    try {
      const token = localStorage.getItem('token');
      const resposta = await fetch('/api/gerar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tema: temaCurto, plataforma, idioma: lang }),
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
    if (!usuario) {
      aoGerar(tema || 'tema', plataforma || 'tiktok');
      return;
    }
    if (!usuario.email) {
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

  const abrirCalendario = (ideiaCompleta: any) => {
    setIdeiaCompletaParaCalendario(ideiaCompleta);
    setIdeiaParaCalendario(ideiaCompleta.titulo);
    setCalendarioAberto(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <header className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Engajaí
            </h1>
            <p className="text-white/60 text-sm mt-1">
              Tendências reais • IA real • Resultados profissionais
            </p>
          </div>
          {usuario && (
            <div className="text-right">
              <span className="text-sm text-white/70">Plano atual: </span>
              <span className="text-sm font-bold text-purple-400">
                {usuario.plano === 'pro' ? 'PRO' : 'FREE'}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/50">
          <span>{servicosTexto}</span>
        </div>

        {usuario && usuario.plano !== 'pro' && (
          <button
            onClick={handleAssinarPro}
            className="mt-3 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-lg hover:shadow-amber-500/30 transition"
          >
            {t('dash_subscribe')}
          </button>
        )}
        {!usuario && (
          <p className="mt-3 text-sm text-white/60">
            Faça login para gerar conteúdo ilimitado e acessar recursos exclusivos.
          </p>
        )}
      </header>

      <form onSubmit={aoEnviar} className="max-w-4xl mx-auto space-y-6">
        <div>
          <input
            type="text"
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            onFocus={() => setFocado(true)}
            onBlur={() => setFocado(false)}
            className={`w-full bg-white/5 border rounded-2xl px-5 py-4 text-white placeholder-white/20 outline-none transition ${
              focado ? 'border-purple-500/50 shadow-lg shadow-purple-500/10' : 'border-white/10'
            }`}
            placeholder="Qual o tema do seu vídeo? Ex: receita de bolo"
            maxLength={200}
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {sugestoesTemas.map((sugestao) => (
              <button
                key={sugestao.valor}
                type="button"
                onClick={() => setTema(sugestao.valor)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition"
              >
                {sugestao.emoji} {sugestao.rotulo}
              </button>
            ))}
          </div>
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
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                  selecionada
                    ? 'border-purple-400 bg-purple-500/10 shadow-lg shadow-purple-500/20'
                    : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                }`}
              >
                {React.createElement(info.icone, { className: 'w-6 h-6 mb-1' })}
                <span className="font-semibold text-sm">{info.nome}</span>
                <span className="text-xs opacity-60">{info.descricao}</span>
              </button>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={carregando}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {carregando ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('dash_generating')}
            </>
          ) : (
            <>
              {t('dash_generate')}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        {erroLimite && (
          <div className="text-red-400 text-sm text-center">{erroLimite}</div>
        )}
        {!backendOk && (
          <div className="text-amber-400 text-sm text-center">
            {t('dash_limit_warning')}
          </div>
        )}
      </form>

      {conteudoGerado && (
        <section className="max-w-4xl mx-auto mt-12 space-y-6">
          <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">
            {t('dash_viral_title')}
          </h2>

          <button
            onClick={() => abrirCalendario(conteudoGerado)}
            className="px-4 py-2 rounded-xl bg-purple-500/20 text-purple-400 text-sm font-bold hover:bg-purple-500/30 transition flex items-center gap-2"
          >
            📅 Adicionar ao Calendário
          </button>

          {[
            { label: t('dash_field_title'), key: 'titulo' },
            { label: t('dash_field_description'), key: 'descricao' },
            { label: t('dash_field_hashtags'), key: 'hashtags' },
            { label: t('dash_field_script'), key: 'roteiro' },
            { label: t('dash_field_editing'), key: 'ideiaEdicao' },
          ].map(({ label, key }) => (
            <div key={key} className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex justify-between items-start">
                <span className="text-sm text-white/40">{label}</span>
                <button
                  onClick={() => copiarTexto(conteudoGerado[key], key)}
                  className="text-white/30 hover:text-white transition"
                >
                  {copiado === key ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="mt-2 text-white/90 whitespace-pre-wrap">{conteudoGerado[key]}</p>
            </div>
          ))}

          {!sequenciaIdeias && (
            <div className="mt-6">
              {usuario?.plano === 'pro' ? (
                <button
                  onClick={gerarSequencia}
                  disabled={carregandoSequencia}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-lg hover:shadow-amber-500/30 transition disabled:opacity-50"
                >
                  {carregandoSequencia ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    <>
                      {t('dash_infinite')}
                      <span className="block text-xs font-normal opacity-80">{t('dash_infinite_desc')}</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                  <span className="text-white/50">{t('dash_infinite')} </span>
                  <span className="text-purple-400 font-bold">{t('dash_plan_pro')}</span>
                  <span className="block text-xs text-white/30 mt-1">{t('dash_infinite_locked')}</span>
                </div>
              )}
            </div>
          )}

          {sequenciaIdeias && (
            <div className="mt-8 space-y-4">
              <h3 className="text-xl font-bold text-white">{t('dash_next_videos')}</h3>
              {sequenciaIdeias.map((ideia: any, idx: number) => (
                <div key={idx} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <span className="text-xs text-white/30">#{idx + 1}</span>
                      <h4 className="font-bold text-white">{ideia.titulo}</h4>
                      <span className="text-xs text-white/40">{ideia.temaCurto}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => abrirCalendario({
                          titulo: ideia.titulo,
                          descricao: '',
                          hashtags: '',
                          roteiro: '',
                          ideiaEdicao: '',
                          plataforma: ''
                        })}
                        className="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-xs hover:bg-purple-500/30 transition"
                      >
                        📅
                      </button>
                      <button
                        onClick={() => expandirIdeia(idx, ideia.temaCurto)}
                        disabled={carregandoExtra && ideiaExpandida === idx}
                        className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-400 text-xs font-bold hover:bg-amber-500/30 transition disabled:opacity-50"
                      >
                        {carregandoExtra && ideiaExpandida === idx ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          t('dash_expand_button')
                        )}
                      </button>
                    </div>
                  </div>
                  {ideiaExpandida === idx && conteudoExtra && (
                    <div className="mt-4 space-y-3">
                      {[
                        { label: t('dash_field_title'), key: 'titulo' },
                        { label: t('dash_field_description'), key: 'descricao' },
                        { label: t('dash_field_hashtags'), key: 'hashtags' },
                        { label: t('dash_field_script'), key: 'roteiro' },
                        { label: t('dash_field_editing'), key: 'ideiaEdicao' },
                      ].map(({ label, key }) => (
                        <div key={key} className="bg-white/5 rounded-xl p-3 border border-white/5">
                          <span className="text-xs text-white/30">{label}</span>
                          <p className="text-sm text-white/80 mt-1">{conteudoExtra[key]}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <footer className="max-w-4xl mx-auto mt-12 pt-6 border-t border-white/10 flex justify-center gap-6 text-sm text-white/30">
        <a href="#" className="hover:text-white/60 transition">{t('dash_terms')}</a>
        <a href="#" className="hover:text-white/60 transition">{t('dash_privacy')}</a>
      </footer>

      <CalendarioModal
        isOpen={calendarioAberto}
        onClose={() => setCalendarioAberto(false)}
        onSave={(data, anotacao) => {
          const ideiasSalvas = JSON.parse(localStorage.getItem('engajai_calendario') || '[]');
          ideiasSalvas.push({
            id: Date.now().toString(),
            titulo: ideiaCompletaParaCalendario?.titulo || ideiaParaCalendario,
            descricao: ideiaCompletaParaCalendario?.descricao || '',
            hashtags: ideiaCompletaParaCalendario?.hashtags || '',
            roteiro: ideiaCompletaParaCalendario?.roteiro || '',
            ideiaEdicao: ideiaCompletaParaCalendario?.ideiaEdicao || '',
            plataforma: ideiaCompletaParaCalendario?.plataforma || '',
            data,
            anotacao
          });
          localStorage.setItem('engajai_calendario', JSON.stringify(ideiasSalvas));
        }}
        tituloIdeia={ideiaParaCalendario}
      />
    </div>
  );
}
