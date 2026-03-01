import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle, Save, Info, AlertCircle } from 'lucide-react-native';
import { useSurvey, useSurveyControl } from '../hooks/useSurveys';
import { useSurveyQuestions } from '../hooks/useSurveyForm';

interface SurveyFormScreenProps {
    surveyId: string;
    categoryCode: string;
    onBack: () => void;
}

export function SurveyFormScreen({ surveyId, categoryCode, onBack }: SurveyFormScreenProps) {
    const insets = useSafeAreaInsets();
    const { survey, loading: surveyLoading } = useSurvey(surveyId);
    const { questions, loading: questionsLoading, error: qError } = useSurveyQuestions(categoryCode);
    const { submitSurveyAnswer, loading: actionLoading } = useSurveyControl();

    // Store answers in a dictionary [questionId]: value
    const [answers, setAnswers] = useState<Record<string, string>>({});

    const handleAnswerChange = (questionId: string, value: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleSave = async () => {
        // Submit all answers that have value
        const submitPromises = Object.entries(answers).map(([qId, val]) => {
            if (val.trim() !== '') {
                return submitSurveyAnswer(surveyId, qId, { text: val });
            }
            return Promise.resolve();
        });

        await Promise.all(submitPromises);
        onBack();
    };

    const getCategoryName = (code: string) => {
        const names: Record<string, string> = {
            'UMUM': 'Data Umum',
            'ANALISA': 'Analisa Keuangan Usaha',
            'FINANSIAL': 'Finansial',
            'AGUNAN': 'Agunan',
            'CRR': 'CRR'
        };
        return names[code] || 'Survey';
    };

    if (surveyLoading || questionsLoading) {
        return (
            <View className="flex-1 bg-light justify-center items-center">
                <ActivityIndicator size="large" color="#0b78ed" />
                <Text className="mt-4 text-secondary font-medium">Memuat Pertanyaan...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-light">
            {/* Header */}
            <View
                className="bg-primary flex-row items-center justify-between pb-6 px-4 shadow-lg"
                style={{ paddingTop: insets.top }}
            >
                <TouchableOpacity onPress={onBack} className="p-1 w-12 items-start justify-center">
                    <ArrowLeft color="#fff" size={24} />
                </TouchableOpacity>

                <View className="flex-1 items-center">
                    <Text className="text-white text-lg font-bold">Detail Form</Text>
                    <Text className="text-white/70 text-[10px] uppercase font-bold tracking-widest">{getCategoryName(categoryCode)}</Text>
                </View>

                <View className="w-12" />
            </View>

            <ScrollView
                className="flex-1 p-4"
                contentContainerStyle={{ paddingBottom: 150 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Applicant Info Card */}
                <View className="bg-white rounded-2xl p-5 mb-6 shadow-md border border-slate-50">
                    <Text className="text-secondary text-[10px] uppercase font-bold tracking-widest mb-1">Nasabah</Text>
                    <Text className="text-dark text-xl font-bold">{survey?.applicantName || '...'}</Text>
                    <View className="h-px bg-slate-100 my-3 w-full" />
                    <View className="flex-row items-center">
                        <View className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
                        <Text className="text-slate-500 text-xs font-medium">Status: Sedang Disurvey</Text>
                    </View>
                </View>

                {qError && (
                    <View className="bg-red-50 p-4 rounded-xl mb-6 flex-row items-center border border-red-100">
                        <AlertCircle color="#ef4444" size={20} className="mr-3" />
                        <Text className="text-red-600 flex-1 text-sm font-medium">Gagal memuat pertanyaan backend. Silakan coba lagi.</Text>
                    </View>
                )}

                {/* Question List */}
                {questions.length === 0 && !questionsLoading && !qError ? (
                    <View className="bg-white rounded-2xl p-10 items-center shadow-sm border border-slate-100">
                        <Text className="text-secondary text-center">Belum ada pertanyaan tersedia untuk kategori ini di backend.</Text>
                    </View>
                ) : (
                    questions.sort((a, b) => a.displayOrder - b.displayOrder).map((q) => (
                        <View key={q.id} className="bg-white rounded-2xl p-6 mb-4 shadow-md border border-slate-50">
                            <View className="flex-row items-start mb-2">
                                <Text className="text-dark text-base font-bold flex-1">{q.uiLabel}</Text>
                                {q.isRequired && <Text className="text-red-500 font-bold ml-1">*</Text>}
                            </View>

                            {q.description && (
                                <Text className="text-slate-400 text-xs mb-3 font-medium leading-4">{q.description}</Text>
                            )}

                            <View className="bg-slate-50 rounded-xl border border-slate-200 p-3 min-h-[50px]">
                                <TextInput
                                    className="text-dark text-base"
                                    placeholder={q.dataType === 'NUMBER' ? '0' : 'Masukkan jawaban...'}
                                    placeholderTextColor="#94a3b8"
                                    keyboardType={q.dataType === 'NUMBER' ? 'numeric' : 'default'}
                                    multiline={q.dataType === 'TEXT'}
                                    value={answers[q.id] || ''}
                                    onChangeText={(val) => handleAnswerChange(q.id!, val)}
                                />
                            </View>
                        </View>
                    ))
                )}

                <View className="mt-4 flex-row items-start px-2">
                    <View className="bg-amber-100 p-1.5 rounded-full mr-3 mt-0.5">
                        <Info color="#d97706" size={14} />
                    </View>
                    <Text className="text-slate-500 text-[11px] leading-5 italic flex-1">
                        Seluruh data yang Anda masukkan disimpan secara otomatis ke server utama.
                    </Text>
                </View>
            </ScrollView>

            {/* Bottom Save Button */}
            <View
                className="absolute bottom-0 left-0 right-0 p-6 bg-white/90 border-t border-slate-100 backdrop-blur-md"
                style={{ paddingBottom: Math.max(24, insets.bottom) }}
            >
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleSave}
                    disabled={actionLoading}
                    className="bg-primary h-14 rounded-xl flex-row items-center justify-center shadow-md shadow-primary/30"
                >
                    {actionLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                            <Save color="#fff" size={20} />
                            <Text className="text-white font-bold text-base ml-2">Simpan Seluruh Jawaban</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}
