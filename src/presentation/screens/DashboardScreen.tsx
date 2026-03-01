import React, { useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SidebarLayout } from '../components/Layout/SidebarLayout';
import { StatCard } from '../components/Dashboard/StatCard';
import { ClientCard } from '../components/Dashboard/ClientCard';
import { User, ClipboardList, Clock } from 'lucide-react-native';
import { useApplications } from '../hooks/useApplications';
import { useMySurveys, useSurveyControl } from '../hooks/useSurveys';
import { ApplicationSurvey } from '../../gen/survey/v1/survey_pb';
import { useAuth } from '../context/AuthContext';

interface DashboardScreenProps {
    onStartSurvey: (surveyId: string) => void;
}

export function DashboardScreen({ onStartSurvey }: DashboardScreenProps) {
    const { surveyorId } = useAuth();

    // Currently fetching applications to show as "Daftar Nasabah"
    const { applications, loading: appLoading, error: appError, refetch: refetchApps } = useApplications();

    // We still need survey info to know if a survey is in progress
    const { surveys, loading: surveyLoading, error: surveyError, refetch: refetchSurveys } = useMySurveys(surveyorId || '');
    const { startSurvey, assignSurvey } = useSurveyControl();

    const loading = appLoading || surveyLoading;

    // Filter applications that are relevant for survey (e.g. status containing 'SURVEY' or just all for now)
    const displayApplications = useMemo(() => {
        return applications;
    }, [applications]);

    const stats = useMemo(() => {
        const getStatusCount = (statusName: string) =>
            applications.filter(a => a.status?.toUpperCase().includes(statusName.toUpperCase())).length;

        return {
            total: applications.length,
            survey: getStatusCount('SURVEY'),
            intake: getStatusCount('INTAKE'),
            rejected: getStatusCount('REJECTED'),
            committee: getStatusCount('COMMITTE'),
        };
    }, [applications]);

    const refetch = () => {
        refetchApps();
        refetchSurveys();
    };

    const handleAction = async (appId: string) => {
        // Find if there's already a survey for this application
        let existingSurvey: ApplicationSurvey | null = surveys.find(s => s.applicationId === appId) || null;

        if (!existingSurvey) {
            console.log('No survey found for application:', appId, ', assigning one automatically.');
            // Auto assign a default survey to log in surveyor
            existingSurvey = await assignSurvey(appId, "SURVEY_STANDARD_001", "FIELD_SURVEY", surveyorId!, "Verifikasi Data Nasabah (Auto-assigned)");
        }

        if (existingSurvey) {
            console.log('Starting existing survey:', existingSurvey.id);
            await startSurvey(existingSurvey.id, surveyorId!);
            onStartSurvey(existingSurvey.id); // Navigate to survey screen
        } else {
            console.error('Failed to create or assign survey for application', appId);
        }
        refetch();
    };

    return (
        <SidebarLayout headerTitle="CA Mobile Survey">
            <ScrollView
                className="flex-1 bg-light"
                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={refetch} tintColor="#0b78ed" />
                }
            >
                <View className="mb-6">
                    <Text className="text-primary text-3xl font-bold">Dashboard</Text>
                    <Text className="text-secondary text-base">Daftar Nasabah Berjalan</Text>
                </View>

                {(appError || surveyError) && (
                    <View className="bg-red-50 p-4 rounded-xl mb-4 border border-red-100">
                        <Text className="text-red-600 font-medium">
                            Gagal memuat data: {appError || (surveyError ? "Error Survey" : "")}
                        </Text>
                    </View>
                )}

                <View className="mb-6">
                    <StatCard
                        title="Total Assignment"
                        value={stats.total}
                        icon={<User color="#0b78ed" size={24} />}
                    />
                    <View className="flex-row flex-wrap justify-between gap-y-3">
                        <View style={{ width: '48%' }}>
                            <View className="bg-white rounded-xl p-3 items-center shadow-sm border-b-4 border-amber-500">
                                <View className="flex-row items-center mb-1">
                                    <Text className="text-secondary text-[10px] font-bold">SURVEY</Text>
                                </View>
                                <Text className="text-amber-600 text-2xl font-bold">{stats.survey}</Text>
                            </View>
                        </View>
                        <View style={{ width: '48%' }}>
                            <View className="bg-white rounded-xl p-3 items-center shadow-sm border-b-4 border-blue-500">
                                <Text className="text-secondary text-[10px] font-bold mb-1">INTAKE</Text>
                                <Text className="text-blue-600 text-2xl font-bold">{stats.intake}</Text>
                            </View>
                        </View>
                        <View style={{ width: '48%' }}>
                            <View className="bg-white rounded-xl p-3 items-center shadow-sm border-b-4 border-purple-500">
                                <Text className="text-secondary text-[10px] font-bold mb-1">COMMITTEE</Text>
                                <Text className="text-purple-600 text-2xl font-bold">{stats.committee}</Text>
                            </View>
                        </View>
                        <View style={{ width: '48%' }}>
                            <View className="bg-white rounded-xl p-3 items-center shadow-sm border-b-4 border-red-500">
                                <Text className="text-secondary text-[10px] font-bold mb-1">REJECTED</Text>
                                <Text className="text-red-600 text-2xl font-bold">{stats.rejected}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View className="flex-row items-center justify-between mt-4 mb-4">
                    <Text className="text-dark text-xl font-bold">Nasabah Tersedia</Text>
                    {loading && <ActivityIndicator size="small" color="#0b78ed" />}
                </View>

                {displayApplications.length === 0 && !loading && !appError && (
                    <View className="bg-white p-10 rounded-2xl items-center shadow-sm">
                        <ClipboardList color="#CBD5E1" size={48} />
                        <Text className="text-slate-400 mt-4 text-center font-medium">Tidak ada nasabah untuk diproses</Text>
                    </View>
                )}

                {displayApplications.map((app) => {
                    const survey = surveys.find(s => s.applicationId === app.id);
                    return (
                        <ClientCard
                            key={app.id}
                            name={app.applicantName || 'Nasabah #' + app.id.substring(0, 5)}
                            status={app.status || 'PENDING'}
                            activeStatus={survey ? survey.status : 'PENDING'}
                            idApp={app.id.substring(0, 8)}
                            amount={app.loanAmount ? `Rp ${app.loanAmount}` : '-'}
                            address={survey?.surveyPurpose || 'Menunggu Survey'}
                            onPressStart={() => handleAction(app.id)}
                        />
                    );
                })}

            </ScrollView>
        </SidebarLayout>
    );
}
