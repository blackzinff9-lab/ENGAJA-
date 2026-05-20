import React, { useState } from 'react';
import { Shield, FileText, Lock, CheckCircle, ArrowRight } from 'lucide-react';

interface ConsentPageProps {
  onConsent: () => void;
}

export default function ConsentPage({ onConsent }: ConsentPageProps) {
  const [termosLidos, setTermosLidos] = useState(false);
  const [privacidadeLida, setPrivacidadeLida] = useState(false);

  const podeContinuar = termosLidos && privacidadeLida;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 mb-4 shadow-xl shadow-purple-500/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Acordo Legal</h1>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Antes de acessar o ENGAJAÍ, você precisa concordar com nossos documentos legais.
            Eles explicam como seus dados são tratados e as regras de uso da plataforma.
          </p>
        </div>

        {/* Cards dos documentos */}
        <div className="space-y-4 mb-8">
          {/* Termos de Serviço */}
          <div className="bg-gray-800/40 border border-gray-700 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">Termos de Serviço</h3>
                <p className="text-gray-400 text-xs mb-3">
                  Regras de uso do ENGAJAÍ, limitações de responsabilidade, cancelamento e reembolso.
                </p>
                <div className="flex items-center gap-3">
                  <a
                    href="/termos"
                    target="_blank"
                    className="text-xs text-purple-400 hover:text-purple-300 underline transition"
                  >
                    Ler documento completo
                  </a>
                  <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termosLidos}
                      onChange={(e) => setTermosLidos(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                    />
                    Li e concordo com os Termos de Serviço
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Política de Privacidade */}
          <div className="bg-gray-800/40 border border-gray-700 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <Lock className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">Política de Privacidade</h3>
                <p className="text-gray-400 text-xs mb-3">
                  Como seus dados pessoais são coletados, tratados e protegidos, em conformidade com a LGPD.
                </p>
                <div className="flex items-center gap-3">
                  <a
                    href="/privacidade"
                    target="_blank"
                    className="text-xs text-purple-400 hover:text-purple-300 underline transition"
                  >
                    Ler documento completo
                  </a>
                  <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={privacidadeLida}
                      onChange={(e) => setPrivacidadeLida(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                    />
                    Li e concordo com a Política de Privacidade
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botão de continuar */}
        <button
          onClick={onConsent}
          disabled={!podeContinuar}
          className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
            podeContinuar
              ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20 hover:scale-[1.02]'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          <CheckCircle className="w-5 h-5" />
          Concordar e Acessar o ENGAJAÍ
          <ArrowRight className="w-5 h-5" />
        </button>

        <p className="text-center text-gray-500 text-xs mt-4">
          Você pode revogar este consentimento a qualquer momento entrando em contato conosco.
        </p>
      </div>
    </div>
  );
      }
