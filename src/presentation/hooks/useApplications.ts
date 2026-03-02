import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApplicationRepositoryImpl } from '../../data/repositories/ApplicationRepositoryImpl';
import { Application } from '../../gen/application/v1/application_pb';

const repo = new ApplicationRepositoryImpl();

export const applicationKeys = {
    all: ['applications'] as const,
    lists: () => [...applicationKeys.all, 'list'] as const,
    details: () => [...applicationKeys.all, 'detail'] as const,
    detail: (id: string) => [...applicationKeys.details(), id] as const,
};

export function useApplications() {
    return useQuery({
        queryKey: applicationKeys.lists(),
        queryFn: () => repo.listApplications(),
        // Stale time set to 5 mins as apps don't change that often
        staleTime: 1000 * 60 * 5,
    });
}

export function useUpdateApplicationStatus() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (params: { id: string; newStatus: string; reason: string }) =>
            repo.changeApplicationStatus(params.id, params.newStatus, params.reason),
        onSuccess: () => {
            // Invalidate applications list to show updated status
            queryClient.invalidateQueries({ queryKey: applicationKeys.all });
        }
    });

    return {
        updateStatus: (id: string, newStatus: string, reason: string) =>
            mutation.mutateAsync({ id, newStatus, reason }),
        loading: mutation.isPending,
        error: mutation.error?.message || null,
    };
}
