import { createGrpcClient } from '../network/grpcClient';
import { ReferenceService } from '../../gen/reference/v1/reference_connect';
import {
    AttributeCategory,
    AttributeRegistry,
    ListAttributeCategoriesResponse,
    ListAttributeRegistryByCategoryRequest,
    ListAttributeRegistryResponse
} from '../../gen/reference/v1/reference_pb';
import { Empty } from '@bufbuild/protobuf';
import { scrubJson } from '../network/utils';

export class ReferenceRepositoryImpl {
    private client = createGrpcClient(ReferenceService);

    private baseUrl = 'https://creditanalyticsbackend-production.up.railway.app';

    async listAttributeCategories(): Promise<AttributeCategory[]> {
        try {
            const response = await this.client.listAttributeCategories(new Empty());
            return response.categories;
        } catch (error) {
            console.warn('[ReferenceRepository] gRPC Error, falling back to REST for Categories');
            try {
                const res = await fetch(`${this.baseUrl}/v1/reference/categories`);
                if (res.ok) {
                    const data = await res.json();
                    return (data.categories || []).map((c: any) => new AttributeCategory(scrubJson(c)));
                }
            } catch (fetchErr) {
                console.error('[ReferenceRepository] REST Fallback failed:', fetchErr);
            }
            return [];
        }
    }

    async listAttributeRegistryByCategory(categoryCode: string): Promise<AttributeRegistry[]> {
        try {
            const response = await this.client.listAttributeRegistryByCategory(
                new ListAttributeRegistryByCategoryRequest({ categoryCode })
            );
            return response.attributes;
        } catch (error) {
            console.warn(`[ReferenceRepository] gRPC Error, falling back to REST for Attributes in category ${categoryCode}`);
            try {
                const res = await fetch(`${this.baseUrl}/v1/reference/categories/${categoryCode}/attributes`);
                if (res.ok) {
                    const data = await res.json();
                    return (data.attributes || []).map((a: any) => new AttributeRegistry(scrubJson(a)));
                }
            } catch (fetchErr) {
                console.error('[ReferenceRepository] REST Fallback failed:', fetchErr);
            }
            return [];
        }
    }

    async listAllAttributeRegistry(): Promise<AttributeRegistry[]> {
        try {
            const response = await this.client.listAttributeRegistry(new Empty());
            return response.attributes;
        } catch (error) {
            console.error('[ReferenceRepository] Error listing all attributes:', error);
            return [];
        }
    }
}
