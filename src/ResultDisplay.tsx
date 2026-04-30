import { useState } from 'react';
import {
  ArrowLeft,
  Copy,
  Check,
  Download,
  Share2,
  Type,
  FileText,
  Hash,
  Film,
  Scissors,
  TrendingUp,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Star,
  Globe,
  Database,
  Bot,
} from 'lucide-react';
import { GeneratedContent } from './types';
import { PLATFORM_CONFIG } from './types';


interface ResultadoProps {
  conteudo: GeneratedContent;
  aoVoltar: () => void;
  aoRegenerar: () => void;
}

function BotaoCopiar({ texto, rotulo }: { texto: string; rotulo: string }) {
  const [copiado, setCopiado] = useState(false);

  const aoCopiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = texto;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <button
      onClick={aoCopiar}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg glass-light text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
      title={`Copiar ${rotulo}`}
    >
      {copiado ? (
        <>
          <Check className="w-3.5 h-3.5 text-green-400" />
          <span className="text-green-400">Copiado!</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          <span>Copiar</span>
        </>
      )}
    </button>
  );
}

function CartaoSecao({
  icone: Icone,
  titulo,
  classeCor,
  children,
  abertoPadrao = true,
  textoCopiar,
  rotuloCopiar,
}: {
  icone: React.ComponentType<{ className?: string }>;
  titulo: string;
  classeCor: string;
  children: React.ReactNode;
  abertoPadrao?: boolean;
  textoCopiar?: string;
  rotuloCopiar?: string;
}) {
  const [aberto, setAberto] = useState(abertoPadrao);

  return (
    <div className="glass rounded-2xl overflow-hidden animate-slide-up transition-all duration-300 hover:border-white/10">
      <button
        onClick={() => setAberto(!aberto)}
        className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${classeCor}`}>
            <Icone className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-white/90 text-sm sm:text-base">{titulo}</span>
        </div>
        <div className="flex items-center gap-2">
          {textoCopiar && rotuloCopiar && (
            <div onClick={(e) => e.stopPropagation()}>
              <BotaoCopiar texto={textoCopiar} rotulo={rotuloCopiar} />
            </div>
          )}
          {aberto ? (
            <ChevronUp className="w-4 h-4 text-white/30" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/30" />
          )}
        </div>
      </button>
      {aberto && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 animate-fade-in">
          <div className="border-t border-white/5 pt-4">{children}</div>
        </div>
      )}
    </div>
  );
}

function BadgeFonte({ fonte }: { fonte: string }) {
  const config: Record<string, { icone: React.ReactNode; texto: string; classe: string }> = {
    youtube_api: {
      icone: <Database className="w-3 h-3" />,
      texto: 'API do YouTube',
      classe: 'bg-red-500/10 text-red-300 border-red-500/20',
    },
    trends_mcp: {
      icone: <Globe className="w-3 h-3" />,
      texto: 'Trends MCP',
      classe: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    },
    groq_fallback: {
      icone: <Bot className="w-3 h-3" />,
      texto: 'Pesquisa IA (Groq)',
      classe: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
    },
  };

  const c = config[fonte] || config.groq_fallback;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${c.classe}`}>
      {c.icone}
      {c.texto}
    </span>
  );
}

