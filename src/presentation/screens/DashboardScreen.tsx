import React, { useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SidebarLayout } from '../components/Layout/SidebarLayout';
import { StatCard } from '../components/Dashboard/StatCard';
import { ClientCard } from '../components/Dashboard/ClientCard';
import { User, ClipboardList, Clock } from 'lucide-react-native';
import { useApplications } from '../hooks/useApplications';
import { useMySurveys, useSurveyControl } from '../hooks/useSurveys';

// Mocked logged in user ID from seed data
const LOGGED_IN_SURVEYOR_ID = '0195c1c2-0001-7000-bb34-000000000001';

interface DashboardScreenProps {
    onStartSurvey: (surveyId: string) => void;
}

export function DashboardScreen({ onStartSurvey }: DashboardScreenProps) {
    // Currently fetching applications to show as "Daftar Nasabah"
    const { applications, loading: appLoading, error: appError, refetch: refetchApps } = useApplications();

    // We still need survey info to know if a survey is in progress
    const { surveys, loading: surveyLoading, error: surveyError, refetch: refetchSurveys } = useMySurveys(LOGGED_IN_SURVEYOR_ID);
    const { startSurvey } = useSurveyControl();

    const loading = appLoading || surveyLoading;

    // Filter applications that are relevant for survey (e.g. status containing 'SURVEY' or just all for now)
    const displayApplications = useMemo(() => {
        return applications;
    }, [applications]);

    const stats = useMemo(() => {
        return {
            total: applications.length,
            active: surveys.filter(s => s.status === 'IN_PROGRESS').length,
            completed: surveys.filter(s => s.status === 'SUBMITTED' || s.status === 'VERIFIED').length
        };
    }, [applications, surveys]);

    const refetch = () => {
        refetchApps();
        refetchSurveys();
    };

    const handleAction = async (appId: string) => {
        // Find if there's already a survey for this application
        const existingSurvey = surveys.find(s => s.applicationId === appId);

        if (existingSurvey) {
            console.log('Starting existing survey:', existingSurvey.id);
            await startSurvey(existingSurvey.id, LOGGED_IN_SURVEYOR_ID);
            onStartSurvey(existingSurvey.id); // Navigate to survey screen
        } else {
            console.log('No survey found for application:', appId);
            // In a real app, maybe assignSurvey first then navigate
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

                <View className="flex-row flex-wrap justify-between">
                    <View style={{ width: '48%' }}>
                        <StatCard
                            title="Total Nasabah"
                            value={stats.total}
                            icon={<User color="#0b78ed" size={20} />}
                        />
                    </View>
                    <View style={{ width: '48%' }}>
                        <StatCard
                            title="Survey Aktif"
                            value={stats.active}
                            icon={<Clock color="#e6a419" size={20} />}
                        />
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
