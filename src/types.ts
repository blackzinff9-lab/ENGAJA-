import { Smartphone, Play, Video } from 'lucide-react';

export type Platform = 'tiktok' | 'instagram' | 'youtube';

export interface GeneratedContent {
  titulo: string;
  descricao: string;
  hashtags: string;               // string única com # e espaços
  roteiro: string;
  ideiaEdicao: string;            // string descritiva, não array
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
    icone: Smartphone,            // componente Lucide
    descricao: 'Roteiros curtos',
    bgClasse: 'bg-pink-500/20',
    bordaClasse: 'border-pink-400',
  },
  instagram: {
    nome: 'Instagram',
    icone: Play,
    descricao: 'Reels e Stories',
    bgClasse: 'bg-purple-500/20',
    bordaClasse: 'border-purple-400',
  },
  youtube: {
    nome: 'YouTube',
    icone: Video,
    descricao: 'Conteúdo longo',
    bgClasse: 'bg-red-500/20',
    bordaClasse: 'border-red-400',
  },
} as const;
