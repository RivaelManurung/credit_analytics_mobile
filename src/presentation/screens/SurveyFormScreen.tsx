import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Camera, CheckCircle, Info, ArrowLeft, ArrowRight, ClipboardList, CheckCircle2 } from 'lucide-react-native';
import { useSurvey, useSurveyControl, useSurveyTemplate } from '../hooks/useSurveys';
import { SidebarLayout } from '../components/Layout/SidebarLayout';
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
    const { submitSurvey, submitSurveyAnswer, loading: actionLoading } = useSurveyControl();

    // Navigation state
    const [currentSection, setCurrentSection] = useState<any | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [isSaving, setIsSaving] = useState(false);

    const handleAnswerChange = async (questionId: string, value: any, type: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));

        // Auto-save to backend
        try {
            setIsSaving(true);
            const answerPayload: any = {};
            if (type === 'NUMBER') answerPayload.number = value.toString();
            else if (type === 'BOOLEAN') answerPayload.boolean = !!value;
            else if (type === 'DATE') answerPayload.date = value;
            else answerPayload.text = value.toString();

            await submitSurveyAnswer(surveyId, questionId, answerPayload);
        } catch (err) {
            console.warn('Failed to auto-save answer:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSectionSelect = (section: any) => {
        setCurrentSection(section);
        setCurrentQuestionIndex(0);
    };

    const handleNextQuestion = () => {
        if (!currentSection) return;
        if (currentQuestionIndex < currentSection.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
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

    const handleSubmitSurvey = async () => {
        const result = await submitSurvey(surveyId, surveyorId!);
        if (result) {
            Alert.alert('Berhasil', 'Survey telah selesai dan dikirim.', [{ text: 'OK', onPress: onBack }]);
        }
    };

    if (surveyLoading || templateLoading) {
        return (
            <View className="flex-1 bg-slate-50 justify-center items-center">
                <ActivityIndicator size="large" color="#0b78ed" />
                <Text className="mt-4 text-slate-500 font-medium tracking-tight">Menyiapkan Form Survey...</Text>
            </View>
        );
    }

    if (surveyError || templateError || !survey) {
        return (
            <SidebarLayout headerTitle="Error">
                <View className="flex-1 bg-slate-50 justify-center items-center p-8">
                    <View className="bg-red-50 p-6 rounded-3xl items-center border border-red-100 mb-6">
                        <Info color="#ef4444" size={48} />
                        <Text className="text-red-600 text-lg font-bold mt-4 text-center">Gagal Memuat Survey</Text>
                        <Text className="text-red-400 text-sm text-center mt-2">{surveyError?.message || templateError?.message}</Text>
                    </View>
                    <TouchableOpacity onPress={onBack} className="bg-dark px-10 py-4 rounded-2xl shadow-lg">
                        <Text className="text-white font-bold text-lg">Kembali ke Dashboard</Text>
                    </TouchableOpacity>
                </View>
            </SidebarLayout>
        );
    }

    // Render Section List (The "Entry" Screen for a Survey)
    if (!currentSection) {
        return (
            <View className="flex-1 bg-slate-50">
                <View className="bg-primary px-8 pb-12 shadow-2xl rounded-b-[50px]" style={{ paddingTop: insets.top + 10 }}>
                    <TouchableOpacity onPress={onBack} className="bg-white/20 w-12 h-12 items-center justify-center rounded-2xl mb-8">
                        <ArrowLeft color="#fff" size={24} />
                    </TouchableOpacity>

                    <Text className="text-white/70 text-sm font-bold uppercase tracking-widest mb-2">Assignmnt Verifikasi</Text>
                    <Text className="text-white text-3xl font-bold mb-2">{survey.applicantName}</Text>
                    <View className="flex-row items-center">
                        <View className="bg-white/20 px-3 py-1 rounded-full mr-2">
                            <Text className="text-white text-[10px] font-bold">ID: {surveyId.substring(0, 8).toUpperCase()}</Text>
                        </View>
                        <Text className="text-white/60 text-xs italic">Template: {template?.templateName || 'Form Standard'}</Text>
                    </View>
                </View>

                <ScrollView className="flex-1 -mt-8 px-6" showsVerticalScrollIndicator={false}>
                    <View className="flex-row items-center justify-between mb-4 px-2">
                        <Text className="text-dark text-xl font-bold">Daftar Bagian</Text>
                        <View className="bg-blue-100 px-3 py-1 rounded-full">
                            <Text className="text-primary text-[10px] font-bold">{template?.sections.length || 0} BAGIAN</Text>
                        </View>
                    </View>

                    {template?.sections.map((section: any, idx: number) => {
                        const totalQs = section.questions?.length || 0;
                        const answered = section.questions?.filter((q: any) => !!answers[q.id]).length || 0;
                        const isDone = totalQs > 0 && answered === totalQs;

                        return (
                            <TouchableOpacity
                                key={section.id}
                                activeOpacity={0.8}
                                onPress={() => handleSectionSelect(section)}
                                className="bg-white p-6 rounded-[32px] mb-5 shadow-sm border border-slate-100 flex-row items-center"
                            >
                                <View className={`w-14 h-14 rounded-2xl items-center justify-center mr-5 ${isDone ? 'bg-emerald-50' : 'bg-blue-50'}`}>
                                    {isDone ? <CheckCircle2 color="#10b981" size={28} /> : <ClipboardList color="#3b82f6" size={28} />}
                                </View>
                                <View className="flex-1">
                                    <View className="flex-row justify-between mb-1">
                                        <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Bagian {idx + 1}</Text>
                                        <Text className={`text-[10px] font-bold ${isDone ? 'text-emerald-500' : 'text-primary'}`}>{answered}/{totalQs} Selesai</Text>
                                    </View>
                                    <Text className="text-dark font-bold text-lg leading-tight">{section.sectionName}</Text>

                                    {/* Small Progress Dot indicator */}
                                    <View className="flex-row mt-2">
                                        {Array.from({ length: totalQs }).map((_, i) => (
                                            <View
                                                key={i}
                                                className={`h-1 rounded-full mr-1 ${i < answered ? (isDone ? 'bg-emerald-500' : 'bg-primary') : 'bg-slate-100'}`}
                                                style={{ width: (100 / (totalQs || 1)) - 4 }}
                                            />
                                        ))}
                                    </View>
                                </View>
                                <ChevronLeft color="#CBD5E1" size={20} className="rotate-180 ml-2" />
                            </TouchableOpacity>
                        );
                    })}
                    <View className="h-32" />
                </ScrollView>

                <View className="absolute bottom-0 left-0 right-0 p-8 bg-white/95 border-t border-slate-100 shadow-2xl">
                    <TouchableOpacity
                        onPress={handleSubmitSurvey}
                        disabled={actionLoading}
                        className={`bg-dark h-16 rounded-2xl flex-row items-center justify-center shadow-xl ${actionLoading ? 'opacity-50' : ''}`}
                    >
                        {actionLoading ? <ActivityIndicator color="#fff" /> : (
                            <>
                                <CheckCircle color="#fff" size={20} />
                                <Text className="text-white font-bold text-lg ml-3">Finalisasi Survey</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Question View
    const question = currentSection.questions[currentQuestionIndex];
    const totalQuestions = currentSection.questions.length;
    const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

    return (
        <View className="flex-1 bg-white">
            {/* Sequential Header */}
            <View className="bg-slate-50 px-8 pb-8 border-b border-slate-100" style={{ paddingTop: insets.top + 10 }}>
                <View className="flex-row items-center justify-between mb-8">
                    <TouchableOpacity onPress={() => setCurrentSection(null)} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                        <ArrowLeft color="#1E293B" size={20} />
                    </TouchableOpacity>
                    <View className="items-center">
                        <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">{currentSection.sectionName}</Text>
                        <Text className="text-dark font-black text-sm">PERTANYAAN {currentQuestionIndex + 1} / {totalQuestions}</Text>
                    </View>
                    <View className="w-12 h-12 items-center justify-center">
                        {isSaving && <ActivityIndicator size="small" color="#3b82f6" />}
                    </View>
                </View>

                {/* Modern Progress Bar */}
                <View className="h-3 bg-slate-200 rounded-full overflow-hidden">
                    <View className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                </View>
            </View>

            <ScrollView className="flex-1 px-8" contentContainerStyle={{ paddingVertical: 40 }}>
                <View className="mb-10">
                    <View className="bg-blue-50 w-14 h-14 rounded-2xl items-center justify-center mb-6 border border-blue-100 shadow-sm">
                        <Text className="text-primary font-black text-xl">{currentQuestionIndex + 1}</Text>
                    </View>

                    <Text className="text-dark text-3xl font-black mb-10 leading-[42px]">
                        {question.questionText}
                        {question.isRequired && <Text className="text-red-500"> *</Text>}
                    </Text>

                    {/* DYNAMIC INPUTS BASED ON SEED TYPES */}
                    {question.answerType === 'BOOLEAN' ? (
                        <View className="flex-row justify-between">
                            {[{ v: true, l: 'YA', c: 'bg-emerald-500' }, { v: false, l: 'TIDAK', c: 'bg-red-500' }].map((opt) => {
                                const active = answers[question.id] === opt.v;
                                return (
                                    <TouchableOpacity
                                        key={opt.l}
                                        onPress={() => handleAnswerChange(question.id, opt.v, 'BOOLEAN')}
                                        className={`flex-1 h-20 rounded-3xl mx-2 items-center justify-center border-4 ${active ? (opt.v ? 'border-emerald-200 bg-emerald-500' : 'border-red-200 bg-red-500') : 'border-slate-50 bg-slate-50'}`}
                                    >
                                        <Text className={`font-black text-xl ${active ? 'text-white' : 'text-slate-400'}`}>{opt.l}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ) : question.answerType === 'SELECT' || (question.options && question.options.length > 0) ? (
                        <View className="gap-y-4">
                            {question.options?.map((opt: any) => {
                                const active = answers[question.id] === opt.optionValue;
                                return (
                                    <TouchableOpacity
                                        key={opt.id}
                                        onPress={() => handleAnswerChange(question.id, opt.optionValue, 'TEXT')}
                                        className={`p-6 rounded-3xl border-2 flex-row items-center justify-between ${active ? 'bg-blue-50 border-primary' : 'bg-slate-50 border-slate-50'}`}
                                    >
                                        <Text className={`text-lg font-bold flex-1 ${active ? 'text-primary' : 'text-slate-600'}`}>{opt.optionLabel}</Text>
                                        {active && <CheckCircle2 color="#3b82f6" size={24} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ) : (
                        <TextInput
                            className="bg-slate-50 border-2 border-slate-50 rounded-3xl p-8 text-dark text-xl min-h-[160px] focus:border-primary/20 focus:bg-white"
                            placeholder="Ketik jawaban di sini..."
                            placeholderTextColor="#94A3B8"
                            multiline
                            textAlignVertical="top"
                            keyboardType={question.answerType === 'NUMBER' ? 'numeric' : 'default'}
                            value={answers[question.id] || ''}
                            onChangeText={(t) => handleAnswerChange(question.id, t, question.answerType)}
                            onBlur={() => handleAnswerChange(question.id, answers[question.id] || '', question.answerType)}
                        />
                    )}
                </View>
            </ScrollView>

            <View className="p-8 flex-row items-center border-t border-slate-100 bg-white">
                <TouchableOpacity
                    onPress={handlePrevQuestion}
                    className="h-20 w-20 rounded-[30px] border-2 border-slate-100 items-center justify-center mr-4"
                >
                    <ArrowLeft color="#64748B" size={24} />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleNextQuestion}
                    activeOpacity={0.8}
                    className="flex-1 bg-dark h-20 rounded-[30px] flex-row items-center justify-center shadow-xl shadow-dark/30"
                >
                    <Text className="text-white font-black text-lg mr-3">
                        {currentQuestionIndex === totalQuestions - 1 ? 'SELESAI BAGIAN' : 'SELANJUTNYA'}
                    </Text>
                    <ArrowRight color="#fff" size={20} />
                </TouchableOpacity>
            </View>
        </View>
    );
}
