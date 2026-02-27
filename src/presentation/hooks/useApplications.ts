import { useState, useEffect, useCallback } from 'react';
import { ApplicationRepositoryImpl } from '../../data/repositories/ApplicationRepositoryImpl';
import { Application } from '../../gen/application/v1/application_pb';

// In a real app with DI, you might inject this. Here we instantiate it directly for simplicity.
const repo = new ApplicationRepositoryImpl();

export function useApplications() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchApplications = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await repo.listApplications();
            setApplications(data);
        } catch (err: any) {
            setError(err?.message || 'Warning: Failed to load applications.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    return {
        applications,
        loading,
        error,
        refetch: fetchApplications
    };
}

export function useUpdateApplicationStatus() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateStatus = async (id: string, newStatus: string, reason: string) => {
        setLoading(true);
        setError(null);
        try {
            const result = await repo.changeApplicationStatus(id, newStatus, reason);
            return result;
        } catch (err: any) {
            setError(err?.message || 'Failed to update application status.');
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { updateStatus, loading, error };
}
