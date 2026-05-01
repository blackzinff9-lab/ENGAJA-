import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import { 
  Zap, 
  Sparkles, 
  BarChart3, 
  Globe, 
  Layout, 
  MessageSquare, 
  Smartphone, 
  Shield, 
  Rocket, 
  Menu, 
  X, 
  ChevronRight, 
  Play, 
  CheckCircle2, 
  ArrowRight,
  Star,
  Users,
  MousePointer2
} from 'lucide-react';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user] = useState({
    nome: "Criador Pro",
    avatar: "https://ui-avatars.com/api/?name=Criador+Pro&background=6366f1&color=fff"
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-50 font-sans selection:bg-indigo-500/30">
      {/* Background de Alta Performance */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[20%] right-[15%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${
        scrolled ? 'bg-slate-900/80 backdrop-blur-lg border-slate-800 py-4' : 'bg-transparent border-transparent py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-all duration-300">
              <Zap className="w-6 h-6 text-white" fill="currentColor" />
            </div>
            <span className="font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Viral<span className="text-indigo-500">AI</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {['Funcionalidades', 'Como Funciona', 'Preços'].map((item) => (
              <a key={item} href={`#${item}`} className="text-sm font-medium text-slate-400 hover:text-white transition-colors relative group">
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 transition-all group-hover:w-full" />
              </a>
            ))}
            <button className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95">
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
          <section className="text-center mb-24 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold mb-8 tracking-wide uppercase">
              <Sparkles className="w-4 h-4" />
              <span>A Revolução da Criação de Conteúdo</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter leading-[0.9] bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-500">
              CRIE VÍDEOS <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                EXPLOSIVOS
              </span>
            </h1>
            <p className="text-slate-400 text-xl md:text-2xl max-w-3xl mx-auto mb-12 leading-relaxed font-light">
              Nossa IA analisa as tendências de última hora para gerar roteiros que retêm a atenção e dominam o "For You".
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-20">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/40 border border-slate-700/50">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-slate-300">Roteiros Otimizados</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/40 border border-slate-700/50">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-slate-300">Hooks Virais</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/40 border border-slate-700/50">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-slate-300">Análise de Dados</span>
              </div>
            </div>
          </section>

          <Dashboard user={user} />
        </div>
      </main>

      <footer className="relative z-10 py-20 border-t border-slate-800/50 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-8 h-8 text-indigo-500" fill="currentColor" />
              <span className="font-bold text-2xl">ViralAI</span>
            </div>
            <p className="text-slate-400 max-w-sm mb-8">
              Capacitando criadores a alcançarem milhões de pessoas através de inteligência artificial aplicada ao entretenimento.
            </p>
          </div>
          {/* Links e outras seções do footer que você tinha... */}
        </div>
      </footer>
    </div>
  );
}

export default App;
          
