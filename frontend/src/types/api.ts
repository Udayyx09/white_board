export interface User {
  id: number;
  username: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  userId: number;
  username: string;
  email: string;
  name: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface DrawingSummary {
  id: string;
  title: string;
  thumbnail?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DrawingDetail {
  id: string;
  title: string;
  elementsJson: string;
  appStateJson?: string;
  thumbnail?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  ownerId?: number;
  ownerUsername?: string;
}
