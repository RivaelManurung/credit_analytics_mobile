import React, { useState } from 'react';
import { View, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SidebarContent } from '../Sidebar/SidebarContent';
import { Header } from '../Header/Header';

interface SidebarLayoutProps {
    children: React.ReactNode;
    headerTitle?: string;
}

const { width } = Dimensions.get('window');

export function SidebarLayout({ children, headerTitle = 'CA Mobile Survey' }: SidebarLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const insets = useSafeAreaInsets();

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <View className="flex-1 bg-light">
            <Header title={headerTitle} onMenuPress={toggleSidebar} />

            <View className="flex-1">
                {children}
            </View>

            {/* Overlay background when sidebar is open */}
            {isSidebarOpen && (
                <TouchableOpacity
                    className="absolute inset-0 bg-black/50 z-10"
                    activeOpacity={1}
                    onPress={toggleSidebar}
                />
            )}

            {/* Sidebar Panel */}
            <View
                className={`absolute top-0 bottom-0 bg-primary z-20 shadow-xl ${isSidebarOpen ? 'left-0' : '-left-full'}`}
                style={{
                    paddingTop: insets.top,
                    width: width * 0.75
                }}
            >
                <SidebarContent onClose={toggleSidebar} />
            </View>
        </View>
    );
}
