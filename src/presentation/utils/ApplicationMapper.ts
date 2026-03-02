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
    raw: Application;
}

/**
 * Maps raw Application models to display-friendly formats,
 * extracting data from the EAV attributes where necessary.
 */
export const ApplicationMapper = {
    toDisplay: (app: Application): DisplayApplication => {
        // Preference: top-level field > attribute > default
        const name = app.applicantName || AttributeUtils.getValue(app.attributes, 'applicant_name') || 'Nasabah Tanpa Nama';
        const amount = app.loanAmount || AttributeUtils.getValue(app.attributes, 'loan_amount') || '0';
        const type = app.loanPurpose || AttributeUtils.getValue(app.attributes, 'loan_purpose') || 'Aplikasi Kredit';

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
            raw: app
        };
    }
};
