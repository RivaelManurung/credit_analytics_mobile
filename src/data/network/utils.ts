export function scrubJson(data: any): any {
    if (!data || typeof data !== 'object' || data === null) return data;

    if (Array.isArray(data)) {
        return data.map(item => scrubJson(item));
    }

    const scrubbed: any = {};
    for (const key in data) {
        let val = data[key];

        // 1. Scrub values (dates, strings)
        if (typeof val === 'string' && (val.startsWith('0001-01-01') || val === '')) {
            continue; // Skip empty/default values
        } else if (typeof val === 'object' && val !== null) {
            val = scrubJson(val);
        }

        // 2. Convert key to camelCase (e.g., option_label -> optionLabel)
        const camelKey = key.replace(/_([a-z0-9])/g, (_, char) => char.toUpperCase());
        scrubbed[camelKey] = val;
    }
    return scrubbed;
}
