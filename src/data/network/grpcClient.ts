import { createGrpcWebTransport } from '@connectrpc/connect-web';
import { createClient } from '@connectrpc/connect';

import { API_URL } from '@env';

const baseUrl = API_URL;
console.log(`[gRPC] Transport initialized with baseUrl: ${baseUrl} (using gRPC-Web)`);

// Note: connect-web transport uses fetch under the hood which works perfectly in React Native
// Switching to gRPC-Web because the backend uses improbable-eng/grpc-web middleware
export const transport = createGrpcWebTransport({
    baseUrl,
    useBinaryFormat: false, // Use JSON encoding for better compatibility with React Native fetch
});


export function createGrpcClient<T extends import('@bufbuild/protobuf').ServiceType>(service: T) {
    return createClient(service, transport);
}
