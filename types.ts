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

// FIX: Added 'starter' to UserRole for correct comparison (Errors 15, 36)
export type UserRole = 'admin' | 'dev' | 'client' | 'free' | 'pro' | 'owner' | 'starter'; 

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: number;
  role: UserRole;
}

export interface AppSettings {
  supabaseUrl: string;
  supabaseKey: string; 
}

export interface ArtStyle {
  id: string;
  name: string;
  iconName: string;
  previewColor: string;
}

// FIX: Added missing property for DevPanelPage (Errors 22, 39)
export interface LandingImage {
  id: string;
  url: string;
  sortOrder: number;
  image_path: string; 
}

// FIX: Exported types for GenerationForm (Errors 16, 17, 18, 19, 20)
export interface FormState {
  prompt: string;
  companyName: string;
  logoFile: File | null; 
}

export interface UsageData { 
    current_usage: number;
    max_usage: number;
    plan_id: UserRole;
    isBlocked: boolean;
}

export interface GenerationFormProps { 
    form: FormState & BusinessInfo; 
    status: GenerationStatus;
    error: string | undefined;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleGenerate: () => void;
    loadExample: () => void;
    usage: UsageData;
    isLoadingUsage: boolean;
}

export type HistoryItem = GeneratedImage;