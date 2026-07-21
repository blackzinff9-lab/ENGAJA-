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

  // Estados do calendário
  const [calendarioAberto, setCalendarioAberto] = useState(false);
  const [ideiaParaCalendario, setIdeiaParaCalendario] = useState('');
  const [ideiaCompletaParaCalendario, setIdeiaCompletaParaCalendario] = useState<any>(null);

  // Efeito para pré-preencher campos quando o usuário retorna do login
  useEffect(() => {
    if (temaInicial) {
      setTema(temaInicial);
    }
    if (plataformaInicial) {
      setPlataforma(plataformaInicial);
    }
    // Limpa os campos salvos no App após usá-los
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
      // Se não estiver logado, salva o tema e plataforma e redireciona para login
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
    <div>
      {/* Cabeçalho */}
      <header>
        <h1>{t('dash_trends')}</h1>
        {usuario && (
          <div>
            <span>{t('nav_plan')}: {usuario.plano === 'pro' ? t('dash_plan_pro') : t('dash_plan_free')}</span>
            {usuario.plano !== 'pro' && (
              <div>
                <h3>{t('dash_benefits_title')}</h3>
                <ul>
                  <li>{t('dash_benefit1')}</li>
                  <li>{t('dash_benefit2')}</li>
                  <li>{t('dash_benefit3')}</li>
                  <li>{t('dash_benefit4')}</li>
                </ul>
              </div>
            )}
          </div>
        )}
        {usuario && usuario.plano !== 'pro' && (
          <button onClick={handleAssinarPro}>{t('dash_subscribe')}</button>
        )}
        {!usuario && (
          <p>Faça login para gerar conteúdo ilimitado e acessar recursos exclusivos.</p>
        )}
      </header>

      {/* Status do Servidor */}
      <div>
        <span>{servicosTexto}</span>
      </div>

      {/* Formulário */}
      <form onSubmit={aoEnviar}>
        <input
          type="text"
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          onFocus={() => setFocado(true)}
          onBlur={() => setFocado(false)}
          className={`w-full bg-white/5 border rounded-2xl px-5 py-4 text-white placeholder-white/20 outline-none transition ${focado ? 'border-purple-500/50' : 'border-white/10'}`}
          placeholder={t('dash_topic_placeholder')}
          maxLength={200}
        />
        <div>
          {sugestoesTemas.map((sugestao) => (
            <button
              key={sugestao.valor}
              onClick={() => setTema(sugestao.valor)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition"
            >
              {sugestao.emoji}{sugestao.rotulo}
            </button>
          ))}
        </div>
        <div>
          {(Object.keys(PLATFORM_CONFIG) as Platform[]).map((chave) => {
            const info = PLATFORM_CONFIG[chave];
            const selecionada = plataforma === chave;
            return (
              <button
                key={chave}
                onClick={() => setPlataforma(chave)}
                className={`rounded-2xl p-4 text-center transition-all ${selecionada ? 'bg-purple-500/20 border-2 border-purple-400 shadow-lg shadow-purple-500/10 scale-[1.02]' : 'bg-white/5 border border-white/10 hover:border-white/20'}`}
              >
                {React.createElement(info.icone)}
                <span>{info.nome}</span>
                <span>{info.descricao}</span>
              </button>
            );
          })}
        </div>
        <button type="submit" disabled={carregando}>
          {carregando ? <>{t('dash_generating')}</> : <>{t('dash_generate')}</>}
        </button>
        {erroLimite && <div>{erroLimite}</div>}
        {!backendOk && <div>{t('dash_limit_warning')}</div>}
      </form>
            {/* EXIBIÇÃO DO CONTEÚDO GERADO */}
      {conteudoGerado && (
        <section>
          <h2>{t('dash_viral_title')}</h2>
          {/* Botão Adicionar ao Calendário */}
          <button onClick={() => abrirCalendario(conteudoGerado)} className="mt-4 px-4 py-2 rounded-xl bg-purple-500/20 text-purple-400 text-sm font-bold hover:bg-purple-500/30 transition">
            Adicionar ao Calendário
          </button>
          {/* Título */}
          <div>
            <span>{t('dash_field_title')}</span>
            <button onClick={() => copiarTexto(conteudoGerado.titulo, 'titulo')} className="text-white/30 hover:text-white transition">
              {copiado === 'titulo' ? <CheckCircle /> : <Copy />}
            </button>
            <p>{conteudoGerado.titulo}</p>
          </div>
          {/* Descrição */}
          <div>
            <span>{t('dash_field_description')}</span>
            <button onClick={() => copiarTexto(conteudoGerado.descricao, 'descricao')} className="text-white/30 hover:text-white transition">
              {copiado === 'descricao' ? <CheckCircle /> : <Copy />}
            </button>
            <p>{conteudoGerado.descricao}</p>
          </div>
          {/* Hashtags */}
          <div>
            <span>{t('dash_field_hashtags')}</span>
            <button onClick={() => copiarTexto(conteudoGerado.hashtags, 'hashtags')} className="text-white/30 hover:text-white transition">
              {copiado === 'hashtags' ? <CheckCircle /> : <Copy />}
            </button>
            <p>{conteudoGerado.hashtags}</p>
          </div>
          {/* Roteiro */}
          <div>
            <span>{t('dash_field_script')}</span>
            <button onClick={() => copiarTexto(conteudoGerado.roteiro, 'roteiro')} className="text-white/30 hover:text-white transition">
              {copiado === 'roteiro' ? <CheckCircle /> : <Copy />}
            </button>
            <p>{conteudoGerado.roteiro}</p>
          </div>
          {/* Ideia de Edição */}
          <div>
            <span>{t('dash_field_editing')}</span>
            <button onClick={() => copiarTexto(conteudoGerado.ideiaEdicao, 'ideiaEdicao')} className="text-white/30 hover:text-white transition">
              {copiado === 'ideiaEdicao' ? <CheckCircle /> : <Copy />}
            </button>
            <p>{conteudoGerado.ideiaEdicao}</p>
          </div>

          {/* BOTÃO CONTEÚDO INFINITO */}
          {!sequenciaIdeias && (
            <div>
              {usuario?.plano === 'pro' ? (
                <button onClick={gerarSequencia} disabled={carregandoSequencia}>
                  {carregandoSequencia ? <>{t('dash_infinite_generating')}</> : <>{t('dash_infinite')}</>}
                  <span>{t('dash_infinite_desc')}</span>
                </button>
              ) : (
                <div>
                  <span>{t('dash_infinite')} {t('dash_plan_pro')}</span>
                  <span>{t('dash_infinite_locked')}</span>
                </div>
              )}
            </div>
          )}

          {sequenciaIdeias && (
            <div>
              <h2>{t('dash_next_videos')}</h2>
              {sequenciaIdeias.map((ideia: any, idx: number) => (
                <div key={idx}>
                  <span>#{idx + 1}</span>
                  <h3>{ideia.titulo}</h3>
                  <span>{ideia.temaCurto}</span>
                  <button
                    onClick={() => abrirCalendario({ titulo: ideia.titulo, descricao: '', hashtags: '', roteiro: '', ideiaEdicao: '', plataforma: '' })}
                    className="flex-shrink-0 px-2 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-xs hover:bg-purple-500/30 transition"
                    title="Adicionar ao Calendário"
                  >
                    📅
                  </button>
                  <button
                    onClick={() => expandirIdeia(idx, ideia.temaCurto)}
                    disabled={carregandoExtra && ideiaExpandida === idx}
                    className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 text-xs font-bold hover:bg-amber-500/30 transition-all disabled:opacity-50"
                  >
                    {carregandoExtra && ideiaExpandida === idx ? <Loader2 className="animate-spin" /> : t('dash_expand_button')}
                  </button>
                  {ideiaExpandida === idx && conteudoExtra && (
                    <div>
                      <div>
                        <span>{t('dash_field_title')}</span>
                        <p>{conteudoExtra.titulo}</p>
                      </div>
                      <div>
                        <span>{t('dash_field_description')}</span>
                        <p>{conteudoExtra.descricao}</p>
                      </div>
                      <div>
                        <span>{t('dash_field_hashtags')}</span>
                        <p>{conteudoExtra.hashtags}</p>
                      </div>
                      <div>
                        <span>{t('dash_field_script')}</span>
                        <p>{conteudoExtra.roteiro}</p>
                      </div>
                      <div>
                        <span>{t('dash_field_editing')}</span>
                        <p>{conteudoExtra.ideiaEdicao}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Rodapé */}
      <footer>
        <a href="#">{t('dash_terms')}</a>
        <a href="#">{t('dash_privacy')}</a>
      </footer>

      {/* Modal do Calendário */}
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
