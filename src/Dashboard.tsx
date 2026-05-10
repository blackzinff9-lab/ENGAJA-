import React, { useState } from 'react';
import { 
  Sparkles, ArrowRight, Loader2, Server, 
  TrendingUp, Target, Copy, CheckCircle, Crown, AlertCircle
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
    console.log('Enviando para assinatura:', { user_id: usuario?.sub, email: usuario?.email });
    
    if (!usuario || !usuario.email) {
      alert('Usuário não autenticado.');
      return;
    }
    if (!usuario.sub) {
      alert('ID do usuário (sub) não encontrado. Faça logout e login novamente.');
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
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-white/5 rounded-full px-4 py-1.5 mb-4 text-xs text-white/50">
          <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
          <span>Tendências reais • IA real • Resultados profissionais</span>
        </div>
        {usuario && (
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-xs px-3 py-1 rounded-full bg-white/5 text-white/60">
              Plano: {usuario.plano || 'free'}
            </span>
            {usuario.plano !== 'pro' && (
              <button
                onClick={handleAssinarPro}
                className="flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-400 font-bold hover:bg-yellow-400/30 transition"
              >
                <Crown className="w-3 h-3" />
                Assinar Pro (R$14,97/mês)
              </button>
            )}
          </div>
        )}

        {/* BLOCO DE DEBUG TEMPORÁRIO */}
        {usuario && (
          <div className="text-xs text-gray-400 mb-2 bg-gray-800/50 rounded p-2">
            <p>Debug - Dados do usuário:</p>
            <p>sub: {usuario.sub || '❌ NÃO ENCONTRADO'}</p>
            <p>email: {usuario.email || '❌ NÃO ENCONTRADO'}</p>
          </div>
        )}
        {/* FIM DO BLOCO DE DEBUG */}
      </div>

      <div className="mb-6 p-3 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-3 text-xs text-white/40">
          <Server className="w-3.5 h-3.5 text-purple-400/70" />
          <span>{servicosTexto}</span>
        </div>
      </div>

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

      {/* EXIBIÇÃO DO CONTEÚDO GERADO (mantido igual) */}
      {conteudoGerado && (
        // ... (todo o bloco de exibição de conteúdo permanece idêntico ao último enviado)
        // Para não repetir um código enorme, apenas mantenha o JSX completo existente.
      )}
    </div>
  );
      }
