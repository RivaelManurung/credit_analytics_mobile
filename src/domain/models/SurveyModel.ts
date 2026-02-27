export interface SurveyModel {
    id: string;
    applicationId: string;
    templateId: string;
    surveyType: string;
    status: string;
    assignedTo: string;
    surveyPurpose: string;
    startedAt?: string;
    submittedAt?: string;
    submittedBy?: string;
    applicantName?: string;
    applicationStatus?: string;
}
