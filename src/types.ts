export type Platform = 'tiktok' | 'instagram' | 'youtube';

export interface GeneratedContent {
  titulo: string;
  descricao: string;
  hashtags: string[];
  roteiro: string;
  ideiasEdicao: string[];
  tendencias: string[];
  plataforma: Platform;
  tema: string;
  fonteTendencias: string; // 'youtube_api' | 'trends_mcp' | 'groq_fallback'
}

export interface User {
  name: string;
  email: string;
  avatar: string;
}

export interface ApiKeys {
  groqApiKey: string;
  youtubeApiKey: string;
  trendsMcpApiKey: string;
}

export type AppState = 'login' | 'dashboard' | 'loading' | 'result';

export const GROQ_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

export const PLATFORM_CONFIG = {
  tiktok: {
    nome: 'TikTok',
    cor: '#FE2C55',
    gradiente: 'from-[#FE2C55] to-[#25F4EE]',
    icone: '🎵',
    bgClasse: 'bg-gradient-to-br from-[#FE2C55]/10 to-[#25F4EE]/10',
    bordaClasse: 'border-[#FE2C55]/30',
    textoClasse: 'text-[#FE2C55]',
    descricao: '15s - 10min',
  },
  instagram: {
    nome: 'Instagram',
    cor: '#E4405F',
    gradiente: 'from-[#833AB4] via-[#E4405F] to-[#FCAF45]',
    icone: '📸',
    bgClasse: 'bg-gradient-to-br from-[#833AB4]/10 via-[#E4405F]/10 to-[#FCAF45]/10',
    bordaClasse: 'border-[#E4405F]/30',
    textoClasse: 'text-[#E4405F]',
    descricao: 'Reels & Feed',
  },
  youtube: {
    nome: 'YouTube',
    cor: '#FF0000',
    gradiente: 'from-[#FF0000] to-[#CC0000]',
    icone: '▶️',
    bgClasse: 'bg-gradient-to-br from-[#FF0000]/10 to-[#CC0000]/10',
    bordaClasse: 'border-[#FF0000]/30',
    textoClasse: 'text-[#FF0000]',
    descricao: 'Shorts & Longo',
  },
} as const;
