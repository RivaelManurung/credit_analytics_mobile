import { useQuery } from '@tanstack/react-query';
import { surveyRepo } from '../../data/repositories';
import { ApplicationSurvey, SurveySection, SurveyAnswer } from '../../gen/survey/v1/survey_pb';

export function useSurveyForm(surveyId: string, applicationId: string) {
    const surveysQuery = useQuery({
        queryKey: ['surveys', applicationId],
        queryFn: () => surveyRepo.listSurveysByApplication(applicationId),
        enabled: !!applicationId,
    });

    const survey = (surveysQuery.data || []).find((s: any) => s.id === surveyId);

    const templateId = survey?.templateId;

    const sectionsQuery = useQuery({
        queryKey: ['sections', templateId],
        queryFn: () => surveyRepo.listSurveySections(templateId!),
        enabled: !!templateId,
    });

    const answersQuery = useQuery({
        queryKey: ['answers', survey?.id],
        queryFn: () => surveyRepo.listSurveyAnswers(survey!.id).catch(() => []),
        enabled: !!survey?.id,
    });

    const isLoading = surveysQuery.isLoading || (!!templateId && sectionsQuery.isLoading) || (!!survey?.id && answersQuery.isLoading);
    const isError = surveysQuery.isError || sectionsQuery.isError;
    const error = surveysQuery.error || sectionsQuery.error;

    return {
        survey,
        sections: (sectionsQuery.data as any[]) || [],
        rawAnswers: (answersQuery.data as any[]) || [],
        isLoading,
        isError,
        error: error?.message || '',
        refetch: () => {
            surveysQuery.refetch();
            if (templateId) sectionsQuery.refetch();
            if (survey?.id) answersQuery.refetch();
        }
    };
}
