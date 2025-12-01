// --- AUTH & USER TYPES ---

export type UserRole = 'free' | 'pro' | 'admin' | 'dev' | 'owner';

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

export enum GenerationStatus {
    IDLE = 'idle',
    GENERATING = 'generating',
    SUCCESS = 'success',
    ERROR = 'error',
}

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

export interface GenerationFormState {
    prompt: string;
    negativePrompt: string;
    style: string;
    aspectRatio: string;
    logoFile: File | null;
    logoUrl: string | null;
}

export interface GenerationState {
    status: GenerationStatus;
    error: string | null;
    currentImage: GeneratedImage | null;
    history: GeneratedImage[];
}

export interface UsageData {
    totalGenerations: number;
    monthlyGenerations: number;
    maxMonthlyGenerations: number;
    credits: number;
}