export default function ExibirResultado({ conteudo, aoVoltar, aoRegenerar }: ResultadoProps) {
  const [toastVisivel, setToastVisivel] = useState(false);
  const pInfo = PLATFORM_CONFIG[conteudo.plataforma];

  const aoCompartilhar = async () => {
    const textoCompleto = `🎯 ${conteudo.titulo}\n\n${conteudo.descricao}\n\n${conteudo.hashtags.map(h => `#${h}`).join(' ')}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'ContentForge AI', text: textoCompleto });
      } else {
        await navigator.clipboard.writeText(textoCompleto);
        setToastVisivel(true);
        setTimeout(() => setToastVisivel(false), 3000);
      }
    } catch {
      // Usuário cancelou
    }
  };

  const aoExportar = () => {
    const textoExportacao = `═══════════════════════════════════
  CONTENTFORGE AI — CONTEÚDO GERADO
  Plataforma: ${pInfo.nome}
  Tema: ${conteudo.tema}
  Fonte das tendências: ${conteudo.fonteTendencias}
═══════════════════════════════════

📌 TÍTULO:
${conteudo.titulo}

📝 DESCRIÇÃO:
${conteudo.descricao}

🏷️ HASHTAGS:
${conteudo.hashtags.map(h => `#${h}`).join(' ')}

🎬 ROTEIRO:
${conteudo.roteiro}

✂️ IDEIAS DE EDIÇÃO:
${conteudo.ideiasEdicao.map((ideia, i) => `${i + 1}. ${ideia}`).join('\n')}

📈 TENDÊNCIAS IDENTIFICADAS:
${conteudo.tendencias.map((t, i) => `${i + 1}. ${t}`).join('\n')}

═══════════════════════════════════
  Gerado por ContentForge AI
  Powered by Groq • Llama 4 Scout 17B
  Conteúdo gerado com IA real
═══════════════════════════════════`;

    const blob = new Blob([textoExportacao], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contentforge-${conteudo.plataforma}-${conteudo.tema.replace(/\s+/g, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] noise-bg relative">
      {/* Acentos de fundo */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none"></div>

      {/* Toast de compartilhamento */}
      {toastVisivel && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 glass rounded-xl px-4 py-2.5 flex items-center gap-2 animate-slide-up shadow-2xl">
          <Check className="w-4 h-4 text-green-400" />
          <span className="text-sm text-white/80">Conteúdo copiado para a área de transferência!</span>
        </div>
      )}

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Barra superior */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 animate-slide-up">
          <button
            onClick={aoVoltar}
            className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao início</span>
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={aoRegenerar}
              className="flex items-center gap-2 text-sm glass-light rounded-xl px-4 py-2 text-white/50 hover:text-white/80 hover:bg-white/5 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Regenerar</span>
            </button>
            <button
              onClick={aoCompartilhar}
              className="flex items-center gap-2 text-sm glass-light rounded-xl px-4 py-2 text-white/50 hover:text-white/80 hover:bg-white/5 transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartilhar</span>
            </button>
            <button
              onClick={aoExportar}
              className="flex items-center gap-2 text-sm bg-gradient-to-r from-indigo-500/80 to-purple-500/80 rounded-xl px-4 py-2 text-white hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-purple-500/10"
            >
              <Download className="w-4 h-4" />
              <span>Exportar .txt</span>
            </button>
          </div>
        </div>

        {/* Badge da plataforma */}
        <div className="flex items-center gap-3 mb-6 animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 ${pInfo.bgClasse} border ${pInfo.bordaClasse}`}>
            <span className="text-lg">{pInfo.icone}</span>
            <span className={`font-bold text-sm ${pInfo.textoClasse}`}>{pInfo.nome}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/30">
            <Star className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" />
            <span>Tema: "<strong className="text-white/50">{conteudo.tema}</strong>"</span>
          </div>
          <BadgeFonte fonte={conteudo.fonteTendencias} />
        </div>

        {/* Seções de conteúdo */}
        <div className="space-y-4">
          {/* Título */}
          <div style={{ animationDelay: '0.1s' }}>
            <CartaoSecao
              icone={Type}
              titulo="Título Otimizado"
              classeCor="bg-gradient-to-br from-indigo-500 to-blue-600"
              textoCopiar={conteudo.titulo}
              rotuloCopiar="título"
            >
              <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">{conteudo.titulo}</h3>
            </CartaoSecao>
          </div>

          {/* Descrição */}
          <div style={{ animationDelay: '0.15s' }}>
            <CartaoSecao
              icone={FileText}
              titulo="Descrição Envolvente"
              classeCor="bg-gradient-to-br from-purple-500 to-pink-600"
              textoCopiar={conteudo.descricao}
              rotuloCopiar="descrição"
            >
              <p className="text-white/70 leading-relaxed whitespace-pre-line text-sm sm:text-base">{conteudo.descricao}</p>
            </CartaoSecao>
          </div>

          {/* Hashtags */}
          <div style={{ animationDelay: '0.2s' }}>
            <CartaoSecao
              icone={Hash}
              titulo="Hashtags Estratégicas"
              classeCor="bg-gradient-to-br from-emerald-500 to-teal-600"
              textoCopiar={conteudo.hashtags.map(h => `#${h}`).join(' ')}
              rotuloCopiar="hashtags"
            >
              <div className="flex flex-wrap gap-2">
                {conteudo.hashtags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm font-medium hover:bg-emerald-500/20 transition-colors cursor-default"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-white/25 mt-3">
                {conteudo.hashtags.length} hashtags selecionadas • Mix de hashtags populares + nicho
              </p>
            </CartaoSecao>
          </div>

          {/* Roteiro */}
          <div style={{ animationDelay: '0.25s' }}>
            <CartaoSecao
              icone={Film}
              titulo="Roteiro Completo"
              classeCor="bg-gradient-to-br from-amber-500 to-orange-600"
              textoCopiar={conteudo.roteiro}
              rotuloCopiar="roteiro"
              abertoPadrao={false}
            >
              <pre className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap font-sans">{conteudo.roteiro}</pre>
            </CartaoSecao>
          </div>

          {/* Ideias de edição */}
          <div style={{ animationDelay: '0.3s' }}>
            <CartaoSecao
              icone={Scissors}
              titulo="Ideias de Edição"
              classeCor="bg-gradient-to-br from-rose-500 to-red-600"
              textoCopiar={conteudo.ideiasEdicao.join('\n')}
              rotuloCopiar="ideias de edição"
            >
              <div className="grid gap-3">
                {conteudo.ideiasEdicao.map((ideia, i) => (
                  <div key={i} className="flex items-start gap-3 group">
                    <div className="w-6 h-6 rounded-full bg-rose-500/15 border border-rose-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-rose-500/25 transition-colors">
                      <span className="text-[10px] font-bold text-rose-300">{i + 1}</span>
                    </div>
                    <p className="text-white/65 text-sm leading-relaxed">{ideia}</p>
                  </div>
                ))}
              </div>
            </CartaoSecao>
          </div>

          {/* Tendências */}
          <div style={{ animationDelay: '0.35s' }}>
            <CartaoSecao
              icone={TrendingUp}
              titulo="Tendências Identificadas"
              classeCor="bg-gradient-to-br from-cyan-500 to-blue-600"
              textoCopiar={conteudo.tendencias.join('\n')}
              rotuloCopiar="tendências"
            >
              <div className="grid gap-2.5">
                {conteudo.tendencias.map((tendencia, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0 shadow-sm shadow-cyan-400/50"></div>
                    <p className="text-white/65 text-sm">{tendencia}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                <p className="text-[11px] text-cyan-300/60">
                  💡 Fonte dos dados: <BadgeFonte fonte={conteudo.fonteTendencias} /> — {' '}
                  {conteudo.fonteTendencias === 'youtube_api'
                    ? 'Dados reais da API do YouTube'
                    : conteudo.fonteTendencias === 'trends_mcp'
                    ? 'Dados reais do Trends MCP'
                    : 'Pesquisa realizada pela IA do Groq (fallback automático)'}
                </p>
              </div>
            </CartaoSecao>
          </div>
        </div>

        {/* CTA inferior */}
        <div className="mt-8 text-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="glass rounded-2xl p-6">
            <p className="text-white/40 text-sm mb-4">Quer tentar com outro tema ou plataforma?</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={aoVoltar}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass-light text-white/60 hover:text-white/90 hover:bg-white/5 transition-all text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Novo tema
              </button>
              <button
                onClick={aoRegenerar}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium hover:from-indigo-400 hover:to-purple-400 transition-all shadow-lg shadow-purple-500/20"
              >
                <RotateCcw className="w-4 h-4" />
                Regenerar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
