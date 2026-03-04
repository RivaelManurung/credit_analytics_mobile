export const COLORS = {
    // Brand Colors
    primary: '#3b82f6', // Bright Modern Blue
    secondary: '#94a3b8', // Light Slate
    dark: '#334155', // Soft Slate-600 for text
    light: '#ffffff', // Pure White

    // Semantic Colors
    success: '#10B981', // Emerald-500
    danger: '#e11d48', // Rose-600
    warning: '#D97706', // Amber-600
    info: '#2563EB', // Blue-600

    // Backgrounds
    background: '#F8FAFC', // Slate-50
    card: '#FFFFFF',

    // Status Colors (from Dashboard)
    status: {
        inProgress: {
            text: '#2563EB',
            bg: '#eff6ff', // blue-50
            dot: '#2563eb' // blue-600
        },
        assigned: {
            text: '#D97706',
            bg: '#fffbeb', // amber-50
            dot: '#d97706' // amber-600
        },
        start: {
            text: '#7C3AED',
            bg: '#f5f3ff', // purple-50
            dot: '#7c3aed' // purple-600
        },
        submitted: {
            text: '#059669',
            bg: '#ecfdf5', // emerald-50
            dot: '#059669' // emerald-600
        },
        verified: {
            text: '#10B981',
            bg: '#f0fdf4', // teal-50
            dot: '#10b981' // teal-600
        },
        pending: {
            text: '#6B7280',
            bg: '#f8fafc', // slate-50
            dot: '#94a3b8' // slate-400
        },
        rejected: {
            text: '#e11d48',
            bg: '#fff1f2', // rose-50
            dot: '#e11d48' // rose-600
        }
    }
};
