import { useQuery } from '@tanstack/react-query';
import { applicantRepo } from '../../data/repositories';

// ── Query Keys ───────────────────────────────────────────────────────────────
export const applicantKeys = {
    all: ['applicants'] as const,
    detail: (id: string) => [...applicantKeys.all, 'detail', id] as const,
};

// ── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetches a single applicant by ID.
 * Used to get applicantType (personal/company) and other applicant-level data.
 * Cached for 10 minutes since applicant data rarely changes.
 */
export function useApplicant(applicantId: string) {
    return useQuery({
        queryKey: applicantKeys.detail(applicantId),
        queryFn: () => applicantRepo.getApplicant(applicantId),
        enabled: !!applicantId,
        staleTime: 1000 * 60 * 10,
    });
}
