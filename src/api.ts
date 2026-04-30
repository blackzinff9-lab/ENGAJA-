import { GeneratedContent, Platform, User } from './types';



// URL base da API do backend
const API_BASE = (import.meta as any).env?.VITE_API_URL || '';

export interface StatusBackend {
  status: string;
  groq_configurado: boolean;
  youtube_configurado: boolean;
  trends_mcp_configurado: boolean;
  google_login_configurado: boolean;
}

/**
 * Verifica o status do backend
 */
export async function verificarStatus(): Promise<StatusBackend | null> {
  try {
    const resposta = await fetch(`${API_BASE}/api/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!resposta.ok) return null;
    return await resposta.json();
  } catch {
    return null;
  }
}

/**
 * Retorna a URL de login com Google
 */
export function urlLoginGoogle(): string {
  return `${API_BASE}/api/auth/google/login`;
}

/**
 * Gera conteúdo chamando o backend
 */
export async function gerarConteudo(
  tema: string,
  plataforma: Platform
): Promise<GeneratedContent> {
  const resposta = await fetch(`${API_BASE}/api/gerar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tema, plataforma }),
  });

  if (!resposta.ok) {
    const dadosErro = await resposta.json().catch(() => ({}));

    if (resposta.status === 429) {
      throw new Error(
        dadosErro.detail || 'Limite de requisições atingido. Aguarde um momento e tente novamente.'
      );
    }

    if (resposta.status === 500) {
      throw new Error(
        dadosErro.detail || 'Erro interno no servidor. Verifique se as API Keys estão configuradas.'
      );
    }

    throw new Error(
      dadosErro.detail || `Erro ao gerar conteúdo (código ${resposta.status}). Tente novamente.`
    );
  }

  const dados = await resposta.json();

  return {
    titulo: dados.titulo || 'Sem título gerado',
    descricao: dados.descricao || 'Sem descrição gerada',
    hashtags: dados.hashtags || [],
    roteiro: dados.roteiro || 'Sem roteiro gerado',
    ideiasEdicao: dados.ideiasEdicao || [],
    tendencias: dados.tendencias || [],
    plataforma: dados.plataforma || plataforma,
    tema: dados.tema || tema,
    fonteTendencias: dados.fonteTendencias || 'groq_fallback',
  };
}

/**
 * Salva dados do usuário no localStorage
 */
export function salvarUsuario(usuario: User, token: string): void {
  localStorage.setItem('contentforge_user', JSON.stringify(usuario));
  localStorage.setItem('contentforge_token', token);
}

/**
 * Carrega dados do usuário do localStorage
 */
export function carregarUsuario(): { usuario: User; token: string } | null {
  try {
    const userStr = localStorage.getItem('contentforge_user');
    const token = localStorage.getItem('contentforge_token');
    if (userStr && token) {
      return { usuario: JSON.parse(userStr), token };
    }
  } catch {
    // ignorar
  }
  return null;
}

/**
 * Remove dados do usuário (logout)
 */
export function limparUsuario(): void {
  localStorage.removeItem('contentforge_user');
  localStorage.removeItem('contentforge_token');
}
