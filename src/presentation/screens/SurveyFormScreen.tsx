import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, CheckCircle, Info, ArrowLeft, ArrowRight, ClipboardList, CheckCircle2 } from 'lucide-react-native';
import { useSurvey, useSurveyControl, useSurveyTemplate, useSurveySections } from '../hooks/useSurveys';
import { SidebarLayout } from '../components/Layout/SidebarLayout';
import { useAuth } from '../context/AuthContext';

interface SurveyFormScreenProps {
    surveyId: string;
    onBack: () => void;
}

export function SurveyFormScreen({ surveyId, onBack }: SurveyFormScreenProps) {
    const insets = useSafeAreaInsets();
    const { surveyorId } = useAuth();

    const surveyQuery = useSurvey(surveyId);
    const survey = surveyQuery.data;
    const templateQuery = useSurveyTemplate(survey?.templateId || '');
    const template = templateQuery.data;
    const sectionsQuery = useSurveySections(survey?.templateId || '');
    const sections = sectionsQuery.data || [];

    const { submitSurvey, submitSurveyAnswer, loading: actionLoading } = useSurveyControl();

    const [currentSection, setCurrentSection] = useState<any | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [isSaving, setIsSaving] = useState(false);

    const sectionsLoading = surveyQuery.isLoading || templateQuery.isLoading || sectionsQuery.isLoading;

    useEffect(() => {
        const backAction = () => {
            if (currentSection) {
                setCurrentSection(null);
                return true;
            }
            onBack();
            return true;
        };
        const subscription = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => {
            if (subscription?.remove) subscription.remove();
            else (BackHandler as any).removeEventListener?.('hardwareBackPress', backAction);
        };
    }, [currentSection, onBack]);

    const handleAnswerChange = async (questionId: string, value: any, type: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
        try {
            setIsSaving(true);
            const payload: any = {};
            if (type === 'NUMBER') payload.number = value.toString();
            else if (type === 'BOOLEAN') payload.boolean = !!value;
            else if (type === 'DATE') payload.date = value;
            else payload.text = value.toString();
            await submitSurveyAnswer(surveyId, questionId, payload);
        } catch (err) {
            console.warn(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleNext = () => {
        if (!currentSection) return;
        if (currentQuestionIndex < currentSection.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            setCurrentSection(null);
        }
    };

    const handleSubmit = async () => {
        if (await submitSurvey(surveyId, surveyorId!)) {
            Alert.alert('Berhasil', 'Survey telah dikirim.', [{ text: 'OK', onPress: onBack }]);
        }
    };

    if (sectionsLoading) {
        return (
            <View className="flex-1 bg-slate-50 justify-center items-center">
                <ActivityIndicator size="large" color="#0b78ed" />
                <Text className="mt-4 text-slate-500 font-medium">Memuat Form...</Text>
            </View>
        );
    }

    if (!survey) return null;

    const renderSectionList = () => {
        const displaySections = sections.length > 0 ? sections : (template?.sections || []);
        return (
            <View className="flex-1 bg-slate-50">
                <View className="bg-primary px-8 pb-12 shadow-2xl rounded-b-[50px]" style={{ paddingTop: insets.top + 10 }}>
                    <TouchableOpacity onPress={onBack} className="bg-white/20 w-12 h-12 items-center justify-center rounded-2xl mb-8">
                        <ArrowLeft color="#fff" size={24} />
                    </TouchableOpacity>
                    <Text className="text-white/70 text-sm font-bold uppercase tracking-widest mb-2">Verifikasi Lapangan</Text>
                    <Text className="text-white text-3xl font-bold mb-2">{survey.applicantName}</Text>
                    <View className="flex-row items-center">
                        <View className="bg-white/20 px-3 py-1 rounded-full mr-2">
                            <Text className="text-white text-[10px] font-bold">ID: {surveyId.substring(0, 8).toUpperCase()}</Text>
                        </View>
                        <Text className="text-white/60 text-xs italic">{template?.templateName}</Text>
                    </View>
                </View>

                <ScrollView className="flex-1 -mt-8 px-6" showsVerticalScrollIndicator={false}>
                    <View className="flex-row items-center justify-between mb-4 px-2">
                        <Text className="text-dark text-xl font-bold">Daftar Bagian</Text>
                        <View className="bg-blue-100 px-3 py-1 rounded-full">
                            <Text className="text-primary text-[10px] font-bold">{displaySections.length} ITEM</Text>
                        </View>
                    </View>

                    {displaySections.map((section: any, idx: number) => {
                        const totalQs = section.questions?.length || 0;
                        const answered = section.questions?.filter((q: any) => !!answers[q.id]).length || 0;
                        const isDone = totalQs > 0 && answered === totalQs;
                        return (
                            <TouchableOpacity
                                key={section.id}
                                onPress={() => { setCurrentSection(section); setCurrentQuestionIndex(0); }}
                                className="bg-white p-6 rounded-[32px] mb-5 shadow-sm border border-slate-100 flex-row items-center"
                            >
                                <View className={`w-14 h-14 rounded-2xl items-center justify-center mr-5 ${isDone ? 'bg-emerald-50' : 'bg-blue-50'}`}>
                                    {isDone ? <CheckCircle2 color="#10b981" size={28} /> : <ClipboardList color="#3b82f6" size={28} />}
                                </View>
                                <View className="flex-1">
                                    <View className="flex-row justify-between mb-1">
                                        <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Bagian {idx + 1}</Text>
                                        <Text className={`text-[10px] font-bold ${isDone ? 'text-emerald-500' : 'text-primary'}`}>{answered}/{totalQs}</Text>
                                    </View>
                                    <Text className="text-dark font-bold text-lg">{section.sectionName}</Text>
                                </View>
                                <ChevronLeft color="#CBD5E1" size={20} className="rotate-180" />
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                <View className="p-8 bg-white/95 border-t border-slate-100">
                    <TouchableOpacity onPress={handleSubmit} className="bg-dark h-16 rounded-2xl flex-row items-center justify-center">
                        {actionLoading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">Finalisasi Survey</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderQuestionView = () => {
        const question = currentSection.questions[currentQuestionIndex];
        const total = currentSection.questions.length;
        const progress = ((currentQuestionIndex + 1) / total) * 100;
        return (
            <View className="flex-1 bg-white">
                <View className="bg-slate-50 px-8 pb-8 border-b border-slate-100" style={{ paddingTop: insets.top + 10 }}>
                    <View className="flex-row items-center justify-between mb-8">
                        <TouchableOpacity onPress={() => setCurrentSection(null)} className="p-3 bg-white rounded-2xl border border-slate-100">
                            <ArrowLeft color="#1E293B" size={20} />
                        </TouchableOpacity>
                        <View className="items-center">
                            <Text className="text-dark font-black text-sm">{currentQuestionIndex + 1} / {total}</Text>
                        </View>
                        {isSaving ? <ActivityIndicator size="small" color="#3b82f6" /> : <View className="w-5" />}
                    </View>
                    <View className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <View className="h-full bg-primary" style={{ width: `${progress}%` }} />
                    </View>
                </View>

                <ScrollView className="flex-1 px-8 py-10">
                    <Text className="text-dark text-2xl font-black mb-8 leading-[38px]">{question.questionText}</Text>
                    {question.answerType === 'BOOLEAN' ? (
                        <View className="flex-row gap-x-4">
                            {[true, false].map((v) => (
                                <TouchableOpacity
                                    key={v.toString()}
                                    onPress={() => handleAnswerChange(question.id, v, 'BOOLEAN')}
                                    className={`flex-1 h-20 rounded-3xl items-center justify-center ${answers[question.id] === v ? (v ? 'bg-emerald-500' : 'bg-rose-500') : 'bg-slate-50'}`}
                                >
                                    <Text className={`font-black uppercase ${answers[question.id] === v ? 'text-white' : 'text-slate-400'}`}>{v ? 'Ya' : 'Tidak'}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : question.options?.length > 0 ? (
                        <View className="gap-y-4">
                            {question.options.map((opt: any) => (
                                <TouchableOpacity
                                    key={opt.id}
                                    onPress={() => handleAnswerChange(question.id, opt.optionValue, 'TEXT')}
                                    className={`p-6 rounded-3xl border-2 ${answers[question.id] === opt.optionValue ? 'border-primary bg-blue-50' : 'border-slate-50 bg-slate-50'}`}
                                >
                                    <Text className="font-bold">{opt.optionLabel}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <TextInput
                            className="bg-slate-50 rounded-3xl p-8 text-xl min-h-[150px]"
                            placeholder="Jawaban..."
                            multiline
                            value={answers[question.id] || ''}
                            onChangeText={(t) => handleAnswerChange(question.id, t, question.answerType)}
                        />
                    )}
                </ScrollView>

                <View className="p-8 flex-row border-t border-slate-100 bg-white">
                    <TouchableOpacity onPress={() => currentQuestionIndex > 0 ? setCurrentQuestionIndex(v => v - 1) : setCurrentSection(null)} className="h-16 w-16 rounded-2xl border border-slate-100 items-center justify-center mr-4">
                        <ArrowLeft color="#64748B" size={24} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleNext} className="flex-1 bg-dark h-16 rounded-2xl items-center justify-center">
                        <Text className="text-white font-bold">{currentQuestionIndex === total - 1 ? 'SELESAI' : 'LANJUT'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return currentSection ? renderQuestionView() : renderSectionList();
}
