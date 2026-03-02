import React, { useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SidebarLayout } from '../components/Layout/SidebarLayout';
import { StatCard } from '../components/Dashboard/StatCard';
import { ClientCard } from '../components/Dashboard/ClientCard';
import { User, ClipboardList, CheckCircle, Info } from 'lucide-react-native';
import { useApplications } from '../hooks/useApplications';
import { useMySurveys, useSurveyControl, useSurveyTemplates } from '../hooks/useSurveys';
import { ApplicationSurvey } from '../../gen/survey/v1/survey_pb';
import { useAuth } from '../context/AuthContext';

interface DashboardScreenProps {
    onStartSurvey: (surveyId: string) => void;
}

// Map status to visual config dynamically
const getStatusConfig = (status: string) => {
    const s = status.toUpperCase();
    if (s.includes('SURVEY')) return { color: '#f59e0b', bg: 'bg-amber-500', border: 'border-amber-500', text: 'text-amber-600' };
    if (s.includes('INTAKE')) return { color: '#3b82f6', bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-600' };
    if (s.includes('COMMITTEE')) return { color: '#a855f7', bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-600' };
    if (s.includes('REJECT')) return { color: '#ef4444', bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-600' };
    if (s.includes('ANALYSIS')) return { color: '#6366f1', bg: 'bg-indigo-500', border: 'border-indigo-500', text: 'text-indigo-600' };
    if (s.includes('DONE') || s.includes('VERIFIED')) return { color: '#10b981', bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-emerald-600' };
    return { color: '#64748b', bg: 'bg-slate-500', border: 'border-slate-500', text: 'text-slate-600' };
};

export function DashboardScreen({ onStartSurvey }: DashboardScreenProps) {
    const { surveyorId } = useAuth();
    const { applications, loading: appLoading, error: appError, refetch: refetchApps } = useApplications();
    const { surveys, loading: surveyLoading, error: surveyError, refetch: refetchSurveys } = useMySurveys(surveyorId || '');
    const { startSurvey, assignSurvey, loading: actionLoading } = useSurveyControl();
    const { templates, loading: templatesLoading } = useSurveyTemplates();

    const loading = appLoading || surveyLoading || templatesLoading;

    // Derived: Group applications by status for better visibility
    const surveyNeeded = applications.filter(app => app.status === 'SURVEY' || app.status === 'INTAKE');

    const refetch = () => {
        refetchApps();
        refetchSurveys();
    };

    const handleAction = async (appId: string) => {
        let existingSurvey: ApplicationSurvey | null = surveys.find(s => s.applicationId === appId) || null;

        if (!existingSurvey) {
            const activeTemplates = templates.filter(t => t.active);
            const template = activeTemplates.length > 0 ? activeTemplates[0] : (templates.length > 0 ? templates[0] : null);

            if (!template) {
                const HARDCODED_PERSONAL_TEMPLATE = "0195d1d2-0001-7000-bb34-000000000001";
                existingSurvey = await assignSurvey(appId, HARDCODED_PERSONAL_TEMPLATE, "FIELD_SURVEY", surveyorId!, "Manual Assignment (System Fallback)");
            } else {
                existingSurvey = await assignSurvey(appId, template.id, "FIELD_SURVEY", surveyorId!, `Field Survey (${template.templateName})`);
            }
        }

        if (existingSurvey && existingSurvey.id) {
            await startSurvey(existingSurvey.id, surveyorId!);
            onStartSurvey(existingSurvey.id);
        }
        refetch();
    };

    return (
        <SidebarLayout headerTitle="Dashboard Surveyor">
            <ScrollView
                className="flex-1 bg-slate-50"
                contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor="#3b82f6" />}
            >
                {/* Modern Hero Section */}
                <View className="mb-8">
                    <Text className="text-slate-400 text-xs font-bold uppercase tracking-[3px] mb-2">Selamat Datang</Text>
                    <Text className="text-dark text-4xl font-black leading-tight italic">Survey & Verifikasi</Text>
                    <View className="h-1.5 w-16 bg-primary mt-2 rounded-full" />
                </View>

                {/* Quick Status Stats */}
                <View className="flex-row gap-4 mb-4">
                    <View className="flex-1 bg-blue-600 p-6 rounded-[32px] shadow-lg shadow-blue-200">
                        <Text className="text-white/70 text-[10px] font-black uppercase tracking-wider mb-1">Assignment</Text>
                        <Text className="text-white text-3xl font-black">{applications.length}</Text>
                        <View className="absolute bottom-4 right-4 bg-white/20 p-2 rounded-full">
                            <User color="#fff" size={20} />
                        </View>
                    </View>
                    <View className="flex-1 bg-emerald-500 p-6 rounded-[32px] shadow-lg shadow-emerald-200">
                        <Text className="text-white/70 text-[10px] font-black uppercase tracking-wider mb-1">Selesai</Text>
                        <Text className="text-white text-3xl font-black">{surveys.filter(s => s.status === 'SUBMITTED' || s.status === 'VERIFIED').length}</Text>
                        <View className="absolute bottom-4 right-4 bg-white/20 p-2 rounded-full">
                            <CheckCircle color="#fff" size={20} />
                        </View>
                    </View>
                </View>

                {(appError || surveyError) && (
                    <View className="bg-rose-50 p-4 rounded-2xl mb-6 border border-rose-100 flex-row items-center">
                        <Info color="#e11d48" size={20} />
                        <Text className="text-rose-600 font-bold text-xs ml-3">Sinkronisasi data tertunda. Cek koneksi Anda.</Text>
                    </View>
                )}

                <View className="flex-row items-center justify-between mb-6">
                    <View>
                        <Text className="text-dark text-xl font-black">List Nasabah</Text>
                        <Text className="text-slate-400 font-medium text-xs">Ketuk kartu untuk memulai survey</Text>
                    </View>
                    {actionLoading && <ActivityIndicator size="small" color="#3b82f6" />}
                </View>

                {applications.length === 0 && !loading && (
                    <View className="bg-white p-12 rounded-[40px] items-center shadow-sm border border-slate-100 mt-4">
                        <ClipboardList color="#E2E8F0" size={80} />
                        <Text className="text-slate-500 mt-6 text-center font-bold text-xl">Kotak Masuk Kosong</Text>
                        <Text className="text-slate-400 text-xs text-center mt-2 leading-5">Belum ada penugasan baru untuk wilayah Anda hari ini.</Text>
                    </View>
                )}

                {applications.map((app) => {
                    const survey = surveys.find(s => s.applicationId === app.id);
                    const isUrgent = app.status === 'SURVEY';
                    return (
                        <ClientCard
                            key={app.id}
                            name={app.applicantName || 'Nasabah #' + app.id.substring(0, 5)}
                            status={app.status || 'PENDING'}
                            activeStatus={survey ? survey.status : 'PENDING'}
                            idApp={app.id.substring(0, 8)}
                            amount={app.loanAmount ? `Rp ${Number(app.loanAmount).toLocaleString('id-ID')}` : '-'}
                            address={survey?.surveyPurpose || 'Menunggu verifikasi lapangan'}
                            onPressStart={() => handleAction(app.id)}
                        />
                    );
                })}
            </ScrollView>
        </SidebarLayout>
    );
}
