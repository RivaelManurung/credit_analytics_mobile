export const COLORS = {
    // Basic
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',

    // Brand Colors
    primary: '#1A56DB',   // Premium Blue
    primaryL: '#EEF3FF',  // Light Blue BG
    primaryD: '#1E429F',  // Darker Blue

    // Grayscale / Text
    text: '#0F1117',      // Primary Text (Old T.text)
    dark: '#0F1117',
    mid: '#374151',
    sub: '#6B7280',       // Secondary Text (Old T.sub)
    soft: '#6B7280',
    muted: '#9CA3AF',     // Placeholder / Disabled
    border: '#E5E7EB',    // Universal Border
    borderL: '#F3F4F6',   // Light Border

    // Backgrounds
    bg: '#F8FAFC',        // Main Screen BG
    bgSoft: '#F3F4F6',
    card: '#FFFFFF',      // Card Surface (Old T.card)
    surface: '#FFFFFF',

    // Status Semantic Colors
    success: '#059669',
    successL: '#ECFDF5',
    danger: '#E11D48',
    dangerL: '#FFF1F2',
    warning: '#D97706',
    warningL: '#FFFBEB',
    info: '#2563EB',
    infoL: '#EFF6FF',
    purple: '#7C3AED',
    purpleL: '#F5F3FF',
    teal: '#0D9488',
    tealL: '#F0FDFA',

    // Logic-based Status Mapping
    status: {
        inProgress: {
            text: '#2563EB',
            bg: '#EFF6FF',
            dot: '#2563EB'
        },
        assigned: {
            text: '#D97706',
            bg: '#FFFBEB',
            dot: '#D97706'
        },
        start: {
            text: '#7C3AED',
            bg: '#F5F3FF',
            dot: '#7C3AED'
        },
        submitted: {
            text: '#059669',
            bg: '#ECFDF5',
            dot: '#059669'
        },
        verified: {
            text: '#0D9488',
            bg: '#F0FDFA',
            dot: '#0D9488'
        },
        pending: {
            text: '#6B7280',
            bg: '#F9FAFB',
            dot: '#9CA3AF'
        },
        rejected: {
            text: '#E11D48',
            bg: '#FFF1F2',
            dot: '#E11D48'
        }
    }
};
