export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  businessInfo: BusinessInfo;
  createdAt: number;
}

export interface BusinessInfo {
  companyName: string;
  logo?: string; 
  phone: string;
  addressStreet: string;
  addressNumber: string;
  addressNeighborhood: string;
  addressCity: string;
  details: string;
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  THINKING = 'THINKING',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface GenerationState {
  status: GenerationStatus;
  currentImage: GeneratedImage | null;
  history: GeneratedImage[];
  error?: string;
  debugPrompt?: string;
}

export type UserRole = 'admin' | 'dev' | 'client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: number;
}

// Apenas configs que o frontend precisa saber (URLs públicas), NADA SECRETO
export interface AppSettings {
  supabaseUrl: string;
  supabaseKey: string; // Anon Key is fine
  // Fix: Add missing optional keys for external services
  perplexityKey?: string;
  freepikKey?: string;
}

// Fix: Add ArtStyle interface used by StyleCard
export interface ArtStyle {
  id: string;
  name: string;
  iconName: string;
  previewColor: string;
}