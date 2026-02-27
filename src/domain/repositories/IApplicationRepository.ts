import { ApplicationModel } from '../models/ApplicationModel';

export interface IApplicationRepository {
    listApplications(): Promise<ApplicationModel[]>;
}
