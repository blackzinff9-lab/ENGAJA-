import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import { Platform } from './types';
import { StatusBackend } from './api';
import { 
  Zap, 
  Sparkles, 
  CheckCircle2,
  Menu, 
  X 
} from 'lucide-react';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [backendOk, setBackendOk] = useState(false);
  const [statusBackend, setStatusBackend] = useState<StatusBackend | null>(null);
  const [conteudoGerado, setConteudoGerado] = useState<any>(null); // estado para o conteúdo

  useEffect(() => {
    const verificarServicos = async () => {
      try {
        const resposta = await fetch('/api/status');
        const dados = await resposta.json();
        setStatusBackend(dados);
        setBackendOk(dados?.groq_configurado && dados?.youtube_configurado && dados?.trends_mcp_configurado);
      } catch {
        setBackendOk(false);
        setStatusBackend(null);
      }
    };
    verificarServicos();
  }, []);

  const aoGerar = async (tema: string, plataforma: Platform) => {
    setCarregando(true);
    setConteudoGerado(null); // limpa resultado anterior
    try {
      const resposta = await fetch('/api/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema, plataforma }),
      });
      const resultado = await resposta.json();
      setConteudoGerado(resultado); // armazena o resultado
    } catch (erro) {
      alert('Erro ao gerar conteúdo. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-indigo-500/30">
      {/* Fundo sutil com gradientes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Navbar fixa */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${
        scrolled ? 'bg-gray-900/80 backdrop-blur-lg border-gray-800 py-4' : 'bg-transparent border-transparent py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="w-6 h-6 text-white" fill="currentColor" />
            </div>
            <span className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Viral<span className="text-indigo-400">AI</span>
            </span>
          </div>

          {/* Links desktop */}
          <div className="hidden md:flex items-center gap-8">
            {['Funcionalidades', 'Como Funciona', 'Preços'].map((item) => (
              <a key={item} href={`#${item}`} className="text-sm text-gray-400 hover:text-white transition-colors">
                {item}
              </a>
            ))}
            <button className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all">
              Começar Agora
            </button>
          </div>

          <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <section className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold mb-8 tracking-wide uppercase">
              <Sparkles className="w-4 h-4" />
              <span>A Revolução da Criação de Conteúdo</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter leading-[0.9]">
              CRIE VÍDEOS <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                EXPLOSIVOS
              </span>
            </h1>
            <p className="text-gray-400 text-xl md:text-2xl max-w-3xl mx-auto mb-8">
              Nossa IA analisa as tendências de última hora para gerar roteiros que retêm a atenção e dominam o "For You".
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/40 border border-gray-700/50">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-gray-300">Roteiros Otimizados</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/40 border border-gray-700/50">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-gray-300">Hooks Virais</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/40 border border-gray-700/50">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-gray-300">Análise de Dados</span>
              </div>
            </div>
          </section>

          {/* Dashboard com formulário e resultado */}
          <Dashboard 
            aoGerar={aoGerar}
            carregando={carregando}
            backendOk={backendOk}
            statusBackend={statusBackend}
            conteudoGerado={conteudoGerado}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
