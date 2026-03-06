export type RootStackParamList = {
    Login: undefined;
    Dashboard: undefined;
    ApplicationList: undefined;
    SurveyForm: { surveyId: string; applicationId: string };
    ApplicationDetail: { applicationId: string; surveyId?: string };
};


export type ScreenName = keyof RootStackParamList;
