import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { X, Home, Clock, User } from 'lucide-react-native';

interface SidebarContentProps {
    onClose: () => void;
}

export function SidebarContent({ onClose }: SidebarContentProps) {
    return (
        <View className="flex-1">
            <View className="flex-row justify-between items-center px-5 py-5 border-b border-white/10">
                <View>
                    <Text className="text-white text-2xl font-bold">CA Mobile</Text>
                    <Text className="text-blue-100 text-sm mt-0.5">Survey Aplikasi</Text>
                </View>
                <TouchableOpacity onPress={onClose} className="p-1">
                    <X color="#fff" size={24} />
                </TouchableOpacity>
            </View>

            <View className="mt-2">
                {/* Active Item */}
                <TouchableOpacity className="flex-row items-center py-4 px-5 bg-white/20">
                    <Home color="#fff" size={20} />
                    <Text className="text-white text-base ml-4 font-medium">Dashboard</Text>
                </TouchableOpacity>

                <TouchableOpacity className="flex-row items-center py-4 px-5">
                    <Clock color="#fff" size={20} />
                    <Text className="text-white text-base ml-4 font-medium">Riwayat Survey</Text>
                </TouchableOpacity>

                <TouchableOpacity className="flex-row items-center py-4 px-5">
                    <User color="#fff" size={20} />
                    <Text className="text-white text-base ml-4 font-medium">Profil</Text>
                </TouchableOpacity>
            </View>

            <View className="flex-1" />

            <View className="p-5">
                <Text className="text-blue-200 text-xs">v1.2.0-beta</Text>
            </View>
        </View>
    );
}
