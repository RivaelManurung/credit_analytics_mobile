/**
 * Survey Status Configuration
 * Single source of truth for all status labels, colors, and visual properties.
 * Used across Dashboard, ApplicationDetail, and any future screen.
 */
export interface StatusStyle {
    label: string;
    color: string;
    bg: string;
    dot: string;
}

export const STATUS_CONFIG: Record<string, StatusStyle> = {
    // ── Status resmi dari backend ────────────────────────────────────────────
    // UNASSIGNED | ASSIGNED | IN_PROGRESS | SUBMITTED | VERIFIED
    IN_PROGRESS: { label: 'Sedang Berjalan', color: '#2563EB', bg: '#EFF6FF', dot: '#3B82F6' },
    ASSIGNED: { label: 'Ditugaskan', color: '#D97706', bg: '#FFFBEB', dot: '#F59E0B' },
    UNASSIGNED: { label: 'Belum Ditugaskan', color: '#6B7280', bg: '#F9FAFB', dot: '#9CA3AF' },
    SUBMITTED: { label: 'Dikirim', color: '#059669', bg: '#ECFDF5', dot: '#059669' },
    VERIFIED: { label: 'Terverifikasi', color: '#0D9488', bg: '#F0FDFA', dot: '#0D9488' },
    PENDING: { label: 'Menunggu', color: '#6B7280', bg: '#F9FAFB', dot: '#9CA3AF' },
    REJECTED: { label: 'Ditolak', color: '#E11D48', bg: '#FFF1F2', dot: '#E11D48' },
};

export function getStatusConfig(statusKey: string): StatusStyle {
    // Default ke ASSIGNED jika status tidak dikenali — karena semua nasabah
    // di dashboard sudah pasti ditugaskan dari backend.
    return STATUS_CONFIG[statusKey] || STATUS_CONFIG.ASSIGNED;
}

/**
 * Application-wide constants
 */
export const APP_CONFIG = {
    DEFAULT_TEMPLATE_ID: '0195d1d2-0001-7000-bb34-000000000001',
    DEFAULT_PAGE_SIZE: 10,
} as const;
