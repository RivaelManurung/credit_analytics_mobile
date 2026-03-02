import React from 'react';
import { View, Text } from 'react-native';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    bgColor?: string;
}

/**
 * StatCard - A premium looking statistic card for the dashboard.
 */
export function StatCard({ label, value, icon, bgColor = "bg-primary" }: StatCardProps) {
    return (
        <View className={`flex-1 ${bgColor} p-6 rounded-[32px] shadow-lg relative overflow-hidden`}>
            {/* Background Decorative Circle */}
            <View className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />

            <Text className="text-white/70 text-[10px] font-black uppercase tracking-wider mb-1">{label}</Text>
            <Text className="text-white text-3xl font-black">{value}</Text>

            <View className="absolute bottom-4 right-4 bg-white/20 p-2 rounded-2xl">
                {icon}
            </View>
        </View>
    );
}
