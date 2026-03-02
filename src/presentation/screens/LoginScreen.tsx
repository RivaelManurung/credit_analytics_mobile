import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

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
                <View className="items-center mb-10">
                    <View className="bg-blue-100 p-4 rounded-full mb-6">
                        <ShieldCheck color="#0b78ed" size={60} />
                    </View>
                    <Text className="text-3xl font-bold text-dark text-center">Petugas Survei</Text>
                    <Text className="text-secondary text-base text-center mt-2">Silakan masuk dengan ID Surveyor Anda untuk mulai bekerja.</Text>
                </View>

                <View className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50">
                    <Text className="text-dark font-semibold mb-2">ID Surveyor</Text>
                    <TextInput
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-6 text-dark"
                        placeholder="Contoh: 0195c1c2-xxx"
                        placeholderTextColor="#94a3b8"
                        value={idInput}
                        onChangeText={setIdInput}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <TouchableOpacity
                        className="bg-primary py-4 rounded-xl items-center"
                        onPress={handleLogin}
                    >
                        <Text className="text-white font-bold text-lg">Masuk</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
