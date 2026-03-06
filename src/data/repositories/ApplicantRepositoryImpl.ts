import { createGrpcClient } from '../network/grpcClient';
import { ApplicantService } from '../../gen/applicant/v1/applicant_connect';
import { GetApplicantRequest, Applicant } from '../../gen/applicant/v1/applicant_pb';
import { scrubJson } from '../network/utils';
import { API_URL } from '@env';

export class ApplicantRepositoryImpl {
    private client = createGrpcClient(ApplicantService);
    private baseUrl = API_URL;

    async getApplicant(id: string): Promise<Applicant> {
        try {
            return await this.client.getApplicant(new GetApplicantRequest({ id }));
        } catch (error) {
            const res = await fetch(`${this.baseUrl}/v1/applicants/${id}`);
            if (res.ok) {
                const data = await res.json();

                // Map the backend's 'applicantType' to the expected 'type' property in the Protobuf message
                if (data.applicantType && !data.type) {
                    data.type = data.applicantType;
                }

                // Normalize attributes: convert string values to ValueLayer objects if needed
                if (Array.isArray(data.attributes)) {
                    data.attributes = data.attributes.map((attr: any) => {
                        if (attr && typeof attr.value === 'string') {
                            return { ...attr, value: { rawValue: attr.value } };
                        }
                        return attr;
                    });
                }

                return Applicant.fromJson(scrubJson(data), { ignoreUnknownFields: true });
            }
            throw error;
        }
    }
}
