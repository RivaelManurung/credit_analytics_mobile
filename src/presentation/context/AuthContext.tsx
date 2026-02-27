import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
    surveyorId: string | null;
    login: (id: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [surveyorId, setSurveyorId] = useState<string | null>(null);

    const login = (id: string) => {
        setSurveyorId(id);
    };

    const logout = () => {
        setSurveyorId(null);
    };

    return (
        <AuthContext.Provider value={{ surveyorId, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
