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
    IN_PROGRESS: { label: 'In Progress', color: '#3b82f6', bg: 'bg-blue-50', dot: 'bg-blue-400' },
    ASSIGNED: { label: 'Assigned', color: '#f97316', bg: 'bg-orange-50/80', dot: 'bg-orange-400' },
    START: { label: 'Ready', color: '#a855f7', bg: 'bg-purple-50', dot: 'bg-purple-400' },
    SUBMITTED: { label: 'Submitted', color: '#10b981', bg: 'bg-emerald-50', dot: 'bg-emerald-400' },
    VERIFIED: { label: 'Verified', color: '#14b8a6', bg: 'bg-teal-50', dot: 'bg-teal-400' },

    // --- Application Statuses ---
    PENDING: { label: 'Pending', color: '#94a3b8', bg: 'bg-slate-50', dot: 'bg-slate-300' },
    APPROVED: { label: 'Approved', color: '#10b981', bg: 'bg-emerald-50', dot: 'bg-emerald-400' },
    REJECTED: { label: 'Rejected', color: '#ef4444', bg: 'bg-rose-50', dot: 'bg-rose-400' },
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

        // The default template ID we always use
        const DEFAULT_TEMPLATE_ID = '0195d1d2-0001-7000-bb34-000000000001';

        try {
            let activeSurvey = survey;

            // If no survey exists, create/assign one immediately
            if (!activeSurvey) {
                activeSurvey = await assignSurvey(
                    app.id,
                    DEFAULT_TEMPLATE_ID,
                    'FIELD_SURVEY',
                    surveyorId,
                    'Survey Lapangan Langsung'
                );
            }

            if (activeSurvey.status === 'ASSIGNED') {
                await startSurvey(activeSurvey.id, surveyorId);
            }

            // ALWAYS use DEFAULT_TEMPLATE_ID — the backend has a bug where
            // getSurvey returns applicationId in the templateId field.
            console.log(`[Dashboard] → SurveyForm: surveyId=${activeSurvey.id}`);
            navigate('SurveyForm', { surveyId: activeSurvey.id, templateId: DEFAULT_TEMPLATE_ID });
        } catch (err) {
            console.error('[Dashboard] Action Error:', err);
        }
    };

    return (
        <SidebarLayout headerTitle="Dashboard Surveyor">
            <ScrollView
                className="flex-1 bg-white"
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#2563eb" />}
            >
                {/* Brand Header */}
                <View className="bg-white px-6 py-6 border-b border-light mb-4">
                    <View className="flex-row justify-between items-center">
                        <View>
                            <Text className="text-secondary text-[10px] font-bold uppercase tracking-[2px] mb-0.5">INTERNAL SYSTEM</Text>
                            <Text className="text-dark text-3xl font-black">Survey <Text className="text-primary">Portal</Text></Text>
                        </View>
                    </View>
                </View>

                <View className="px-6">
                    {/* Stat Cards */}
                    <View className="flex-row gap-3 mb-6">
                        <PremiumStatCard label="Survey Aktif" value={stats.active} accentColor="#2563eb" />
                        <PremiumStatCard label="Selesai" value={stats.completed} accentColor="#059669" />
                        <PremiumStatCard label="Total" value={stats.total} accentColor="#94a3b8" />
                    </View>

                    {/* Section Header */}
                    <View className="flex-row justify-between items-end mb-4 pr-1">
                        <View>
                            <Text className="text-dark text-xl font-extrabold">List Nasabah</Text>
                            <Text className="text-secondary font-semibold text-[10px] mt-1 uppercase tracking-wider">Database Surveyor</Text>
                        </View>
                        <TouchableOpacity className="bg-white p-2.5 rounded-xl shadow-sm border border-light">
                            <Search color="#64748B" size={18} />
                        </TouchableOpacity>
                    </View>

                    {/* Connectivity Notice (Subtle) */}
                    {hasError && (
                        <View className="mb-4 flex-row items-center px-4 py-2 bg-slate-50 rounded-xl border border-light">
                            <View className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-3" />
                            <Text className="text-secondary text-[10px] font-bold uppercase tracking-wider">Sync in progress • Data is offline</Text>
                        </View>
                    )}

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
        <View className="flex-1 bg-white p-4 rounded-3xl border border-light shadow-sm flex-col gap-1.5">
            <View className="w-6 h-1 rounded-full" style={{ backgroundColor: accentColor }} />
            <View>
                <Text className="text-2xl font-black text-dark tracking-tight">{value}</Text>
                <Text className="text-[9px] text-secondary font-extrabold uppercase tracking-tight mt-0.5" numberOfLines={1}>{label}</Text>
            </View>
        </View>
    );
}

