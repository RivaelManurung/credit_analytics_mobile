import { createGrpcClient } from '../network/grpcClient';
import { SurveyService } from '../../gen/survey/v1/survey_connect';
import {
    GetSurveyRequest,
    GetSurveyTemplateRequest,
    ListSurveysRequest,
    ListSurveysByApplicationRequest,
    ListSurveyTemplatesRequest,
    AssignSurveyRequest,
    StartSurveyRequest,
    SubmitSurveyRequest,
    SubmitSurveyAnswerRequest,
    VerifySurveyRequest,
    ApplicationSurvey,
    SurveyTemplate,
    SurveySection
} from '../../gen/survey/v1/survey_pb';
import { API_URL } from '@env';
import { scrubJson } from '../network/utils';

export class SurveyRepositoryImpl {
    private client = createGrpcClient(SurveyService);
    private baseUrl = API_URL;

    async getSurvey(id: string): Promise<ApplicationSurvey> {
        try {
            return await this.client.getSurvey(new GetSurveyRequest({ id }));
        } catch (error) {
            const res = await fetch(`${this.baseUrl}/v1/surveys/${id}`);
            if (res.ok) return ApplicationSurvey.fromJson(await res.json(), { ignoreUnknownFields: true });
            throw error;
        }
    }

    async getSurveyTemplate(id: string): Promise<SurveyTemplate> {
        try {
            return await this.client.getSurveyTemplate(new GetSurveyTemplateRequest({ id }));
        } catch (error) {
            const res = await fetch(`${this.baseUrl}/v1/survey-templates/${id}`);
            if (res.ok) return SurveyTemplate.fromJson(await res.json(), { ignoreUnknownFields: true });
            throw error;
        }
    }

    async listSurveyTemplates(): Promise<SurveyTemplate[]> {
        try {
            const response = await this.client.listSurveyTemplates(new ListSurveyTemplatesRequest({}));
            return response.templates;
        } catch (error) {
            const res = await fetch(`${this.baseUrl}/v1/survey-templates`);
            if (res.ok) {
                const data = await res.json();
                return (data.templates || []).map((t: any) => SurveyTemplate.fromJson(t, { ignoreUnknownFields: true }));
            }
            throw error;
        }
    }

    async listSurveys(assignedTo?: string, status?: string): Promise<ApplicationSurvey[]> {
        try {
            const response = await this.client.listSurveys(new ListSurveysRequest({ assignedTo, status }));
            return response.surveys;
        } catch (error) {
            let url = `${this.baseUrl}/v1/surveys?`;
            if (assignedTo) url += `assigned_to=${assignedTo}&`;
            if (status) url += `status=${status}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                return (data.surveys || []).map((s: any) => ApplicationSurvey.fromJson(scrubJson(s), { ignoreUnknownFields: true }));
            }
            throw error;
        }
    }

    async listSurveysByApplication(applicationId: string): Promise<ApplicationSurvey[]> {
        try {
            const response = await this.client.listSurveysByApplication(new ListSurveysByApplicationRequest({ applicationId }));
            return response.surveys;
        } catch (error) {
            const res = await fetch(`${this.baseUrl}/v1/applications/${applicationId}/surveys`);
            if (res.ok) {
                const data = await res.json();
                return (data.surveys || []).map((s: any) => ApplicationSurvey.fromJson(scrubJson(s), { ignoreUnknownFields: true }));
            }
            throw error;
        }
    }

    async assignSurvey(applicationId: string, templateId: string, surveyType: string, assignedTo: string, surveyPurpose: string): Promise<ApplicationSurvey> {
        try {
            return await this.client.assignSurvey(new AssignSurveyRequest({ applicationId, templateId, surveyType, assignedTo, surveyPurpose }));
        } catch (error) {
            const res = await fetch(`${this.baseUrl}/v1/applications/${applicationId}/surveys`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ template_id: templateId, survey_type: surveyType, assigned_to: assignedTo, survey_purpose: surveyPurpose })
            });
            if (res.ok) return ApplicationSurvey.fromJson(scrubJson(await res.json()), { ignoreUnknownFields: true });
            throw error;
        }
    }

    async startSurvey(id: string, userId: string): Promise<ApplicationSurvey> {
        try {
            return await this.client.startSurvey(new StartSurveyRequest({ id, userId }));
        } catch (error) {
            const res = await fetch(`${this.baseUrl}/v1/surveys/${id}/start`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId })
            });
            if (res.ok) return ApplicationSurvey.fromJson(scrubJson(await res.json()), { ignoreUnknownFields: true });
            throw error;
        }
    }

    async submitSurvey(id: string, userId: string): Promise<ApplicationSurvey> {
        try {
            return await this.client.submitSurvey(new SubmitSurveyRequest({ id, userId }));
        } catch (error) {
            const res = await fetch(`${this.baseUrl}/v1/surveys/${id}/submit`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId })
            });
            if (res.ok) return ApplicationSurvey.fromJson(scrubJson(await res.json()), { ignoreUnknownFields: true });
            throw error;
        }
    }

    async submitSurveyAnswer(surveyId: string, questionId: string, answer: { text?: string, number?: string, boolean?: boolean, date?: string }): Promise<void> {
        try {
            await this.client.submitSurveyAnswer(new SubmitSurveyAnswerRequest({
                surveyId,
                questionId,
                answerText: answer.text,
                answerNumber: answer.number,
                answerBoolean: answer.boolean,
                answerDate: answer.date
            }));
        } catch (error) {
            const res = await fetch(`${this.baseUrl}/v1/surveys/${surveyId}/answers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question_id: questionId,
                    answer_text: answer.text,
                    answer_number: answer.number,
                    answer_boolean: answer.boolean,
                    answer_date: answer.date
                })
            });
            if (!res.ok) throw error;
        }
    }

    async listSurveySections(templateId: string): Promise<SurveySection[]> {
        try {
            const res = await fetch(`${this.baseUrl}/v1/survey-templates/${templateId}/sections`);
            if (res.ok) {
                const data = await res.json();
                return (data.sections || []).map((s: any) => new SurveySection(scrubJson(s)));
            }
            return [];
        } catch (error) {
            throw error;
        }
    }

    async verifySurvey(id: string, userId: string): Promise<ApplicationSurvey> {
        return await this.client.verifySurvey(new VerifySurveyRequest({ id, userId }));
    }
}
