export type TradeCategory = 'Schulmaterial' | 'Stifte' | 'Bücher' | 'Sportmaterialien' | 'Anderes';

export interface Post {
    id: string;
    title: string;
    description: string;
    category: string; // Unified to string to support both sets of categories
    images?: string[];
    mainImage?: string;
    ownerEmail?: string;
    ownerName?: string;
    author?: string; // From the other Post type
    wishes?: string; // From the other Post type
    createdAt: string | number;
    updatedAt?: number;
}

export type UserRole = 'admin' | 'user';

export interface User {
    id: string;
    email: string;
    passwordHash: string;
    role: UserRole;
}

export interface Stats {
    totalViews: number;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}
