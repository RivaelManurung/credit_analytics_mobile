import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../../constants';

export function LoginScreen() {
    const { login } = useAuth();
    const [idInput, setIdInput] = useState('');

    const handleLogin = () => {
        if (idInput.trim()) {
            login(idInput.trim());
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-light">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1 justify-center px-8"
            >
                <View className="items-center mb-12">
                    <View className="bg-blue-50 p-6 rounded-[32px] mb-8 border border-blue-100">
                        <ShieldCheck color={COLORS.primary} size={56} strokeWidth={2.5} />
                    </View>

                    <Text className="text-4xl font-black text-dark text-center tracking-tight">Survey <Text className="text-primary italic">Portal</Text></Text>
                    <Text className="text-secondary text-sm text-center mt-3 font-medium px-4 leading-5">Silakan masuk dengan ID Surveyor Anda untuk mulai bekerja pada sistem internal.</Text>
                </View>

                <View className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                    <Text className="text-dark font-black text-[10px] uppercase tracking-widest mb-3 ml-1">ID Surveyor</Text>
                    <TextInput
                        className="bg-slate-50 border border-slate-100 rounded-[20px] px-5 py-4 mb-8 text-dark font-bold"
                        placeholder="0195c1c2-xxxx..."
                        placeholderTextColor="#94a3b8"
                        value={idInput}
                        onChangeText={setIdInput}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <TouchableOpacity
                        className="bg-primary py-4 rounded-[20px] items-center"
                        onPress={handleLogin}
                        activeOpacity={0.8}
                        style={{
                            shadowColor: COLORS.primary,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.2,
                            shadowRadius: 10,
                            elevation: 4
                        }}
                    >
                        <View className="flex-row items-center">
                            <Text className="text-white font-black text-[13px] uppercase tracking-[3px]">Masuk Sekarang</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
