import { useState, useEffect } from 'react';
import { Loader2, Sparkles, TrendingUp, Film, Hash } from 'lucide-react';
import { Platform } from './types';
import { PLATFORM_CONFIG } from './types';


interface LoadingStateProps {
  tema: string;
  plataforma: Platform;
}

const etapasCarregamento = [
  { icone: TrendingUp, texto: 'Pesquisando tendências reais...' },
  { icone: Sparkles, texto: 'Analisando dados com IA Groq...' },
  { icone: Film, texto: 'Gerando roteiro completo...' },
  { icone: Hash, texto: 'Selecionando hashtags estratégicas...' },
  { icone: Sparkles, texto: 'Finalizando conteúdo com IA...' },
];

export default function EstadoCarregando({ tema, plataforma }: LoadingStateProps) {
  const [etapaAtual, setEtapaAtual] = useState(0);
  const pInfo = PLATFORM_CONFIG[plataforma];

  useEffect(() => {
    const intervalo = setInterval(() => {
      setEtapaAtual(prev => (prev + 1) % etapasCarregamento.length);
    }, 800);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 noise-bg relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[150px]"></div>

      <div className="relative z-10 text-center max-w-sm animate-fade-in">
        {/* Badge da plataforma */}
        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 ${pInfo.bgClasse} border ${pInfo.bordaClasse} mb-8`}>
          <span>{pInfo.icone}</span>
          <span className={`text-xs font-semibold ${pInfo.textoClasse}`}>{pInfo.nome}</span>
        </div>

        {/* Spinner principal */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-2 border-white/5"></div>
          <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-2 border-white/5 border-b-indigo-500/50 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        </div>

        {/* Tema */}
        <div className="mb-6">
          <span className="text-white/30 text-xs">Criando conteúdo sobre:</span>
          <p className="text-white/80 font-semibold mt-1">"{tema}"</p>
        </div>

        {/* Etapas de carregamento */}
        <div className="space-y-2">
          {etapasCarregamento.map((etapa, i) => {
            const IconeEtapa = etapa.icone;
            const ativa = i === etapaAtual;
            const passou = i < etapaAtual;
            return (
              <div
                key={i}
                className={`flex items-center gap-3 py-2 px-4 rounded-xl transition-all duration-500 ${
                  ativa ? 'glass text-white/80' : passou ? 'text-white/20' : 'text-white/10'
                }`}
              >
                <IconeEtapa className={`w-4 h-4 transition-all duration-500 ${
                  ativa ? 'text-purple-400 animate-bounce-subtle' : ''
                }`} />
                <span className="text-xs">{etapa.texto}</span>
                {ativa && (
                  <div className="ml-auto flex gap-0.5">
                    <div className="w-1 h-1 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1 h-1 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1 h-1 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-white/15 text-xs mt-6">
          Chamando API real do Groq • Modelo Llama 4 Scout 17B
        </p>
      </div>
    </div>
  );
}
