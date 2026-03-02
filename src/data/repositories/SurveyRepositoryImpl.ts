/**
 * SurveyRepositoryImpl — REST-only implementation.
 *
 * gRPC (Connect-Web) with Railway produces "missing response body" on every call.
 * Removing gRPC eliminates the 5-second timeout overhead that was causing the
 * "stuck loading" issue. REST calls now resolve in 1-3 seconds as expected.
 */
import { API_URL } from '@env';
import {
    ApplicationSurvey,
    SurveySection,
    SurveyTemplate,
} from '../../gen/survey/v1/survey_pb';
import { scrubJson } from '../network/utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function restFetch<T>(url: string, options?: RequestInit): Promise<T> {
    console.log(`[REST] ${options?.method || 'GET'} ${url}`);
    const res = await fetch(url, options);
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`[REST] ${url} → ${res.status}: ${body}`);
    }
    const data = await res.json();
    console.log(`[REST] OK ${url}`);
    return data as T;
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export class SurveyRepositoryImpl {
    private readonly baseUrl = API_URL;

    // ── Survey ────────────────────────────────────────────────────────────

    async getSurvey(id: string): Promise<ApplicationSurvey> {
        const data = await restFetch<any>(`${this.baseUrl}/v1/surveys/${id}`);
        // Backend may wrap response: { survey: {...} } or return directly
        const payload = data?.survey ?? data;
        console.log('[REST] getSurvey raw keys:', Object.keys(payload || {}));
        return ApplicationSurvey.fromJson(payload, { ignoreUnknownFields: true });
    }

    async listSurveys(assignedTo?: string, status?: string): Promise<ApplicationSurvey[]> {
        let url = `${this.baseUrl}/v1/surveys?`;
        if (assignedTo) url += `assigned_to=${assignedTo}&`;
        if (status) url += `status=${status}`;
        const data = await restFetch<any>(url);
        return (data.surveys || []).map(
            (s: any) => ApplicationSurvey.fromJson(scrubJson(s), { ignoreUnknownFields: true }),
        );
    }

    async listSurveysByApplication(applicationId: string): Promise<ApplicationSurvey[]> {
        const data = await restFetch<any>(
            `${this.baseUrl}/v1/applications/${applicationId}/surveys`,
        );
        return (data.surveys || []).map(
            (s: any) => ApplicationSurvey.fromJson(scrubJson(s), { ignoreUnknownFields: true }),
        );
    }

    async assignSurvey(
        applicationId: string,
        templateId: string,
        surveyType: string,
        assignedTo: string,
        surveyPurpose: string,
    ): Promise<ApplicationSurvey> {
        const data = await restFetch<any>(
            `${this.baseUrl}/v1/applications/${applicationId}/surveys`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    template_id: templateId,
                    survey_type: surveyType,
                    assigned_to: assignedTo,
                    survey_purpose: surveyPurpose,
                }),
            },
        );
        return ApplicationSurvey.fromJson(scrubJson(data), { ignoreUnknownFields: true });
    }

    async startSurvey(id: string, userId: string): Promise<ApplicationSurvey> {
        const data = await restFetch<any>(`${this.baseUrl}/v1/surveys/${id}/start`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId }),
        });
        return ApplicationSurvey.fromJson(scrubJson(data), { ignoreUnknownFields: true });
    }

    async submitSurvey(id: string, userId: string): Promise<ApplicationSurvey> {
        const data = await restFetch<any>(`${this.baseUrl}/v1/surveys/${id}/submit`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId }),
        });
        return ApplicationSurvey.fromJson(scrubJson(data), { ignoreUnknownFields: true });
    }

    async verifySurvey(id: string, userId: string): Promise<ApplicationSurvey> {
        const data = await restFetch<any>(`${this.baseUrl}/v1/surveys/${id}/verify`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId }),
        });
        return ApplicationSurvey.fromJson(scrubJson(data), { ignoreUnknownFields: true });
    }

    // ── Template & Sections ────────────────────────────────────────────────

    async getSurveyTemplate(id: string): Promise<SurveyTemplate> {
        const data = await restFetch<any>(`${this.baseUrl}/v1/survey-templates/${id}`);
        return SurveyTemplate.fromJson(scrubJson(data), { ignoreUnknownFields: true });
    }

    async listSurveyTemplates(): Promise<SurveyTemplate[]> {
        const data = await restFetch<any>(`${this.baseUrl}/v1/survey-templates`);
        return (data.templates || []).map(
            (t: any) => SurveyTemplate.fromJson(scrubJson(t), { ignoreUnknownFields: true }),
        );
    }

    async listSurveySections(templateId: string): Promise<SurveySection[]> {
        const data = await restFetch<any>(
            `${this.baseUrl}/v1/survey-templates/${templateId}/sections`,
        );
        // Unwrap: may be { sections: [...] } or array directly
        const list: any[] = Array.isArray(data) ? data : (data?.sections ?? []);
        const sections = list.map((s: any) => {
            const payload = s?.section ?? s; // unwrap nested if any
            return SurveySection.fromJson(payload, { ignoreUnknownFields: true });
        });
        console.log(`[REST] listSurveySections: ${sections.length} sections, first keys:`, sections[0] ? Object.keys(sections[0]).slice(0, 5) : []);
        return sections;
    }

    // ── Answers ────────────────────────────────────────────────────────────

    async submitSurveyAnswer(
        surveyId: string,
        questionId: string,
        answer: { text?: string; number?: string; boolean?: boolean; date?: string },
    ): Promise<void> {
        await restFetch<any>(`${this.baseUrl}/v1/surveys/${surveyId}/answers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question_id: questionId,
                answer_text: answer.text,
                answer_number: answer.number,
                answer_boolean: answer.boolean,
                answer_date: answer.date,
            }),
        });
    }
}
