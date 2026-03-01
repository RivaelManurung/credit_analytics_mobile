import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, ArrowLeft, Info, TrendingUp, DollarSign, Home, ShieldCheck } from 'lucide-react-native';
import { useSurveyForm } from '../hooks/useSurveyForm';
import { useSurvey } from '../hooks/useSurveys';

interface SurveyCategoryScreenProps {
    surveyId: string;
    onBack: () => void;
    onSelectCategory: (categoryCode: string) => void;
}

export function SurveyCategoryScreen({ surveyId, onBack, onSelectCategory }: SurveyCategoryScreenProps) {
    const insets = useSafeAreaInsets();
    const { survey, loading: surveyLoading } = useSurvey(surveyId);
    const { categories, loading: catLoading } = useSurveyForm(surveyId);

    const getIcon = (code: string) => {
        switch (code) {
            case 'UMUM': return <Info color="#0b78ed" size={24} />;
            case 'ANALISA': return <TrendingUp color="#10b981" size={24} />;
            case 'FINANSIAL': return <DollarSign color="#f59e0b" size={24} />;
            case 'AGUNAN': return <Home color="#6366f1" size={24} />;
            case 'CRR': return <ShieldCheck color="#ef4444" size={24} />;
            default: return <Info color="#0b78ed" size={24} />;
        }
    };

    if (surveyLoading || catLoading) {
        return (
            <View className="flex-1 bg-light justify-center items-center">
                <ActivityIndicator size="large" color="#0b78ed" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-light">
            {/* Header matching Dashboard Header */}
            <View
                className="bg-primary flex-row items-center justify-between pb-6 px-4 shadow-lg border-b border-primary/20"
                style={{ paddingTop: insets.top }}
            >
                <TouchableOpacity onPress={onBack} className="p-1 w-12 items-start justify-center">
                    <ArrowLeft color="#fff" size={24} />
                </TouchableOpacity>

                <View className="flex-1 items-center">
                    <Text className="text-white text-lg font-bold">Kategori Survey</Text>
                    <Text className="text-white/70 text-[10px] uppercase font-bold tracking-widest">{survey?.applicantName || 'Memuat...'}</Text>
                </View>

                <View className="w-12" />
            </View>

            <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
                <View className="mt-2 mb-4">
                    <Text className="text-dark text-xl font-bold ml-1">Pilih Bagian</Text>
                    <Text className="text-secondary text-sm ml-1">Silakan lengkapi data per kategori berikut</Text>
                </View>

                {categories.map((cat) => {
                    const progress = cat.totalQuestions > 0 ? cat.completedQuestions / cat.totalQuestions : 0;
                    const isCompleted = cat.completedQuestions === cat.totalQuestions && cat.totalQuestions > 0;

                    return (
                        <TouchableOpacity
                            key={cat.categoryCode}
                            activeOpacity={0.7}
                            onPress={() => onSelectCategory(cat.categoryCode)}
                            className="bg-white rounded-2xl p-5 mb-4 shadow-md border border-slate-50"
                        >
                            <View className="flex-row items-center mb-4">
                                <View className="w-14 h-14 rounded-2xl bg-slate-50 items-center justify-center mr-4 border border-slate-100">
                                    {getIcon(cat.categoryCode)}
                                </View>

                                <View className="flex-1">
                                    <Text className="text-dark text-lg font-bold">{cat.categoryName}</Text>
                                    <View className="flex-row items-center mt-1">
                                        <View className={`px-2 py-0.5 rounded-md mr-2 ${isCompleted ? 'bg-green-100' : 'bg-slate-100'}`}>
                                            <Text className={`text-[10px] font-bold ${isCompleted ? 'text-green-700' : 'text-slate-500'}`}>
                                                {isCompleted ? 'COMPLETED' : 'IN PROGRESS'}
                                            </Text>
                                        </View>
                                        <Text className="text-secondary text-[11px] font-medium">{cat.completedQuestions} dari {cat.totalQuestions} pertanyaan</Text>
                                    </View>
                                </View>

                                <View className="bg-slate-50 w-8 h-8 rounded-full items-center justify-center">
                                    <ChevronRight color="#CBD5E1" size={18} />
                                </View>
                            </View>

                            {/* Progress Bar inside the card */}
                            <View className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <View
                                    className={`h-full ${isCompleted ? 'bg-green-500' : 'bg-amber-500'}`}
                                    style={{ width: `${progress * 100}%` }}
                                />
                            </View>
                        </TouchableOpacity>
                    );
                })}

                <View className="mt-6 mb-10 p-6 bg-blue-50/50 rounded-2xl flex-row items-center border border-blue-100/50 border-dashed">
                    <View className="bg-blue-100 p-2 rounded-full mr-4">
                        <Info color="#0b78ed" size={16} />
                    </View>
                    <Text className="text-blue-700/70 text-xs italic flex-1 leading-5">
                        Pastikan seluruh kategori terisi dengan data yang akurat guna mempercepat proses verifikasi.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}
