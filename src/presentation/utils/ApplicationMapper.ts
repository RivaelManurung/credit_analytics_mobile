import { Application } from '../../gen/application/v1/application_pb';
import { AttributeUtils } from './AttributeUtils';

export interface DisplayApplication {
    id: string;
    displayId: string;
    applicantName: string;
    status: string;
    amount: string;
    tenor: string;
    type: string;
    applicantType: string;
    raw: Application;
}

/**
 * Maps raw Application models to display-friendly formats,
 * extracting data from the EAV attributes where necessary.
 * 
 * All fields are derived dynamically from the Application's EAV attributes 
 * or top-level proto fields. Nothing is hardcoded.
 * 
 * @param app - The Application protobuf object
 * @param applicantType - Optional applicant type from the Applicant entity (e.g. 'personal', 'company')
 */
export const ApplicationMapper = {
    toDisplay: (app: Application, applicantType?: string): DisplayApplication => {
        // Preference: top-level field > attribute > default
        const name = app.applicantName || AttributeUtils.getValue(app.attributes, 'applicant_name') || 'Nasabah Tanpa Nama';
        const amount = app.loanAmount || AttributeUtils.getValue(app.attributes, 'loan_amount') || '0';
        const type = app.loanPurpose || AttributeUtils.getValue(app.attributes, 'loan_purpose') || 'Kredit';

        // Applicant type comes from the Applicant entity, passed in from the caller
        // Fallback to EAV attribute if available, otherwise leave as unknown
        const rawType = applicantType
            || AttributeUtils.getValue(app.attributes, 'applicant_type')
            || '';

        // Format: capitalize first letter (personal -> Personal, company -> Company)
        const formattedType = rawType
            ? rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase()
            : '';

        // Extract display ID (prioritize applicant_id as requested)
        const displayId = app.applicantId ||
            AttributeUtils.getValue(app.attributes, 'applicant_id') ||
            AttributeUtils.getValue(app.attributes, 'registration_number') ||
            app.id.substring(0, 8).toUpperCase();

        return {
            id: app.id,
            displayId: displayId,
            applicantName: name,
            status: app.status || 'PENDING',
            amount: `Rp ${Number(amount).toLocaleString('id-ID')}`,
            tenor: `${app.tenorMonths} Bulan`,
            type: type,
            applicantType: formattedType ? `${formattedType} Survey` : 'Survey',
            raw: app
        };
    }
};
