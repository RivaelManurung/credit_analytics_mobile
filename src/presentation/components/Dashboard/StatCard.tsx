import React from 'react';
import { View, Text } from 'react-native';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
}

export function StatCard({ title, value, icon }: StatCardProps) {
    return (
        <View className="bg-white rounded-xl p-5 flex-row items-center justify-between mb-4 shadow-sm">
            <View className="flex-1">
                <Text className="text-secondary text-sm font-semibold mb-2">{title}</Text>
                <Text className="text-primary text-3xl font-bold">{value}</Text>
            </View>
            <View className="w-12 h-12 rounded-full bg-light justify-center items-center">
                {icon}
            </View>
        </View>
    );
}
