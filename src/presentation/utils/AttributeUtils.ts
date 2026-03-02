import { ApplicationAttribute } from '../../gen/application/v1/application_pb';

/**
 * Utility for handling Entity-Attribute-Value (EAV) data from the backend.
 */
export const AttributeUtils = {
    /**
     * Gets an attribute value by its ID.
     */
    getValue: (attributes: ApplicationAttribute[] = [], id: string): string => {
        const attr = attributes.find(a => a.attributeId === id);
        return attr ? attr.value : '';
    },

    /**
     * Gets multiple attributes as a flattened object.
     */
    flatten: (attributes: ApplicationAttribute[] = []): Record<string, string> => {
        return attributes.reduce((acc, attr) => {
            acc[attr.attributeId] = attr.value;
            return acc;
        }, {} as Record<string, string>);
    }
};
