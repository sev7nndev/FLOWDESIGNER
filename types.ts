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

export type UserRole = 'admin' | 'dev' | 'client' | 'free' | 'pro';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: number;
  role: UserRole;
}

// Apenas configs que o frontend precisa saber (URLs públicas)
export interface AppSettings {
  supabaseUrl: string;
  supabaseKey: string; // Anon Key is fine
}

// Fix: Add ArtStyle interface used by StyleCard
export interface ArtStyle {
  id: string;
  name: string;
  iconName: string;
  previewColor: string;
}

// NEW: Landing Page Carousel Image Type
export interface LandingImage {
  id: string;
  url: string;
  sortOrder: number;
}