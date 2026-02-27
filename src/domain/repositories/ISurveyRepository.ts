import { SurveyModel } from '../models/SurveyModel';

export interface ISurveyRepository {
    getSurvey(id: string): Promise<SurveyModel>;
    listSurveys(assignedTo?: string, status?: string): Promise<SurveyModel[]>;
    listSurveysByApplication(applicationId: string): Promise<SurveyModel[]>;
    assignSurvey(applicationId: string, templateId: string, surveyType: string, assignedTo: string, surveyPurpose: string): Promise<SurveyModel>;
    startSurvey(id: string, userId: string): Promise<SurveyModel>;
    submitSurvey(id: string, userId: string): Promise<SurveyModel>;
    verifySurvey(id: string, userId: string): Promise<SurveyModel>;
}