function PremiumCustomerCard({ item, onAction }: { item: any, onAction: () => void }) {
    const { app, survey, display } = item;
    const statusKey = survey?.status || display.status || 'PENDING';
    const config = STATUS_CONFIG[statusKey] || {
        label: statusKey,
        color: '#64748B',
        bg: 'bg-slate-50',
        dot: 'bg-slate-400'
    };
    const isCompleted = ['SUBMITTED', 'VERIFIED'].includes(statusKey);

    return (
        <View className="bg-white rounded-[28px] border border-light shadow-sm p-5 mb-4">
            <View className="flex-row justify-between items-start mb-6">
                <View className="flex-row items-center flex-1 pr-2">
                    <View className="w-12 h-12 rounded-2xl bg-slate-50 items-center justify-center border border-light">
                        <Text className="text-dark font-black text-lg">{display.applicantName.charAt(0)}</Text>
                    </View>
                    <View className="ml-3.5 flex-1">
                        <Text className="text-dark font-black text-[15px]" numberOfLines={1}>{display.applicantName}</Text>
                        <Text className="text-secondary font-bold text-[10px] tracking-wider mt-0.5 uppercase">
                            ID • {display.displayId.split('-').pop()}
                        </Text>
                    </View>
                </View>
                <View className={`flex-row items-center px-3 py-1.5 rounded-full ${config.bg}`}>
                    <View className={`w-1.5 h-1.5 rounded-full ${config.dot} mr-2`} />
                    <Text className="text-[9px] font-black tracking-widest uppercase" style={{ color: config.color }}>
                        {config.label}
                    </Text>
                </View>
            </View>

            <View className="flex-row justify-between items-center mb-6 px-1">
                <View>
                    <Text className="text-[9px] text-secondary font-bold uppercase tracking-widest mb-1">Plafon Diajukan</Text>
                    <Text className="text-dark font-black text-base">{display.amount}</Text>
                </View>
                <View className="items-end">
                    <Text className="text-[9px] text-secondary font-bold uppercase tracking-widest mb-1">Tenor</Text>
                    <Text className="text-dark font-bold text-sm">12 Bulan</Text>
                </View>
            </View>

            {!isCompleted ? (
                <TouchableOpacity
                    onPress={onAction}
                    activeOpacity={0.8}
                    className="w-full py-4 rounded-[20px] items-center bg-primary"
                    style={{
                        shadowColor: '#3b82f6',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.15,
                        shadowRadius: 10,
                        elevation: 4
                    }}
                >
                    <View className="flex-row items-center">
                        <Text className="text-white font-black text-[12px] uppercase tracking-[2px]">
                            {statusKey === 'IN_PROGRESS' ? 'Lanjutkan Survey' :
                                !survey ? 'Mulai Survey' :
                                    statusKey === 'ASSIGNED' ? 'Terima & Mulai' : 'Buka Survey'}
                        </Text>
                        <ChevronRight size={14} color="#fff" strokeWidth={3} style={{ marginLeft: 6 }} />
                    </View>
                </TouchableOpacity>
            ) : (
                <View className="bg-emerald-50/70 py-4 rounded-2xl items-center border border-emerald-100/50">
                    <View className="flex-row items-center">
                        <CheckCircle size={16} color="#059669" strokeWidth={2.5} />
                        <Text className="text-emerald-700 font-black text-[12px] uppercase tracking-[2px] ml-2.5">Survey Selesai</Text>
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