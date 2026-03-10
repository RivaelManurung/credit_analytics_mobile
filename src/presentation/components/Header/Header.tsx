import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Menu, ArrowLeft } from 'lucide-react-native';
import { useAppNavigator } from '../../context/NavigationContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
interface HeaderProps {
    title: string;
    onMenuPress?: () => void;
    showMenu?: boolean;
}

export function Header({ title, onMenuPress, showMenu = true }: HeaderProps) {
    const insets = useSafeAreaInsets();
    const { goBack } = useAppNavigator();

    return (
        <View
            className="bg-primary flex-row items-center justify-between py-4 px-5 border-b border-primary/20"
            style={{ paddingTop: insets.top + 8 }}
        >
            <StatusBar
                barStyle="light-content"
                className="bg-primary"
            />
            {showMenu ? (
                <TouchableOpacity
                    onPress={onMenuPress}
                    activeOpacity={0.7}
                    className="w-10 h-10 items-center justify-center bg-white/10 rounded-xl"
                >
                    <Menu color="#fff" size={22} strokeWidth={2.5} />
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    onPress={() => goBack()}
                    activeOpacity={0.7}
                    className="w-10 h-10 items-center justify-center bg-white/10 rounded-xl"
                >
                    <ArrowLeft color="#fff" size={22} strokeWidth={2.5} />
                </TouchableOpacity>
            )}

            <Text className="text-white text-[17px] font-black tracking-tight">{title}</Text>

            {/* Invisible view to balance flex layout */}
            <View className="w-10" />
        </View>
    );
}
