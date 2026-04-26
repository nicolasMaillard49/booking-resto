// ============================================================
// @booking-pro/shared — Types TypeScript partagés
// Utilisé par le backend (NestJS) et le frontend (Nuxt)
// ============================================================

export * from './site';

// ── Enums ────────────────────────────────────────────────────

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
}

// ── Service ──────────────────────────────────────────────────

export interface ServicePublic {
  id: string;
  name: string;
  description: string | null;
  duration: number;       // minutes
  price: number;          // euros
  category: string | null;
  sortOrder: number;
}

// ── Booking ──────────────────────────────────────────────────

export interface BookingPublic {
  id: string;
  service: ServicePublic;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string;           // ISO 8601
  duration: number;
  status: BookingStatus;
  notes: string | null;
  paymentStatus: PaymentStatus;
  amount: number | null;
  cancelToken: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

// ── Availability ─────────────────────────────────────────────

export interface AvailabilitySlot {
  time: string;           // "09:00"
  available: boolean;
}

export interface DaySchedule {
  dayOfWeek: number;      // 0=lundi ... 6=dimanche
  startTime: string;      // "09:00"
  endTime: string;        // "19:00"
  isActive: boolean;
}

// ── Review ───────────────────────────────────────────────────

export interface ReviewPublic {
  id: string;
  author: string;
  rating: number;         // 1-5
  comment: string | null;
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
