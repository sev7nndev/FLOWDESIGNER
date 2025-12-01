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

export type UserRole = 'admin' | 'dev' | 'client' | 'free' | 'pro' | 'owner' | 'starter'; // Added 'starter' for consistency

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
  image_path: string; // Added missing property for DevPanelPage
}

// NEW: Types for GenerationForm and useGeneration hook
export interface FormState {
  prompt: string;
  companyName: string;
  logoFile: File | null; // Temporary file object for display
  // All other BusinessInfo fields are handled by the hook internally
}

export interface UsageData {
    current_usage: number;
    max_usage: number;
    plan_id: UserRole;
    isBlocked: boolean;
}

export interface GenerationFormProps {
    form: FormState & BusinessInfo; // Combines form state and business info
    status: GenerationStatus;
    error: string | undefined;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleGenerate: () => void;
    loadExample: () => void;
    usage: UsageData;
    isLoadingUsage: boolean;
}

// Type for API history response
export type HistoryItem = GeneratedImage;