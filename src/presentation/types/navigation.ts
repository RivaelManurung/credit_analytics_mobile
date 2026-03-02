export type RootStackParamList = {
    Login: undefined;
    Dashboard: undefined;
    ApplicationList: undefined;
    SurveyForm: { surveyId: string };
};

export type ScreenName = keyof RootStackParamList;
