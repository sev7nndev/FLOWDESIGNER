export interface BusinessInfo {
    companyName: string;
    details: string;
    logo?: string;
    addressStreet: string;
    addressNumber: string;
    addressNeighborhood: string;
    addressCity: string;
    phone: string;
}

export enum GenerationStatus {
    IDLE = 'idle',
    THINKING = 'thinking',
    GENERATING = 'generating',
    DONE = 'done',
    ERROR = 'error',
}

export interface Image {
    id: string;
    created_at: string;
    user_id: string;
    prompt: string;
    image_url: string;
    business_info: BusinessInfo;
}