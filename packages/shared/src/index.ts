// ============================================================
// @booking-resto/shared — Types TypeScript partagés
// Utilisé par le backend (NestJS) et le frontend (Nuxt)
// ============================================================

// ── Enums ────────────────────────────────────────────────────

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
}

export enum ImageSection {
  HERO = 'HERO',
  HOMESECTION = 'HOMESECTION',
  MENU = 'MENU',
  OTHER = 'OTHER',
}

// ── Booking ──────────────────────────────────────────────────

export interface BookingPublic {
  id: string;
  partySize: number;
  date: string;                       // ISO 8601
  serviceWindowId: string | null;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  notes: string | null;
  status: BookingStatus;
  cancelToken: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

// ── ServiceWindow ────────────────────────────────────────────

export interface ServiceWindowPublic {
  id: string;
  label: string;
  daysOfWeek: number[];               // ISO 1=lun..7=dim
  startTime: string;
  endTime: string;
  isActive: boolean;
  sortOrder: number;
}

// ── Slots (résultat /public/availability-slots) ──────────────

export interface AvailableSlot {
  time: string;                       // "HH:mm"
  serviceWindowId: string;
  serviceWindowLabel: string;
  date: string;                       // YYYY-MM-DD
}

// ── HomeSection / MenuDocument / ContactMessage ──────────────

export interface HomeSectionPublic {
  id: string;
  title: string;
  body: string;
  image: { id: string; mimeType: string; width: number | null; height: number | null } | null;
  sortOrder: number;
  isPublished: boolean;
}

export interface MenuDocumentPublic {
  id: string;
  title: string;
  description: string | null;
  file: { id: string; mimeType: string; size: number };
  sortOrder: number;
  isPublished: boolean;
}

export interface ContactMessagePublic {
  id: string;
  name: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// ── Pagination ───────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

// ── API Error ────────────────────────────────────────────────

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
  timestamp: string;
  path: string;
}
