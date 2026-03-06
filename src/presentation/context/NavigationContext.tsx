import React, { createContext, useContext, useState } from 'react';
import { ScreenName } from '../types/navigation';

interface HistoryEntry {
    screen: ScreenName;
    params: any;
}

interface NavigationContextType {
    currentScreen: ScreenName;
    params: any;
    navigate: (screen: ScreenName, params?: any) => void;
    goBack: () => boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
    const [history, setHistory] = useState<HistoryEntry[]>([{ screen: 'Dashboard', params: null }]);

    const current = history[history.length - 1];

    const navigate = React.useCallback((screen: ScreenName, screenParams?: any) => {
        setHistory(prev => [...prev, { screen, params: screenParams ?? null }]);
    }, []);

    const goBack = React.useCallback(() => {
        if (history.length > 1) {
            setHistory(prev => prev.slice(0, -1));
            return true;
        }
        return false; // Exit app
    }, [history.length]);

    const value = React.useMemo(() => ({
        currentScreen: current.screen,
        params: current.params,
        navigate,
        goBack
    }), [current, navigate, goBack]);

    return (
        <NavigationContext.Provider value={value}>
            {children}
        </NavigationContext.Provider>
    );
}

export function useAppNavigator() {
    const context = useContext(NavigationContext);
    if (!context) throw new Error('useAppNavigator must be used within NavigationProvider');
    return context;
}
