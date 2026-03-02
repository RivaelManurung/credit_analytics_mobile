import React, { createContext, useContext, useState, useEffect } from 'react';
import { BackHandler } from 'react-native';
import { ScreenName } from '../types/navigation';

interface NavigationContextType {
    currentScreen: ScreenName;
    params: any;
    navigate: (screen: ScreenName, params?: any) => void;
    goBack: () => boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
    const [currentScreen, setCurrentScreen] = useState<ScreenName>('Dashboard');
    const [params, setParams] = useState<any>(null);
    const [history, setHistory] = useState<ScreenName[]>(['Dashboard']);

    const navigate = (screen: ScreenName, screenParams?: any) => {
        setParams(screenParams);
        setCurrentScreen(screen);
        setHistory(prev => [...prev, screen]);
    };

    const goBack = () => {
        if (history.length > 1) {
            const newHistory = [...history];
            newHistory.pop(); // remove current
            const prevScreen = newHistory[newHistory.length - 1];
            setHistory(newHistory);
            setCurrentScreen(prevScreen);
            return true;
        }
        return false; // Exit app
    };

    return (
        <NavigationContext.Provider value={{ currentScreen, params, navigate, goBack }}>
            {children}
        </NavigationContext.Provider>
    );
}

export function useAppNavigator() {
    const context = useContext(NavigationContext);
    if (!context) throw new Error('useAppNavigator must be used within NavigationProvider');
    return context;
}
