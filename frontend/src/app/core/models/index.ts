export interface User {
  id: number;
  email: string;
  isCreator: boolean;
  isActive: boolean;
  role?: 'user' | 'creator';
  displayName?: string;
  bio?: string;
  subscriptionPrice?: number;
  profileImage?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  isCreator: boolean;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface Photo {
  id: number;
  url: string;
  description: string;
  creator: User;
  isPremium: boolean;
}

export interface Subscription {
  id: number;
  subscriber: User;
  creator: User;
  startDate: Date;
  endDate: Date;
}

export interface UploadPhotoRequest {
  description: string;
  isPremium: boolean;
}

export interface PhotoUpload extends UploadPhotoRequest {
  file: File;
}

export interface PaymentRequest {
  creatorId: number;
}

export interface PaymentResponse {
  sessionId: string;
}

export interface UserProfile {
  id: number;
  email: string;
  isCreator: boolean;
  isActive: boolean;
  createdAt: Date;
  photoCount?: number;
}

export interface Creator {
  id: number;
  email: string;
  photoCount: number;
  subscriptionPrice: number;
  isActive: boolean;
}

export interface SubscriptionDetails {
  id: number;
  subscriber: User;
  creator: User;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
}

export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
  subscriptionPrice?: number;
  profileImage?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
