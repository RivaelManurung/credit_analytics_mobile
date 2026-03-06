import { createGrpcClient } from '../network/grpcClient';
import { ApplicationService } from '../../gen/application/v1/application_connect';
import {
    ListApplicationsRequest,
    GetApplicationRequest,
    ChangeApplicationStatusRequest,
    Application,
} from '../../gen/application/v1/application_pb';
import { scrubJson } from '../network/utils';
import { API_URL } from '@env';
import { APP_CONFIG } from '../../constants';

export class ApplicationRepositoryImpl {
    private client = createGrpcClient(ApplicationService);
    private baseUrl = API_URL;

    /**
     * Fetches a paginated list of applications using cursor-based pagination.
     */
    async listApplications(
        cursor?: string,
        pageSize: number = APP_CONFIG.DEFAULT_PAGE_SIZE,
    ): Promise<{ applications: Application[]; nextCursor: string }> {
        try {
            const response = await this.client.listApplications(
                new ListApplicationsRequest({ cursor, pageSize }),
            );
            return {
                applications: response.applications,
                nextCursor: response.nextCursor,
            };
        } catch (_grpcError) {
            let url = `${this.baseUrl}/v1/applications?pageSize=${pageSize}`;
            if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;

            const res = await fetch(url);
            if (!res.ok) throw _grpcError;

            const data = await res.json();
            const applications = (data.applications || []).map((app: Record<string, unknown>) => {
                if (
                    app.identity_number &&
                    !Array.isArray(app.attributes) ||
                    !(app.attributes as any[])?.some((a: any) => a.attribute_id === 'identity_number')
                ) {
                    app.attributes = [
                        ...((app.attributes as any[]) || []),
                        { attribute_id: 'identity_number', value: String(app.identity_number) },
                    ];
                }
                return Application.fromJson(scrubJson(app), { ignoreUnknownFields: true });
            });

            return {
                applications,
                nextCursor: data.nextCursor || '',
            };
        }
    }

    /**
     * Fetches a single application by ID.
     * Uses the gRPC GetApplication endpoint with REST fallback.
     */
    async getApplication(id: string): Promise<Application> {
        try {
            return await this.client.getApplication(new GetApplicationRequest({ id }));
        } catch (_grpcError) {
            const res = await fetch(`${this.baseUrl}/v1/applications/${id}`);
            if (!res.ok) throw _grpcError;

            const data = await res.json();
            return Application.fromJson(scrubJson(data), { ignoreUnknownFields: true });
        }
    }

    /**
     * Changes the status of an application (e.g. PENDING → APPROVED).
     */
    async changeApplicationStatus(
        id: string,
        newStatus: string,
        reason: string,
    ): Promise<Application> {
        try {
            return await this.client.changeApplicationStatus(
                new ChangeApplicationStatusRequest({ id, newStatus, reason }),
            );
        } catch (_grpcError) {
            const res = await fetch(`${this.baseUrl}/v1/applications/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ new_status: newStatus, reason }),
            });
            if (!res.ok) throw _grpcError;
            return Application.fromJson(scrubJson(await res.json()), { ignoreUnknownFields: true });
        }
    }
}
