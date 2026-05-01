import React, { useState } from 'react';
import Dashboard from './Dashboard';

// Ícones básicos que não quebram
import { 
  Layout, 
  Zap, 
  Video, 
  Sparkles,
  Settings,
  User
} from 'lucide-react';

function App() {
  // Simulando um usuário logado para o Dashboard funcionar
  const [user] = useState({
    nome: "Usuário",
    avatar: "https://ui-avatars.com/api/?name=Usuario&background=6366f1&color=fff"
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      {/* Background Decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
      </div>

      {/* Navbar Simples */}
      <nav className="relative z-10 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <span className="font-bold text-xl tracking-tight">Viral<span className="text-indigo-500">AI</span></span>
          </div>
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <main className="relative z-10">
        <Dashboard user={user} />
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-slate-900 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© 2024 ViralAI - Criador de Conteúdo Inteligente</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
