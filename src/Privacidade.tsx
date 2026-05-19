import React from 'react';

export default function Privacidade() {
  return (
    <div className="min-h-screen bg-gray-950 text-white py-20 px-4">
      <div className="max-w-3xl mx-auto space-y-6 text-gray-300 text-sm leading-relaxed">
        <h1 className="text-3xl font-bold text-white mb-6">Política de Privacidade — ENGAJAÍ</h1>
        
        <h2 className="text-lg font-semibold text-white mt-6">1. Introdução</h2>
        <p>Esta Política descreve como coletamos, usamos e protegemos seus dados pessoais ao utilizar o ENGAJAÍ, em conformidade com a Lei Geral de Proteção de Dados (LGPD).</p>
        
        <h2 className="text-lg font-semibold text-white mt-6">2. Dados que Coletamos</h2>
        <p><strong>2.1. Informações de Login (Google OAuth):</strong> Coletamos nome, e-mail e foto de perfil quando você se autentica com sua conta Google.</p>
        <p><strong>2.2. Dados de Uso e Conteúdo:</strong> Coletamos os temas e textos que você submete e o conteúdo gerado pela IA. Armazenamos histórico de uso para aplicarmos limites de plano.</p>
        <p><strong>2.3. Dados de Pagamento:</strong> O processamento de pagamentos é feito exclusivamente pelo Mercado Pago. Não temos acesso aos dados completos do seu cartão.</p>
        <p><strong>2.4. Dados de Navegação:</strong> Coletamos endereço IP, tipo de navegador e logs de acesso para segurança e melhoria do serviço.</p>
        
        <h2 className="text-lg font-semibold text-white mt-6">3. Finalidades do Tratamento</h2>
        <p>Utilizamos seus dados para: (i) criar e gerenciar sua conta; (ii) fornecer e aprimorar o ENGAJAÍ; (iii) processar pagamentos da assinatura Pro; (iv) garantir a segurança e prevenir fraudes; (v) cumprir obrigações legais.</p>
        
        <h2 className="text-lg font-semibold text-white mt-6">4. Dados para Treinamento de IA</h2>
        <p>O ENGAJAÍ <strong>não utiliza</strong> os textos que você insere nem os conteúdos gerados para treinar modelos de inteligência artificial. Suas ideias permanecem privadas.</p>
        
        <h2 className="text-lg font-semibold text-white mt-6">5. Compartilhamento de Dados</h2>
        <p>5.1. Compartilhamos dados com provedores essenciais ao funcionamento do ENGAJAÍ: Render (hospedagem), Supabase (banco de dados), Groq API (IA) e Mercado Pago (pagamentos).</p>
        <p>5.2. Seus dados poderão ser divulgados mediante ordem judicial ou obrigação legal.</p>
        
        <h2 className="text-lg font-semibold text-white mt-6">6. Transferência Internacional</h2>
        <p>Seus dados podem ser processados por servidores da Groq fora do Brasil. Tomamos medidas para garantir que essa transferência esteja em conformidade com a LGPD.</p>
        
        <h2 className="text-lg font-semibold text-white mt-6">7. Seus Direitos (LGPD)</h2>
        <p>Você pode solicitar: acesso aos dados, correção, exclusão, portabilidade, informação sobre compartilhamento e revogação de consentimento. Para isso, entre em contato pelo e-mail: <strong>contato@engajai.com</strong>.</p>
        
        <h2 className="text-lg font-semibold text-white mt-6">8. Segurança</h2>
        <p>Adotamos medidas técnicas como criptografia em trânsito (TLS) e controles de acesso restrito para proteger seus dados.</p>
        
        <h2 className="text-lg font-semibold text-white mt-6">9. Retenção de Dados</h2>
        <p>Manteremos seus dados apenas pelo tempo necessário para fornecer o serviço e cumprir obrigações legais. Caso você exclua sua conta, seus dados pessoais serão removidos em até 30 dias.</p>
        
        <h2 className="text-lg font-semibold text-white mt-6">10. Alterações nesta Política</h2>
        <p>Esta Política pode ser atualizada. Notificaremos você sobre alterações significativas pelo e-mail cadastrado.</p>
        
        <p className="text-white/40 text-xs mt-10">Última atualização: 18 de maio de 2025</p>
      </div>
    </div>
  );
}
