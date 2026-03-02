import React, { useMemo, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { SidebarLayout } from '../components/Layout/SidebarLayout';
import { User, ClipboardList, CheckCircle, Info, ChevronRight, Search } from 'lucide-react-native';
import { useApplications } from '../hooks/useApplications';
import { useMySurveys, useSurveyControl } from '../hooks/useSurveys';
import { useAuth } from '../context/AuthContext';
import { useAppNavigator } from '../context/NavigationContext';
import { ApplicationMapper } from '../utils/ApplicationMapper';

const { width } = Dimensions.get('window');

const STATUS_CONFIG: Record<string, any> = {
    // --- Survey Statuses ---
    IN_PROGRESS: { label: 'Sedang Berjalan', color: '#2563EB', bg: 'bg-blue-50', dot: 'bg-blue-600' },
    ASSIGNED: { label: 'Ditugaskan', color: '#D97706', bg: 'bg-amber-50', dot: 'bg-amber-600' },
    START: { label: 'Mulai', color: '#7C3AED', bg: 'bg-purple-50', dot: 'bg-purple-600' },
    SUBMITTED: { label: 'Dikirim', color: '#059669', bg: 'bg-emerald-50', dot: 'bg-emerald-600' },
    VERIFIED: { label: 'Terverifikasi', color: '#10B981', bg: 'bg-teal-50', dot: 'bg-teal-600' },

    // --- Application Statuses (Fallback) ---
    PENDING: { label: 'Menunggu', color: '#6B7280', bg: 'bg-slate-50', dot: 'bg-slate-400' },
    APPROVED: { label: 'Disetujui', color: '#10B981', bg: 'bg-emerald-50', dot: 'bg-emerald-600' },
    REJECTED: { label: 'Ditolak', color: '#e11d48', bg: 'bg-rose-50', dot: 'bg-rose-600' },
};

export function DashboardScreen() {
    const { surveyorId } = useAuth();
    const { navigate } = useAppNavigator();

    // Data Fetching
    const applicationsQuery = useApplications();
    const surveysQuery = useMySurveys(surveyorId || '');
    const { startSurvey, assignSurvey, loading: actionLoading } = useSurveyControl();

    // Data Processing
    const isLoading = applicationsQuery.isLoading || surveysQuery.isLoading;
    const applications = useMemo(() => applicationsQuery.data || [], [applicationsQuery.data]);
    const surveys = useMemo(() => surveysQuery.data || [], [surveysQuery.data]);
    const hasError = !!(applicationsQuery.error || surveysQuery.error);

    /**
     * Merge Applications with Survey status.
     * This makes the dashboard show all customers and their current survey state.
     */
    const customerList = useMemo(() => {
        return applications.map(app => {
            // Find the most relevant survey for this application
            const survey = surveys.find(s => s.applicationId === app.id);
            return {
                app,
                survey,
                display: ApplicationMapper.toDisplay(app)
            };
        }).sort((a, b) => {
            // Priority: In Progress > Start > Assigned > New > Submitted
            const order: Record<string, number> = {
                'IN_PROGRESS': 0,
                'START': 1,
                'ASSIGNED': 2,
                'NEW': 3,
                'SUBMITTED': 4,
                'VERIFIED': 5
            };
            const statusA = a.survey?.status || 'NEW';
            const statusB = b.survey?.status || 'NEW';
            return (order[statusA] ?? 99) - (order[statusB] ?? 99);
        });
    }, [applications, surveys]);

    const stats = useMemo(() => ({
        total: applications.length,
        active: surveys.filter(s => ['ASSIGNED', 'IN_PROGRESS', 'START'].includes(s.status)).length,
        completed: surveys.filter(s => ['SUBMITTED', 'VERIFIED'].includes(s.status)).length,
    }), [applications, surveys]);

    const onRefresh = useCallback(() => {
        applicationsQuery.refetch();
        surveysQuery.refetch();
    }, [applicationsQuery, surveysQuery]);

    const handleAction = async (item: any) => {
        if (!surveyorId) return;
        const { app, survey } = item;

        try {
            let activeSurvey = survey;

            // If no survey exists, create/assign one immediately (Admin behavior)
            if (!activeSurvey) {
                activeSurvey = await assignSurvey(
                    app.id,
                    '0195c1c2-1234-7000-8888-000000000001', // Example default template ID
                    'FIELD_SURVEY',
                    surveyorId,
                    'Survey Lapangan Langsung'
                );
            }

            if (activeSurvey.status === 'ASSIGNED') {
                await startSurvey(activeSurvey.id, surveyorId);
            }

            navigate('SurveyForm', { surveyId: activeSurvey.id });
        } catch (err) {
            console.error('[Dashboard] Action Error:', err);
        }
    };

    return (
        <SidebarLayout headerTitle="Dashboard Admin Surveyor">
            <ScrollView
                className="flex-1 bg-slate-50"
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#2563EB" />}
            >
                {/* Brand Header */}
                <View className="bg-white px-6 pt-4 pb-6 border-b border-slate-100 mb-6">
                    <View className="flex-row justify-between items-center">
                        <View>
                            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-[3px] mb-1">Internal App</Text>
                            <Text className="text-dark text-2xl font-black italic">Survey Portal</Text>
                        </View>
                    </View>
                </View>

                <View className="px-6">
                    {/* Stat Cards */}
                    <View className="flex-row gap-3 mb-8">
                        <PremiumStatCard label="Total Nasabah" value={stats.total} accentColor="#64748B" />
                        <PremiumStatCard label="Survey Aktif" value={stats.active} accentColor="#2563EB" />
                        <PremiumStatCard label="Selesai" value={stats.completed} accentColor="#059669" />
                    </View>

                    {/* Section Header */}
                    <View className="flex-row justify-between items-center mb-5">
                        <View>
                            <Text className="text-dark text-xl font-black">List Nasabah</Text>
                            <Text className="text-slate-400 font-bold text-[10px] mt-0.5 uppercase tracking-wider">Database Calon Nasabah</Text>
                        </View>
                        <Search color="#94A3B8" size={20} />
                    </View>

                    {/* Connectivity Error Warning */}
                    {hasError && <ErrorAlert message={applicationsQuery.error?.message || surveysQuery.error?.message} />}

                    {/* Customer List Rendering */}
                    {customerList.length === 0 && !isLoading ? (
                        <View className="bg-white p-12 rounded-3xl items-center border border-slate-100 mt-2">
                            <ClipboardList color="#E2E8F0" size={56} />
                            <Text className="text-slate-400 mt-5 text-center font-bold text-xs">Database Nasabah Kosong</Text>
                        </View>
                    ) : (
                        customerList.map((item) => (
                            <PremiumCustomerCard
                                key={item.app.id}
                                item={item}
                                onAction={() => handleAction(item)}
                            />
                        ))
                    )}
                </View>

                {actionLoading && (
                    <View className="mt-6 items-center">
                        <ActivityIndicator size="small" color="#2563EB" />
                        <Text className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">Memproses...</Text>
                    </View>
                )}
            </ScrollView>
        </SidebarLayout>
    );
}

// ─── Internal Components ───────────────────────────────────────────────────

function PremiumStatCard({ label, value, accentColor }: { label: string, value: number, accentColor: string }) {
    return (
        <View className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex-col gap-2">
            <View className="w-5 h-1 rounded-full" style={{ backgroundColor: accentColor }} />
            <View>
                <Text className="text-2xl font-black text-dark leading-7">{value}</Text>
                <Text className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mt-1">{label}</Text>
            </View>
        </View>
    );
}

function PremiumCustomerCard({ item, onAction }: { item: any, onAction: () => void }) {
    const { app, survey, display } = item;
    const statusKey = survey?.status || display.status || 'PENDING';
    const config = STATUS_CONFIG[statusKey] || {
        label: statusKey,
        color: '#6B7280',
        bg: 'bg-slate-50',
        dot: 'bg-slate-400'
    };
    const isCompleted = ['SUBMITTED', 'VERIFIED'].includes(statusKey);

    return (
        <View className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-3">
            <View className="flex-row justify-between items-start mb-4">
                <View className="flex-row items-center flex-1 pr-2">
                    <View className="w-10 h-10 rounded-xl bg-slate-50 items-center justify-center border border-slate-100">
                        <Text className="text-slate-600 font-black text-base">{display.applicantName.charAt(0)}</Text>
                    </View>
                    <View className="ml-3 flex-1">
                        <Text className="text-dark font-bold text-[14px]" numberOfLines={1}>{display.applicantName}</Text>
                        <Text className="text-slate-400 font-medium text-[10px] tracking-wider mt-0.5 uppercase">
                            #{display.displayId}
                        </Text>
                    </View>
                </View>
                <View className={`flex-row items-center px-2.5 py-1 rounded-full ${config.bg}`}>
                    <View className={`w-1.5 h-1.5 rounded-full ${config.dot} mr-2`} />
                    <Text className="text-[10px] font-black tracking-tight uppercase" style={{ color: config.color }}>
                        {config.label}
                    </Text>
                </View>
            </View>

            <View className="mb-4 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <View>
                    <Text className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Plafon Diajukan</Text>
                    <Text className="text-dark font-black text-[12px] mt-0.5">{display.amount}</Text>
                </View>
            </View>

            {!isCompleted ? (
                <TouchableOpacity
                    onPress={onAction}
                    className="w-full py-3.5 rounded-xl items-center shadow-lg shadow-blue-100"
                    style={{ backgroundColor: config.color === '#6B7280' ? '#2563EB' : config.color }}
                >
                    <Text className="text-white font-black text-[11px] uppercase tracking-widest">
                        {statusKey === 'IN_PROGRESS' ? 'Lanjutkan Survey →' :
                            !survey ? 'Mulai Survey →' :
                                statusKey === 'ASSIGNED' ? 'Terima & Mulai →' : 'Buka Survey →'}
                    </Text>
                </TouchableOpacity>
            ) : (
                <View className="bg-emerald-50 py-3 rounded-xl items-center border border-emerald-100">
                    <View className="flex-row items-center">
                        <CheckCircle size={14} color="#059669" />
                        <Text className="text-emerald-600 font-black text-[11px] uppercase tracking-widest ml-2">Survey Selesai</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

function ErrorAlert({ message }: { message?: string }) {
    return (
        <View className="bg-rose-50 p-4 rounded-2xl mb-4 border border-rose-100 flex-row items-center">
            <Info color="#e11d48" size={16} />
            <Text className="text-rose-600 font-bold text-[10px] ml-2 flex-1">
                Koneksi Bermasalah: {message || 'Data mungkin tidak akurat'}
            </Text>
        </View>
    );
}