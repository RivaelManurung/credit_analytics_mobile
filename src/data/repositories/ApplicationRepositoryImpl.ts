import { createGrpcClient } from '../network/grpcClient';
import { ApplicationService } from '../../gen/application/v1/application_connect';
import { ListApplicationsRequest, Application } from '../../gen/application/v1/application_pb';

export class ApplicationRepositoryImpl {
    private client = createGrpcClient(ApplicationService);

    async listApplications(): Promise<Application[]> {
        try {
            console.log('[gRPC] LIST Applications requested');

            // Testing REST connectivity as we did for surveys
            const url = `https://creditanalyticsbackend-production.up.railway.app/v1/applications`;
            console.log(`[DEBUG] Testing REST Applications: ${url}`);

            try {
                const response = await this.client.listApplications(new ListApplicationsRequest({
                    pageSize: 20
                }));
                return response.applications;
            } catch (grpcErr) {
                console.warn('[gRPC ERROR] Falling back to REST for Applications:', grpcErr);

                // Fallback to REST because we confirmed it works in production
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    console.log('[DEBUG] REST Applications Success');
                    // Map REST JSON to Proto objects
                    return (data.applications || []).map((app: any) => new Application(app));
                }
                throw grpcErr;
            }
        } catch (error) {
            console.error('[gRPC/REST ERROR] LIST Applications:', error);
            throw error;
        }
    }

    async changeApplicationStatus(id: string, newStatus: string, reason: string): Promise<Application> {
        try {
            console.log(`[gRPC] CHANGE Status requested: ${id} -> ${newStatus}`);
            // Use ChangeApplicationStatusRequest message
            const { ChangeApplicationStatusRequest } = await import('../../gen/application/v1/application_pb');
            const response = await this.client.changeApplicationStatus(new ChangeApplicationStatusRequest({
                id,
                newStatus,
                reason
            }));
            return response;
        } catch (grpcErr) {
            console.warn('[gRPC ERROR] Falling back to REST for Change Status:', grpcErr);
            const url = `https://creditanalyticsbackend-production.up.railway.app/v1/applications/${id}/status`;
            const res = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    new_status: newStatus,
                    reason: reason
                })
            });
            if (res.ok) {
                return new Application(await res.json());
            }
            throw grpcErr;
        }
    }
}
