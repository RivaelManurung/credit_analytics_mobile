import { createGrpcClient } from '../network/grpcClient';
import { ApplicationService } from '../../gen/application/v1/application_connect';
import { ListApplicationsRequest, Application } from '../../gen/application/v1/application_pb';
import { scrubJson } from '../network/utils';
import { API_URL } from '@env';

export class ApplicationRepositoryImpl {
    private client = createGrpcClient(ApplicationService);
    private baseUrl = API_URL;

    async listApplications(): Promise<Application[]> {
        try {
            const response = await this.client.listApplications(new ListApplicationsRequest({ pageSize: 50 }));
            return response.applications;
        } catch (error) {
            const res = await fetch(`${this.baseUrl}/v1/applications`);
            if (res.ok) {
                const data = await res.json();
                return (data.applications || []).map((app: any) => {
                    // If backend sends identity_number at root but it's not in attributes,
                    // move it to attributes so Application.fromJson (which follows Protobuf) doesn't drop it.
                    if (app.identity_number && !app.attributes?.some((a: any) => a.attribute_id === 'identity_number')) {
                        app.attributes = [...(app.attributes || []), { attribute_id: 'identity_number', value: String(app.identity_number) }];
                    }
                    return Application.fromJson(scrubJson(app), { ignoreUnknownFields: true });
                });
            }
            throw error;
        }
    }

    async changeApplicationStatus(id: string, newStatus: string, reason: string): Promise<Application> {
        try {
            const { ChangeApplicationStatusRequest } = await import('../../gen/application/v1/application_pb');
            return await this.client.changeApplicationStatus(new ChangeApplicationStatusRequest({ id, newStatus, reason }));
        } catch (error) {
            const res = await fetch(`${this.baseUrl}/v1/applications/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ new_status: newStatus, reason })
            });
            if (res.ok) return new Application(scrubJson(await res.json()));
            throw error;
        }
    }
}
