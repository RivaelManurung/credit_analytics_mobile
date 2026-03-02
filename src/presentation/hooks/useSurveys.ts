import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SurveyRepositoryImpl } from '../../data/repositories/SurveyRepositoryImpl';
import { ApplicationSurvey, SurveyTemplate, SurveySection } from '../../gen/survey/v1/survey_pb';

const surveyRepo = new SurveyRepositoryImpl();

// --- Query Keys ---
export const surveyKeys = {
    all: ['surveys'] as const,
    lists: () => [...surveyKeys.all, 'list'] as const,
    list: (assignedTo: string) => [...surveyKeys.lists(), { assignedTo }] as const,
    details: () => [...surveyKeys.all, 'detail'] as const,
    detail: (id: string) => [...surveyKeys.details(), id] as const,
    templates: () => ['templates'] as const,
    template: (id: string) => [...surveyKeys.templates(), id] as const,
    sections: (templateId: string) => ['sections', templateId] as const,
};

// --- Hooks ---

export function useSurveyTemplate(id: string) {
    return useQuery({
        queryKey: surveyKeys.template(id),
        queryFn: () => surveyRepo.getSurveyTemplate(id),
        enabled: !!id,
    });
}

export function useSurveyTemplates() {
    return useQuery({
        queryKey: surveyKeys.templates(),
        queryFn: () => surveyRepo.listSurveyTemplates(),
    });
}

export function useSurvey(id: string) {
    return useQuery({
        queryKey: surveyKeys.detail(id),
        queryFn: () => surveyRepo.getSurvey(id),
        enabled: !!id,
    });
}

export function useMySurveys(assignedTo: string) {
    return useQuery({
        queryKey: surveyKeys.list(assignedTo),
        queryFn: () => surveyRepo.listSurveys(assignedTo),
        enabled: !!assignedTo,
    });
}

export function useSurveySections(templateId: string) {
    return useQuery({
        queryKey: surveyKeys.sections(templateId),
        queryFn: () => surveyRepo.listSurveySections(templateId),
        enabled: !!templateId,
    });
}

export function useSurveyControl() {
    const queryClient = useQueryClient();

    const startMutation = useMutation({
        mutationFn: ({ id, userId }: { id: string; userId: string }) =>
            surveyRepo.startSurvey(id, userId),
        onSuccess: (data) => {
            if (data) queryClient.invalidateQueries({ queryKey: surveyKeys.all });
        }
    });

    const submitMutation = useMutation({
        mutationFn: ({ id, userId }: { id: string; userId: string }) =>
            surveyRepo.submitSurvey(id, userId),
        onSuccess: (data) => {
            if (data) queryClient.invalidateQueries({ queryKey: surveyKeys.all });
        }
    });

    const assignMutation = useMutation({
        mutationFn: (params: { applicationId: string, templateId: string, surveyType: string, assignedTo: string, surveyPurpose: string }) =>
            surveyRepo.assignSurvey(params.applicationId, params.templateId, params.surveyType, params.assignedTo, params.surveyPurpose),
        onSuccess: (data) => {
            if (data) queryClient.invalidateQueries({ queryKey: surveyKeys.all });
        }
    });

    const answerMutation = useMutation({
        mutationFn: (params: { surveyId: string, questionId: string, answer: any }) =>
            surveyRepo.submitSurveyAnswer(params.surveyId, params.questionId, params.answer),
    });

    return {
        startSurvey: (id: string, userId: string) => startMutation.mutateAsync({ id, userId }),
        submitSurvey: (id: string, userId: string) => submitMutation.mutateAsync({ id, userId }),
        assignSurvey: (applicationId: string, templateId: string, surveyType: string, assignedTo: string, surveyPurpose: string) =>
            assignMutation.mutateAsync({ applicationId, templateId, surveyType, assignedTo, surveyPurpose }),
        submitSurveyAnswer: (surveyId: string, questionId: string, answer: any) =>
            answerMutation.mutateAsync({ surveyId, questionId, answer }),
        loading: startMutation.isPending || submitMutation.isPending || assignMutation.isPending,
        error: startMutation.error || submitMutation.error || assignMutation.error
    };
}
