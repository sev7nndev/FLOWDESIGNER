// --- AUTH & USER TYPES ---

// FIX: Added 'business' role (Error 5)
export type UserRole = 'free' | 'pro' | 'business' | 'admin' | 'dev' | 'owner'; 

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    createdAt: number;
    role: UserRole;
}

export interface UserProfile {
    id: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    credits: number;
    lastLogin: number;
}

// --- GENERATION TYPES ---

// FIX: Corrected enum values to match string literals used in components (Error 3, 15, 17, 20)
export enum GenerationStatus {
    IDLE = 'idle',
    LOADING = 'loading',
    SUCCESS = 'success',
    ERROR = 'error',
}

// FIX: Added missing properties to GeneratedImage (Error 18)
export interface GeneratedImage {
    id: string;
    url: string;
    prompt: string;
    negativePrompt: string;
    style: string;
    aspectRatio: string;
    createdAt: number;
    userId: string;
}

// FIX: Added missing 'businessInfo' property (Error 2, 14, 19, 23, 24)
export interface GenerationFormState {
    businessInfo: string; 
    logoFile: File | null;
}

export interface GenerationState {
    status: GenerationStatus;
    error: string | null;
    currentImage: GeneratedImage | null;
    history: GeneratedImage[];
}

// FIX: Added missing properties to UsageData (Error 4, 16, 21, 22, 25)
export interface UsageData { 
    totalGenerations: number;
    monthlyGenerations: number;
    maxMonthlyGenerations: number;
    credits: number;
    generationsThisMonth: number; // FIX: Added for Modals.tsx (Error 4)
}