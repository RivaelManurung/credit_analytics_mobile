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

export interface SurveyTemplateModel {
    id: string;
    templateCode: string;
    templateName: string;
    applicantType: string;
    productId: string;
    active: boolean;
    sections: SurveySectionModel[];
}

export interface SurveySectionModel {
    id: string;
    templateId: string;
    sectionName: string;
    sequence: number;
    questions: SurveyQuestionModel[];
}

export interface SurveyQuestionModel {
    id: string;
    sectionId: string;
    questionText: string;
    answerType: string; // TEXT | NUMBER | BOOLEAN | DATE | OPTION
    sequence: number;
    isRequired: boolean;
    options: SurveyQuestionOptionModel[];
}

export interface SurveyQuestionOptionModel {
    id: string;
    questionId: string;
    optionText: string;
    optionValue: string;
}
