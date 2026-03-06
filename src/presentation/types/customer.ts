import { Application } from '../../gen/application/v1/application_pb';
import { ApplicationSurvey } from '../../gen/survey/v1/survey_pb';
import { DisplayApplication } from '../utils/ApplicationMapper';

/**
 * Represents a single item in the customer list on the Dashboard.
 * Combines Application, Survey, and display-formatted data.
 */
export interface CustomerListItem {
    app: Application;
    survey: ApplicationSurvey | undefined;
    display: DisplayApplication;
}
