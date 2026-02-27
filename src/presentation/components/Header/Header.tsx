import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Menu } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
    title: string;
    onMenuPress: () => void;
}

export function Header({ title, onMenuPress }: HeaderProps) {
    const insets = useSafeAreaInsets();

    return (
        <View
            className="bg-primary flex-row items-center justify-between pb-4 px-4 shadow-md"
            style={{ paddingTop: insets.top }}
        >
            <TouchableOpacity onPress={onMenuPress} className="p-1 w-10">
                <Menu color="#fff" size={24} />
            </TouchableOpacity>

            <Text className="text-white text-lg font-bold">{title}</Text>

            {/* Invisible view to balance flex layout */}
            <View className="w-10" />
        </View>
    );
}
