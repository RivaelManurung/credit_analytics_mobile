import { createGrpcClient } from '../network/grpcClient';
import { SurveyService } from '../../gen/survey/v1/survey_connect';
import {
    GetSurveyRequest,
    ListSurveysRequest,
    ListSurveysByApplicationRequest,
    AssignSurveyRequest,
    StartSurveyRequest,
    SubmitSurveyRequest,
    VerifySurveyRequest,
    ApplicationSurvey,
    ListSurveysResponse
} from '../../gen/survey/v1/survey_pb';

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
                return new ApplicationSurvey(await res.json());
            }
            throw error;
        }
    }

    async listSurveys(assignedTo?: string, status?: string): Promise<ApplicationSurvey[]> {
        try {
            console.log(`[gRPC] LIST Surveys: assignedTo=${assignedTo}, status=${status}`);
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
                return (data.surveys || []).map((s: any) => new ApplicationSurvey(s));
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
                return (data.surveys || []).map((s: any) => new ApplicationSurvey(s));
            }
            throw error;
        }
    }

    async assignSurvey(applicationId: string, templateId: string, surveyType: string, assignedTo: string, surveyPurpose: string): Promise<ApplicationSurvey> {
        return await this.client.assignSurvey(new AssignSurveyRequest({
            applicationId,
            templateId,
            surveyType,
            assignedTo,
            surveyPurpose
        }));
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
            if (res.ok) return new ApplicationSurvey(await res.json());
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
            if (res.ok) return new ApplicationSurvey(await res.json());
            throw error;
        }
    }

    async verifySurvey(id: string, userId: string): Promise<ApplicationSurvey> {
        return await this.client.verifySurvey(new VerifySurveyRequest({ id, userId }));
    }
}
