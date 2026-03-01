import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Camera, CheckCircle, Info, ArrowLeft, ArrowRight, ClipboardList, CheckCircle2 } from 'lucide-react-native';
import { useSurvey, useSurveyControl, useSurveyTemplate } from '../hooks/useSurveys';
import { useAuth } from '../context/AuthContext';
import { SurveySectionModel, SurveyQuestionModel } from '../../domain/models/SurveyModel';

interface SurveyFormScreenProps {
    surveyId: string;
    onBack: () => void;
}

export function SurveyFormScreen({ surveyId, onBack }: SurveyFormScreenProps) {
    const insets = useSafeAreaInsets();
    const { surveyorId } = useAuth();
    const { survey, loading: surveyLoading, error: surveyError } = useSurvey(surveyId);
    const { template, loading: templateLoading, error: templateError } = useSurveyTemplate(survey?.templateId || '');
    const { submitSurvey, loading: submitting } = useSurveyControl();

    // Navigation state
    const [currentSection, setCurrentSection] = useState<any | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});

    const handleAnswerChange = (id: string, text: string) => {
        setAnswers(prev => ({ ...prev, [id]: text }));
    };

    const handleSectionSelect = (section: SurveySectionModel) => {
        setCurrentSection(section);
        setCurrentQuestionIndex(0);
    };

    const handleNextQuestion = () => {
        if (!currentSection) return;
        if (currentQuestionIndex < currentSection.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            // Done with this section
            setCurrentSection(null);
        }
    };

    const handlePrevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        } else {
            setCurrentSection(null);
        }
    };

    const handleSubmit = async () => {
        // Validation check for all required questions in all sections
        const allQuestions = template?.sections.flatMap(s => s.questions) || [];
        const missingRequired = allQuestions.some(q => q.isRequired && !answers[q.id]);

        if (missingRequired) {
            Alert.alert('Peringatan', 'Harap isi semua pertanyaan wajib.');
            return;
        }

        const result = await submitSurvey(surveyId, surveyorId!);
        if (result) {
            Alert.alert('Berhasil', 'Survey telah dikirim.', [{ text: 'OK', onPress: onBack }]);
        }
    };

    const loading = surveyLoading || templateLoading;
    const error = surveyError || templateError;

    if (loading) {
        return (
            <View className="flex-1 bg-slate-50 justify-center items-center">
                <ActivityIndicator size="large" color="#0b78ed" />
                <Text className="mt-4 text-slate-500 font-medium">Memuat Form Survey...</Text>
            </View>
        );
    }

    if (error || !survey) {
        return (
            <View className="flex-1 bg-slate-50 justify-center items-center p-6">
                <Text className="text-red-500 text-center mb-4">Gagal memuat data survey: {error?.message}</Text>
                <TouchableOpacity onPress={onBack} className="bg-primary px-6 py-3 rounded-xl">
                    <Text className="text-white font-bold">Kembali</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Render Section List
    if (!currentSection) {
        return (
            <View className="flex-1 bg-slate-50">
                <View className="bg-primary px-6 pb-10 shadow-lg rounded-b-[40px]" style={{ paddingTop: insets.top + 10 }}>
                    <View className="flex-row items-center mb-6">
                        <TouchableOpacity onPress={onBack} className="bg-white/20 p-2 rounded-xl">
                            <ChevronLeft color="#fff" size={24} />
                        </TouchableOpacity>
                        <Text className="text-white text-xl font-bold ml-4">Mulai Survey</Text>
                    </View>

                    <View className="bg-white/10 p-5 rounded-3xl border border-white/20">
                        <Text className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Debitur</Text>
                        <Text className="text-white text-xl font-bold mb-1">{survey.applicantName}</Text>
                        <Text className="text-white/80 text-sm">Template: {template?.templateName || 'Standard Survey'}</Text>
                    </View>
                </View>

                <ScrollView className="flex-1 -mt-6 px-6" showsVerticalScrollIndicator={false}>
                    <Text className="text-slate-800 text-lg font-bold mb-4 mt-2">Daftar Bagian Survey</Text>

                    {template?.sections.map((section, idx) => {
                        const totalQuestions = section.questions?.length || 0;
                        const answeredCount = section.questions?.filter(q => !!answers[q.id]).length || 0;
                        const isDone = totalQuestions > 0 && answeredCount === totalQuestions;

                        return (
                            <TouchableOpacity
                                key={section.id}
                                onPress={() => handleSectionSelect(section)}
                                className="bg-white p-5 rounded-3xl mb-4 shadow-sm border border-slate-100 flex-row items-center"
                            >
                                <View className={`p-4 rounded-2xl mr-4 ${isDone ? 'bg-green-50' : 'bg-blue-50'}`}>
                                    {isDone ? <CheckCircle2 color="#22C55E" size={24} /> : <ClipboardList color="#3B82F6" size={24} />}
                                </View>
                                <View className="flex-1">
                                    <View className="flex-row justify-between items-center mb-1">
                                        <Text className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Bagian {idx + 1}</Text>
                                        <Text className={`text-xs font-bold ${isDone ? 'text-green-600' : 'text-blue-600'}`}>
                                            {answeredCount}/{totalQuestions} Soal
                                        </Text>
                                    </View>
                                    <Text className="text-slate-800 font-bold text-lg leading-tight">{section.sectionName}</Text>
                                </View>
                                <ChevronLeft color="#CBD5E1" size={20} className="rotate-180 ml-2" />
                            </TouchableOpacity>
                        );
                    })}

                    <View className="h-20" />
                </ScrollView>

                <View className="p-6 bg-white border-t border-slate-100 shadow-2xl">
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={submitting}
                        className={`bg-primary h-16 rounded-2xl flex-row items-center justify-center shadow-lg ${submitting ? 'opacity-70' : ''}`}
                    >
                        <CheckCircle color="#fff" size={22} />
                        <Text className="text-white font-bold text-lg ml-3">Selesaikan Survey</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Render Sequential Questions
    const question = currentSection.questions[currentQuestionIndex];
    const totalQuestions = currentSection.questions.length;
    const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

    return (
        <View className="flex-1 bg-white">
            {/* Sequential Header */}
            <View className="bg-slate-50 px-6 pb-6 border-b border-slate-100" style={{ paddingTop: insets.top + 10 }}>
                <View className="flex-row items-center justify-between mb-6">
                    <TouchableOpacity onPress={() => setCurrentSection(null)} className="p-2 -ml-2">
                        <ArrowLeft color="#1E293B" size={24} />
                    </TouchableOpacity>
                    <View className="items-center">
                        <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest">{currentSection.sectionName}</Text>
                        <Text className="text-slate-800 font-bold">Soal {currentQuestionIndex + 1} dari {totalQuestions}</Text>
                    </View>
                    <View className="w-10" />
                </View>

                {/* Progress Bar */}
                <View className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <View className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                </View>
            </View>

            <ScrollView className="flex-1 p-8" contentContainerStyle={{ flexGrow: 1 }}>
                <View className="flex-1 justify-center py-10">
                    <View className="bg-blue-50 w-12 h-12 rounded-2xl items-center justify-center mb-6">
                        <Text className="text-primary font-bold text-lg">{currentQuestionIndex + 1}</Text>
                    </View>

                    <Text className="text-slate-800 text-2xl font-bold mb-8 leading-tight">
                        {question.questionText}
                        {question.isRequired && <Text className="text-red-500"> *</Text>}
                    </Text>

                    {/* Simple implementation for now - can be expanded for other types */}
                    <TextInput
                        className="bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 text-slate-800 text-lg min-h-[150px] focus:border-primary/30"
                        placeholder="Ketik jawaban di sini..."
                        multiline
                        textAlignVertical="top"
                        value={answers[question.id] || ''}
                        onChangeText={(t) => handleAnswerChange(question.id, t)}
                    />
                </View>
            </ScrollView>

            {/* Sequential Footer */}
            <View className="p-6 flex-row items-center border-t border-slate-100 bg-white shadow-2xl">
                <TouchableOpacity
                    onPress={handlePrevQuestion}
                    className="h-16 w-16 rounded-2xl border-2 border-slate-100 items-center justify-center mr-4"
                >
                    <ArrowLeft color="#64748B" size={24} />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleNextQuestion}
                    className="flex-1 bg-primary h-16 rounded-2xl flex-row items-center justify-center shadow-lg"
                >
                    <Text className="text-white font-bold text-lg mr-2">
                        {currentQuestionIndex === totalQuestions - 1 ? 'Selesai Bagian Ini' : 'Selanjutnya'}
                    </Text>
                    <ArrowRight color="#fff" size={20} />
                </TouchableOpacity>
            </View>
        </View>
    );
}
