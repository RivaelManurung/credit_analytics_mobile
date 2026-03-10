import { Application } from '../../gen/application/v1/application_pb';
import { AttributeUtils } from './AttributeUtils';

export interface DisplayApplication {
    id: string;
    displayId: string;
    applicantName: string;
    status: string;
    amount: string;
    tenor: string;
    loanPurpose: string;
    applicantType: string;
    raw: Application;
}

/**
 * Maps raw Application models to display-friendly formats,
 * extracting data from the EAV attributes where necessary.
 * 
 * All fields are derived dynamically from the Application's EAV attributes 
 * or top-level proto fields.
 * 
 * @param app - The Application protobuf object
 * @param applicantType - Optional applicant type from the Applicant entity (e.g. 'personal', 'company')
 */
export const ApplicationMapper = {
    toDisplay: (app: Application, applicantType?: string): DisplayApplication => {
        const name = app.applicantName || AttributeUtils.getValue(app.attributes, 'applicant_name') || '';
        const amount = app.loanAmount || AttributeUtils.getValue(app.attributes, 'loan_amount') || '';
        const loanPurposeValue = app.loanPurpose
            || AttributeUtils.getValue(app.attributes, 'loan_purpose_desc')
            || AttributeUtils.getValue(app.attributes, 'loan_purpose_name')
            || AttributeUtils.getValue(app.attributes, 'loan_purpose')
            || AttributeUtils.getValue(app.attributes, 'tujuan_kredit')
            || AttributeUtils.getValue(app.attributes, 'keperluan_kredit')
            || AttributeUtils.getValue(app.attributes, 'keperluan')
            || AttributeUtils.getValue(app.attributes, 'tujuan')
            || AttributeUtils.getValue(app.attributes, 'tujuan_penggunaan')
            || AttributeUtils.getValue(app.attributes, 'purpose')
            || '';

        const rawType = applicantType
            || AttributeUtils.getValue(app.attributes, 'applicant_type')
            || '';

        const displayType = rawType
            ? rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase()
            : '';

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
            loanPurpose: loanPurposeValue,
            applicantType: displayType,
            raw: app
        };
    }
};
