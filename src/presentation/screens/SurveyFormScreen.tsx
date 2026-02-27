import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Camera, CheckCircle, Info } from 'lucide-react-native';
import { useSurvey, useSurveyControl } from '../hooks/useSurveys';

interface SurveyFormScreenProps {
    surveyId: string;
    onBack: () => void;
}

export function SurveyFormScreen({ surveyId, onBack }: SurveyFormScreenProps) {
    const insets = useSafeAreaInsets();
    const { survey, loading, error } = useSurvey(surveyId);
    const { submitSurvey, loading: submitting } = useSurveyControl();

    // Mock questions for now - ideally these would come from ReferenceService based on templateId
    const [answers, setAnswers] = useState<Record<string, string>>({
        'q1': '',
        'q2': '',
        'q3': ''
    });

    const handleAnswerChange = (id: string, text: string) => {
        setAnswers(prev => ({ ...prev, [id]: text }));
    };

    const handleSubmit = async () => {
        // Validation check
        if (Object.values(answers).some(a => a.trim() === '')) {
            Alert.alert('Peringatan', 'Harap isi semua pertanyaan survey.');
            return;
        }

        const result = await submitSurvey(surveyId, '0195c1c2-0001-7000-bb34-000000000001');
        if (result) {
            Alert.alert('Berhasil', 'Survey telah dikirim.', [{ text: 'OK', onPress: onBack }]);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 bg-light justify-center items-center">
                <ActivityIndicator size="large" color="#0b78ed" />
            </View>
        );
    }

    if (error || !survey) {
        return (
            <View className="flex-1 bg-light justify-center items-center p-6">
                <Text className="text-red-500 text-center mb-4">Gagal memuat data survey: {error?.message}</Text>
                <TouchableOpacity onPress={onBack} className="bg-primary px-6 py-3 rounded-xl">
                    <Text className="text-white font-bold">Kembali</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-light">
            {/* Header */}
            <View
                className="bg-primary px-4 pb-6 shadow-lg rounded-b-[32px]"
                style={{ paddingTop: insets.top }}
            >
                <View className="flex-row items-center mb-4">
                    <TouchableOpacity onPress={onBack} className="p-2 -ml-2">
                        <ChevronLeft color="#fff" size={28} />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold ml-2">Detail Survey</Text>
                </View>

                <View className="bg-white/10 p-4 rounded-2xl flex-row items-center border border-white/20">
                    <View className="bg-white/20 p-3 rounded-full mr-4">
                        <Info color="#fff" size={20} />
                    </View>
                    <View>
                        <Text className="text-white/70 text-xs font-medium uppercase tracking-wider">Nasabah</Text>
                        <Text className="text-white text-lg font-bold">{survey.applicantName || 'Memuat...'}</Text>
                        <Text className="text-white/80 text-sm">App ID: {survey.applicationId.substring(0, 8)}</Text>
                    </View>
                </View>
            </View>

            <ScrollView className="flex-1 p-6" contentContainerStyle={{ paddingBottom: 100 }}>
                <View className="mb-8">
                    <Text className="text-dark text-xl font-bold mb-1">Form Kunjungan</Text>
                    <Text className="text-secondary text-base">Lengkapi data survey lapangan berikut</Text>
                </View>

                {/* Question 1 */}
                <View className="bg-white p-6 rounded-3xl shadow-sm mb-6 border border-slate-100">
                    <Text className="text-dark font-bold text-lg mb-3">1. Kondisi tempat tinggal?</Text>
                    <TextInput
                        className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-dark min-h-[100px]"
                        placeholder="Contoh: Rumah milik sendiri, permanen..."
                        multiline
                        textAlignVertical="top"
                        value={answers.q1}
                        onChangeText={(t) => handleAnswerChange('q1', t)}
                    />
                </View>

                {/* Question 2 */}
                <View className="bg-white p-6 rounded-3xl shadow-sm mb-6 border border-slate-100">
                    <Text className="text-dark font-bold text-lg mb-3">2. Apakah bisnis masih aktif?</Text>
                    <TextInput
                        className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-dark"
                        placeholder="Contoh: Aktif, buka jam 08.00 - 17.00"
                        value={answers.q2}
                        onChangeText={(t) => handleAnswerChange('q2', t)}
                    />
                </View>

                {/* Question 3 */}
                <View className="bg-white p-6 rounded-3xl shadow-sm mb-6 border border-slate-100">
                    <Text className="text-dark font-bold text-lg mb-3">3. Catatan tambahan surveyor</Text>
                    <TextInput
                        className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-dark min-h-[100px]"
                        placeholder="Tuliskan temuan lainnya..."
                        multiline
                        textAlignVertical="top"
                        value={answers.q3}
                        onChangeText={(t) => handleAnswerChange('q3', t)}
                    />
                </View>

                {/* Evidence Photo Section */}
                <View className="bg-white p-6 rounded-3xl shadow-sm mb-10 border border-slate-100">
                    <Text className="text-dark font-bold text-lg mb-4">Foto Bukti Kunjungan</Text>
                    <TouchableOpacity className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl h-40 items-center justify-center">
                        <Camera color="#94A3B8" size={32} />
                        <Text className="text-slate-400 font-medium mt-2">Ambil Foto</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Bottom Button */}
            <View className="absolute bottom-0 left-0 right-0 p-6 bg-white/80 border-t border-slate-100">
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={submitting}
                    className={`bg-primary h-16 rounded-2xl flex-row items-center justify-center shadow-lg ${submitting ? 'opacity-70' : ''}`}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <CheckCircle color="#fff" size={20} className="mr-2" />
                            <Text className="text-white font-bold text-lg ml-2">Kirim Hasil Survey</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}
