export function scrubJson(data: any): any {
    if (!data || typeof data !== 'object' || data === null) return data;

    // Handle Arrays correctly
    if (Array.isArray(data)) {
        return data.map(item => scrubJson(item));
    }

    const scrubbed = { ...data } as any;
    for (const key in scrubbed) {
        const val = scrubbed[key];
        if (typeof val === 'string' && (val.startsWith('0001-01-01') || val === '')) {
            delete scrubbed[key]; // Let Protobuf use default/empty value
        } else if (typeof val === 'object' && val !== null) {
            scrubbed[key] = scrubJson(val);
        }
    }
    return scrubbed;
}
