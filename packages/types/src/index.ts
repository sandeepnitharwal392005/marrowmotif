// ─── Enums ──────────────────────────────────────────────────────────────────

export enum UserRole {
  GUIDE = 'GUIDE',
  SELLER = 'SELLER',
  ADMIN = 'ADMIN',
}

export enum ClientStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  FAILED = 'FAILED',
}

export enum WhatsAppMessageStatus {
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  createdAt: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// ─── Client ──────────────────────────────────────────────────────────────────

export interface CreateClientRequest {
  name: string;
  whatsappNumber: string;
  email?: string;
  bookingRef?: string;
}

export interface ClientResponse {
  id: string;
  guideId: string;
  name: string;
  whatsappNumber: string;
  email?: string | null;
  bookingRef?: string | null;
  driveLink?: string | null;
  status: ClientStatus;
  createdAt: string;
  updatedAt: string;
  whatsappMessages?: WhatsAppMessageResponse[];
}

export interface WhatsAppMessageResponse {
  id: string;
  clientId: string;
  status: WhatsAppMessageStatus;
  providerMessageId?: string | null;
  errorMessage?: string | null;
  attempts: number;
  sentAt?: string | null;
  createdAt: string;
}

// ─── Product ─────────────────────────────────────────────────────────────────

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
}

export interface ProductResponse {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: string;
  currency: string;
  images: string[];
  itinerary: ItineraryDay[];
  highlights: string[];
  duration?: string | null;
  maxGuests?: number | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateProductRequest {
  title: string;
  description: string;
  price: number;
  currency?: string;
  images?: string[];
  itinerary: ItineraryDay[];
  highlights?: string[];
  duration?: string;
  maxGuests?: number;
}

// ─── Contact ─────────────────────────────────────────────────────────────────

export interface CreateContactRequest {
  name: string;
  email: string;
  message: string;
}

export interface ContactResponse {
  id: string;
  name: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Queue ───────────────────────────────────────────────────────────────────

export interface ClientAutomationJobData {
  clientId: string;
}

export const QUEUE_NAMES = {
  CLIENT_AUTOMATION: 'client-automation',
} as const;

export const JOB_NAMES = {
  SEND_WELCOME_MESSAGE: 'send-welcome-message',
} as const;

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalClients: number;
  activeClients: number;
  pendingClients: number;
  failedClients: number;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface DriveFolderResult {
  success: boolean;
  folderId?: string;
  shareLink?: string;
  error?: string;
}
