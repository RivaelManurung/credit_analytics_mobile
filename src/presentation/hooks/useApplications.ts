import { useQuery, useMutation, useQueryClient, useInfiniteQuery, InfiniteData } from '@tanstack/react-query';
import { applicationRepo } from '../../data/repositories';
import { Application } from '../../gen/application/v1/application_pb';

// ── Query Keys ───────────────────────────────────────────────────────────────
export const applicationKeys = {
    all: ['applications'] as const,
    lists: () => [...applicationKeys.all, 'list'] as const,
    details: () => [...applicationKeys.all, 'detail'] as const,
    detail: (id: string) => [...applicationKeys.details(), id] as const,
};

// ── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetches a paginated list of applications with infinite scroll support.
 */
export function useApplications() {
    return useInfiniteQuery<
        { applications: Application[]; nextCursor: string },
        Error,
        InfiniteData<{ applications: Application[]; nextCursor: string }, string | undefined>,
        readonly ["applications", "list"],
        string | undefined
    >({
        queryKey: applicationKeys.lists(),
        queryFn: ({ pageParam }) => applicationRepo.listApplications(pageParam as string | undefined),
        initialPageParam: undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
        staleTime: 1000 * 60 * 5,
    });
}

/**
 * Fetches a single application by ID.
 * Uses the dedicated GetApplication endpoint (not list + filter).
 */
export function useApplicationDetail(id: string) {
    return useQuery({
        queryKey: applicationKeys.detail(id),
        queryFn: () => applicationRepo.getApplication(id),
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
    });
}

/**
 * Mutation to change an application's status.
 * Automatically invalidates the application cache on success.
 */
export function useUpdateApplicationStatus() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (params: { id: string; newStatus: string; reason: string }) =>
            applicationRepo.changeApplicationStatus(params.id, params.newStatus, params.reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: applicationKeys.all });
        },
    });

    return {
        updateStatus: (id: string, newStatus: string, reason: string) =>
            mutation.mutateAsync({ id, newStatus, reason }),
        loading: mutation.isPending,
        error: mutation.error?.message || null,
    };
}
