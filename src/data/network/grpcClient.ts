import { createGrpcWebTransport } from '@connectrpc/connect-web';
import { createClient } from '@connectrpc/connect';

import { API_URL } from '@env';

const baseUrl = API_URL;
console.log(`[gRPC] Transport initialized with baseUrl: ${baseUrl} (using gRPC-Web)`);

// Note: connect-web transport uses fetch under the hood which works perfectly in React Native
// Switching to gRPC-Web because the backend uses improbable-eng/grpc-web middleware
export const transport = createGrpcWebTransport({
    baseUrl,
    useBinaryFormat: false, // Text format is more robust for some proxies
    interceptors: [
        (next) => async (req) => {
            req.header.set('X-Grpc-Web', '1');
            req.header.set('X-User-Agent', 'grpc-web-javascript/0.1');
            // Adding Content-Type explicitly to help some middleboxes
            if (!req.header.has('Content-Type')) {
                req.header.set('Content-Type', 'application/grpc-web-text+proto');
            }
            return await next(req);
        },
    ],
});


export function createGrpcClient<T extends import('@bufbuild/protobuf').ServiceType>(service: T) {
    return createClient(service, transport);
}
