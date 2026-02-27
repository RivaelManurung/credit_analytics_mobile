import { useState, useEffect, useCallback } from 'react';
import { SurveyRepositoryImpl } from '../../data/repositories/SurveyRepositoryImpl';
import { ApplicationSurvey } from '../../gen/survey/v1/survey_pb';

const surveyRepo = new SurveyRepositoryImpl();

export function useMySurveys(assignedTo?: string, status?: string) {
    const [surveys, setSurveys] = useState<ApplicationSurvey[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchSurveys = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await surveyRepo.listSurveys(assignedTo, status);
            setSurveys(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch surveys'));
        } finally {
            setLoading(false);
        }
    }, [assignedTo, status]);

    useEffect(() => {
        fetchSurveys();
    }, [fetchSurveys]);

    return { surveys, loading, error, refetch: fetchSurveys };
}

export function useSurveysByApplication(applicationId: string) {
    const [surveys, setSurveys] = useState<ApplicationSurvey[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchSurveys = useCallback(async (appId: string) => {
        try {
            setLoading(true);
            setError(null);
            const data = await surveyRepo.listSurveysByApplication(appId);
            setSurveys(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch surveys'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (applicationId) {
            fetchSurveys(applicationId);
        }
    }, [applicationId, fetchSurveys]);

    return { surveys, loading, error, refetch: () => fetchSurveys(applicationId) };
}

export function useSurveyControl() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const startSurvey = async (id: string, userId: string): Promise<ApplicationSurvey | null> => {
        try {
            setLoading(true);
            setError(null);
            const survey = await surveyRepo.startSurvey(id, userId);
            return survey;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to start survey'));
            return null;
        } finally {
            setLoading(false);
        }
    }, submitSurvey = async (id: string, userId: string): Promise<ApplicationSurvey | null> => {
        try {
            setLoading(true);
            setError(null);
            const survey = await surveyRepo.submitSurvey(id, userId);
            return survey;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to submit survey'));
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { startSurvey, submitSurvey, loading, error };
}
export function useSurvey(id: string) {
    const [survey, setSurvey] = useState<ApplicationSurvey | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchSurvey = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await surveyRepo.getSurvey(id);
            setSurvey(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch survey'));
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) fetchSurvey();
    }, [id, fetchSurvey]);

    return { survey, loading, error, refetch: fetchSurvey };
}
