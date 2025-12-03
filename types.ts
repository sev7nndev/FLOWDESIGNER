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

export type UserRole = 'admin' | 'dev' | 'client' | 'free' | 'pro' | 'starter'; // Added 'starter'

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

// NEW: Plan Settings Type
export interface PlanSetting {
  id: UserRole; // 'free', 'starter', 'pro'
  price: number;
  max_images_per_month: number;
}

// NEW: User Usage Type
export interface UserUsage {
  user_id: string;
  plan_id: UserRole;
  cycle_start_date: string;
  current_usage: number;
}

// NEW: Quota Status
export enum QuotaStatus {
  ALLOWED = 'ALLOWED',
  NEAR_LIMIT = 'NEAR_LIMIT',
  BLOCKED = 'BLOCKED',
}

// NEW: Quota Check Response
export interface QuotaCheckResponse {
  status: QuotaStatus;
  usage: UserUsage;
  plan: PlanSetting;
  message?: string;
}