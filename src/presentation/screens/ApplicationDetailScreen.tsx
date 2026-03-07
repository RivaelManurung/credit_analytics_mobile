import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SidebarLayout } from '../components/Layout/SidebarLayout';
import {
    User, MapPin, Briefcase,
    Calendar, Clock, ArrowLeft,
    ChevronRight, ClipboardCheck, AlertCircle,
    Wallet, CheckCircle, Info,
} from 'lucide-react-native';

import { useApplicationDetail } from '../hooks/useApplications';
import { useApplicant } from '../hooks/useApplicant';
import { useMySurveys, useSurveyControl } from '../hooks/useSurveys';
import { useAuth } from '../context/AuthContext';
import { useAppNavigator } from '../context/NavigationContext';
import { ApplicationMapper, DisplayApplication } from '../utils/ApplicationMapper';
import { COLORS, getStatusConfig } from '../../constants';
import type { StatusStyle } from '../../constants';

// ════════════════════════════════════════════════════════════════════════════
// APPLICATION DETAIL SCREEN
// ════════════════════════════════════════════════════════════════════════════
export function ApplicationDetailScreen() {
    const { surveyorId } = useAuth();
    const { params, navigate, goBack } = useAppNavigator();
    const applicationId: string = params?.applicationId || '';

    const appQuery = useApplicationDetail(applicationId);
    const surveysQuery = useMySurveys(surveyorId || '');
    const { startSurvey, loading: actionLoading } = useSurveyControl();

    const app = appQuery.data;
    const applicantQuery = useApplicant(app?.applicantId || '');

    const survey = useMemo(() => {
        const list = surveysQuery.data || [];
        if (params?.surveyId) {
            return list.find(s => s.id === params.surveyId);
        }
        return list.find(s => s.applicationId === applicationId);
    }, [surveysQuery.data, applicationId, params?.surveyId]);

    // Resolusi tipe nasabah murni dari backend (cek field type, applicantType, atau struktur details)
    const applicant = applicantQuery.data;
    let rawApplicantType = applicant?.type || (applicant as any)?.applicantType || '';
    if (!rawApplicantType && applicant?.details.case) {
        rawApplicantType = applicant.details.case === 'individual' ? 'PERSONAL' : 'COMPANY';
    }

    const display: DisplayApplication | null = useMemo(
        () => app ? ApplicationMapper.toDisplay(app, rawApplicantType) : null,
        [app, rawApplicantType],
    );

    // ── Action Handler ───────────────────────────────────────────────────
    const handleAction = async () => {
        if (!surveyorId || !applicationId) return;

        if (!survey) {
            Alert.alert(
                'Survey Belum Tersedia',
                'Survey untuk nasabah ini belum ditemukan. Pastikan sudah ditugaskan dari sistem dan coba refresh halaman.',
            );
            return;
        }

        const proceedWithSurvey = async () => {
            try {
                // Jika status ASSIGNED, mulai survey dahulu sebelum buka form
                if (survey.status === 'ASSIGNED') {
                    await startSurvey(survey.id, surveyorId);
                }
                navigate('SurveyForm', { surveyId: survey.id, applicationId });
            } catch (err) {
                console.error('[Detail] Action Error:', err);
                Alert.alert('Gagal', 'Terjadi kesalahan saat memulai survey.');
            }
        };

        if (survey.status === 'ASSIGNED') {
            Alert.alert(
                'Mulai Survey',
                `Apakah Anda yakin ingin memulai survey untuk ${display?.applicantName}?`,
                [
                    { text: 'Batal', style: 'cancel' },
                    { text: 'Mulai', onPress: proceedWithSurvey },
                ],
            );
        } else {
            // Untuk IN_PROGRESS atau status lainnya, langsung buka form
            proceedWithSurvey();
        }
    };

    // ── Loading State ────────────────────────────────────────────────────
    if (appQuery.isLoading || (surveysQuery.isLoading && !surveysQuery.data)) {
        return (
            <SidebarLayout headerTitle="Detail Nasabah">
                <View className="flex-1 justify-center items-center bg-slate-50">
                    <ActivityIndicator color="#2563EB" size="large" />
                    <Text className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                        Memuat Data...
                    </Text>
                </View>
            </SidebarLayout>
        );
    }

    // ── Error State ──────────────────────────────────────────────────────
    if (!app || !display) {
        return (
            <SidebarLayout headerTitle="Detail Nasabah">
                <View className="flex-1 justify-center items-center bg-slate-50 p-6">
                    <AlertCircle color="#E11D48" size={48} />
                    <Text className="mt-4 text-slate-900 font-black text-lg text-center">
                        Data Nasabah Tidak Ditemukan
                    </Text>
                    <TouchableOpacity
                        onPress={() => goBack()}
                        className="mt-8 px-8 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm"
                    >
                        <Text className="text-slate-600 font-bold">Kembali ke Dashboard</Text>
                    </TouchableOpacity>
                </View>
            </SidebarLayout>
        );
    }

    // Status dari survey backend — fallback ke ASSIGNED (bukan PENDING/NEW)
    // karena nasabah yang muncul di dashboard sudah pasti ditugaskan.
    const statusKey = survey?.status || 'ASSIGNED';
    const config: StatusStyle = getStatusConfig(statusKey);
    const isCompleted = ['SUBMITTED', 'VERIFIED'].includes(statusKey);

    // ── Main Render ──────────────────────────────────────────────────────
    return (
        <SidebarLayout headerTitle="Detail Profil Nasabah">
            <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ paddingBottom: 120 }}>
                {/* Header Profile Section */}
                <View className="bg-white px-6 pt-6 pb-8 border-b border-slate-100 mb-6 shadow-sm">
                    <TouchableOpacity onPress={() => goBack()} className="mb-6 flex-row items-center">
                        <ArrowLeft color="#64748B" size={20} />
                        <Text className="ml-2 text-slate-500 font-bold text-sm">Kembali</Text>
                    </TouchableOpacity>

                    <View className="flex-row items-center mb-6">
                        <View className="w-20 h-20 rounded-[28px] bg-blue-50 items-center justify-center border border-blue-100">
                            <Text className="text-primary font-black text-3xl">
                                {display.applicantName.charAt(0)}
                            </Text>
                        </View>
                        <View className="ml-5 flex-1">
                            <Text className="text-slate-900 text-2xl font-black">
                                {display.applicantName}
                            </Text>
                            <Text className="text-slate-400 font-bold text-xs uppercase tracking-wider mt-1">
                                #ID: {display.displayId}
                            </Text>
                            <View className="flex-row mt-3 items-center">
                                <View
                                    className="flex-row items-center px-3 py-1 rounded-full"
                                    style={{ backgroundColor: config.bg }}
                                >
                                    <View
                                        className="w-1.5 h-1.5 rounded-full mr-2"
                                        style={{ backgroundColor: config.dot }}
                                    />
                                    <Text
                                        className="text-[10px] font-black tracking-tight uppercase"
                                        style={{ color: config.color }}
                                    >
                                        {config.label}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View className="flex-row gap-4">
                        <View className="flex-1 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                            <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1">
                                Plafon Kredit
                            </Text>
                            <View className="flex-row items-center">
                                <Wallet size={14} color="#2563EB" />
                                <Text className="text-slate-900 font-black text-lg ml-2">
                                    {display.amount}
                                </Text>
                            </View>
                        </View>
                        <View className="w-1/3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                            <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1">
                                Tenor
                            </Text>
                            <View className="flex-row items-center">
                                <Calendar size={14} color="#2563EB" />
                                <Text className="text-slate-900 font-black text-lg ml-2">
                                    {display.tenor}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Details Section */}
                <View className="px-6 gap-y-4">
                    <Text className="text-slate-900 font-black text-lg mb-1">Informasi Pengajuan</Text>

                    <DetailItem icon={<User size={18} color="#64748B" />} label="Nama Lengkap" value={display.applicantName} />
                    <DetailItem icon={<Info size={18} color="#64748B" />} label="Tipe Nasabah" value={display.applicantType} />
                    <DetailItem icon={<Info size={18} color="#64748B" />} label="ID Pengajuan" value={app.id} />
                    <DetailItem icon={<Briefcase size={18} color="#64748B" />} label="Tujuan Kredit" value={display.type} />
                    <DetailItem icon={<Clock size={18} color="#64748B" />} label="Status Survey" value={config.label} />
                </View>

                {/* Action Button Section */}
                <View className="mt-10 px-6">
                    {!isCompleted ? (
                        <TouchableOpacity
                            onPress={handleAction}
                            disabled={actionLoading}
                            activeOpacity={0.8}
                            className="bg-primary py-5 rounded-2xl items-center shadow-xl shadow-blue-200 flex-row justify-center gap-3"
                        >
                            {actionLoading ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <>
                                    <ClipboardCheck color="white" size={20} />
                                    <Text className="text-white font-black text-sm uppercase tracking-[2px]">
                                        {statusKey === 'IN_PROGRESS' ? 'Lanjutkan Survey' : 'Mulai Proses Survey'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <View className="bg-emerald-50 py-5 rounded-2xl items-center border border-emerald-100 flex-row justify-center gap-3 shadow-sm">
                            <CheckCircle size={20} color="#059669" />
                            <Text className="text-emerald-600 font-black text-sm uppercase tracking-[2px]">
                                Survey Telah Selesai
                            </Text>
                        </View>
                    )}

                    <Text className="text-center text-slate-400 text-[10px] mt-4 font-bold uppercase tracking-widest px-8 leading-4">
                        {!isCompleted
                            ? 'Pastikan Anda berada di lokasi nasabah saat memulai proses survey lapangan.'
                            : 'Data survey telah terkirim dan sedang dalam tahap verifikasi oleh tim pusat.'}
                    </Text>
                </View>
            </ScrollView>
        </SidebarLayout>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

const DetailItem = React.memo(({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) => {
    return (
        <View className="bg-white p-4 rounded-2xl border border-slate-100 flex-row items-center">
            <View className="w-10 h-10 rounded-xl bg-slate-50 items-center justify-center">
                {icon}
            </View>
            <View className="ml-4 flex-1">
                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    {label}
                </Text>
                <Text className="text-slate-900 font-black text-sm mt-0.5">{value}</Text>
            </View>
        </View>
    );
});
