import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { X, Home, Clock, User, Users } from 'lucide-react-native';
import { useAppNavigator } from '../../context/NavigationContext';

interface SidebarContentProps {
    onClose: () => void;
}

export function SidebarContent({ onClose }: SidebarContentProps) {
    const { currentScreen, navigate } = useAppNavigator();

    const handleNavigate = (screen: any) => {
        navigate(screen);
        onClose();
    };

    return (
        <View className="flex-1">
            <View className="flex-row justify-between items-center px-5 py-5 border-b border-white/10">
                <View>
                    <Text className="text-primary text-2xl font-bold">CA Mobile</Text>
                    <Text className="text-primary text-sm mt-0.5">Survey Aplikasi</Text>
                </View>
                <TouchableOpacity onPress={onClose} className="p-1"> 
                    <X color="#1e39e5ff" size={24} />
                </TouchableOpacity>
            </View>
            {/* divider */}
            <View className="border-b border-black/10 px-3" />

            <View className="mt-2">
                <TouchableOpacity
                    className={`flex-row items-center py-4 px-5 ${currentScreen === 'Dashboard' ? 'bg-white/20' : ''}`}
                    onPress={() => handleNavigate('Dashboard')}
                >
                    <Home color="#000" size={20} />
                    <Text className="text-black text-base ml-4 font-medium">Dashboard</Text>
                </TouchableOpacity>


                <TouchableOpacity className="flex-row items-center py-4 px-5">
                    <Clock color="#000" size={20} />
                    <Text className="text-black text-base ml-4 font-medium">Riwayat Survey</Text>
                </TouchableOpacity>

                <TouchableOpacity className="flex-row items-center py-4 px-5">
                    <User color="#000" size={20} />
                    <Text className="text-black text-base ml-4 font-medium">Profil</Text>
                </TouchableOpacity>
            </View>

            <View className="flex-1" />

            <View className="p-5">
                <Text className="text-blue-200 text-xs">v1.2.0-beta</Text>
            </View>
        </View>
    );
}
