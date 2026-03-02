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
    ListSurveysResponse,
    SurveySection,
    SurveyQuestion,
    SurveyQuestionOption
} from '../../gen/survey/v1/survey_pb';
import { Timestamp } from '@bufbuild/protobuf';
import { scrubJson } from '../network/utils';

export class SurveyRepositoryImpl {
    private client = createGrpcClient(SurveyService);
    private baseUrl = 'https://creditanalyticsbackend-production.up.railway.app';

    async getSurvey(id: string): Promise<ApplicationSurvey> {
        try {
            const response = await this.client.getSurvey(new GetSurveyRequest({ id }));
            return response;
        } catch (error) {
            console.warn('[gRPC] Falling back to REST for GET Survey');
            const res = await fetch(`${this.baseUrl}/v1/surveys/${id}`);
            if (res.ok) {
                const data = await res.json();
                console.log('[DEBUG] REST GET Survey Success');
                return new ApplicationSurvey(scrubJson(data));
            }
            console.error(`[REST ERROR] GET Survey failed: ${res.status}`);
            throw error;
        }
    }

    async getSurveyTemplate(id: string): Promise<SurveyTemplate> {
        try {
            const response = await this.client.getSurveyTemplate(new GetSurveyTemplateRequest({ id }));
            return response;
        } catch (error) {
            console.warn('[gRPC] Falling back to REST for GET Survey Template');
            const res = await fetch(`${this.baseUrl}/v1/survey-templates/${id}`);
            if (res.ok) {
                const data = await res.json();
                return new SurveyTemplate(scrubJson(data));
            }
            throw error;
        }
    }

    async listSurveyTemplates(): Promise<SurveyTemplate[]> {
        try {
            const response = await this.client.listSurveyTemplates(new ListSurveyTemplatesRequest({}));
            return response.templates;
        } catch (error) {
            console.warn('[gRPC ERROR] Falling back to REST for LIST Templates');
            const res = await fetch(`${this.baseUrl}/v1/survey-templates`);
            if (res.ok) {
                const data = await res.json();
                return (data.templates || []).map((t: any) => new SurveyTemplate(scrubJson(t)));
            }
            throw error;
        }
    }

    async listSurveys(assignedTo?: string, status?: string): Promise<ApplicationSurvey[]> {
        try {
            console.log(`[gRPC] LIST Surveys: assignedTo=${assignedTo}${status ? `, status=${status}` : ''}`);
            const response = await this.client.listSurveys(new ListSurveysRequest({ assignedTo, status }));
            return response.surveys;
        } catch (error) {
            console.warn('[gRPC ERROR] Falling back to REST for LIST Surveys');

            let url = `${this.baseUrl}/v1/surveys?`;
            if (assignedTo) url += `assigned_to=${assignedTo}&`;
            if (status) url += `status=${status}`;

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                console.log('[DEBUG] REST LIST Surveys Success');
                return (data.surveys || []).map((s: any) => new ApplicationSurvey(scrubJson(s)));
            }
            console.error(`[REST ERROR] LIST Surveys failed: ${res.status}`);
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
                console.log('[DEBUG] REST LIST Surveys by App Success');
                return (data.surveys || []).map((s: any) => new ApplicationSurvey(scrubJson(s)));
            }
            throw error;
        }
    }

    async assignSurvey(applicationId: string, templateId: string, surveyType: string, assignedTo: string, surveyPurpose: string): Promise<ApplicationSurvey> {
        try {
            // First try gRPC
            try {
                return await this.client.assignSurvey(new AssignSurveyRequest({
                    applicationId,
                    templateId,
                    surveyType,
                    assignedTo,
                    surveyPurpose
                }));
            } catch (grpcErr: any) {
                console.warn('[gRPC ERROR] Assign Survey failed, trying REST:', grpcErr.message || grpcErr);
                throw grpcErr; // Re-throw to hit the main catch block
            }
        } catch (error) {
            const res = await fetch(`${this.baseUrl}/v1/applications/${applicationId}/surveys`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    template_id: templateId,
                    survey_type: surveyType,
                    assigned_to: assignedTo,
                    survey_purpose: surveyPurpose
                })
            });
            if (res.ok) {
                const data = await res.json();
                console.log('[DEBUG] REST ASSIGN Survey raw JSON:', JSON.stringify(data));
                const scrubbed = scrubJson(data);
                const mapped = new ApplicationSurvey(scrubbed);
                console.log('[DEBUG] Mapped ApplicationSurvey ID:', mapped.id);
                return mapped;
            }
            const errorText = await res.text();
            console.error(`[REST ERROR] ASSIGN Survey failed: ${res.status} ${errorText}`);
            throw error;
        }
    }

    async startSurvey(id: string, userId: string): Promise<ApplicationSurvey> {
        try {
            const response = await this.client.startSurvey(new StartSurveyRequest({ id, userId }));
            return response;
        } catch (error) {
            console.warn('[gRPC ERROR] Falling back to REST for START Survey');
            const res = await fetch(`${this.baseUrl}/v1/surveys/${id}/start`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId })
            });
            if (res.ok) {
                const data = await res.json();
                console.log('[DEBUG] REST START Survey Success');
                return new ApplicationSurvey(scrubJson(data));
            }
            throw error;
        }
    }

    async submitSurvey(id: string, userId: string): Promise<ApplicationSurvey> {
        try {
            const response = await this.client.submitSurvey(new SubmitSurveyRequest({ id, userId }));
            return response;
        } catch (error) {
            console.warn('[gRPC ERROR] Falling back to REST for SUBMIT Survey');
            const res = await fetch(`${this.baseUrl}/v1/surveys/${id}/submit`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId })
            });
            if (res.ok) {
                const data = await res.json();
                console.log('[DEBUG] REST SUBMIT Survey Success');
                return new ApplicationSurvey(scrubJson(data));
            }
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
            console.warn('[gRPC ERROR] Falling back to REST for SUBMIT Answer');
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

    async verifySurvey(id: string, userId: string): Promise<ApplicationSurvey> {
        return await this.client.verifySurvey(new VerifySurveyRequest({ id, userId }));
    }
}
