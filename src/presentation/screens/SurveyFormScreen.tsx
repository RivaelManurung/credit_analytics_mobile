import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
    TextInput, Alert, BackHandler, StyleSheet, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ArrowLeft, ClipboardList, CheckCircle2, ChevronRight,
    CheckCircle, Loader2, Send, RefreshCw, AlertCircle,
    FileText, Hash,
} from 'lucide-react-native';
import { useSurveyControl } from '../hooks/useSurveys';
import { useAuth } from '../context/AuthContext';
import { SurveyRepositoryImpl } from '../../data/repositories/SurveyRepositoryImpl';

const repo = new SurveyRepositoryImpl();
const { width: SCREEN_W } = Dimensions.get('window');

// ─── Premium Color Palette ──────────────────────────────────────────────────
const C = {
    bg: '#F7F8FC',
    card: '#FFFFFF',
    primary: '#4F46E5',   // indigo-600
    primaryL: '#EEF2FF',   // indigo-50
    primaryD: '#3730A3',   // indigo-800
    accent: '#7C3AED',   // violet-600
    accentL: '#F5F3FF',   // violet-50
    success: '#059669',   // emerald-600
    successL: '#ECFDF5',
    danger: '#DC2626',
    dangerL: '#FEF2F2',
    warn: '#D97706',
    warnL: '#FFFBEB',
    dark: '#0F172A',   // slate-900
    text: '#1E293B',   // slate-800
    sub: '#64748B',   // slate-500
    muted: '#94A3B8',   // slate-400
    border: '#E2E8F0',   // slate-200
    borderL: '#F1F5F9',   // slate-100
    white: '#FFFFFF',
};

interface Props {
    surveyId: string;
    templateId: string;
    onBack: () => void;
}

export function SurveyFormScreen({ surveyId, templateId, onBack }: Props) {
    const insets = useSafeAreaInsets();
    const { surveyorId } = useAuth();
    const { submitSurvey, submitSurveyAnswer, loading: actionLoading } = useSurveyControl();

    const [survey, setSurvey] = useState<any>(null);
    const [sections, setSections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentSection, setCurrentSection] = useState<any>(null);
    const [qIdx, setQIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [saving, setSaving] = useState(false);
    const [retryKey, setRetryKey] = useState(0);

    // ─── Fetch ──────────────────────────────────────────────────────────────
    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError('');
        console.log('[SF] fetch', surveyId, templateId);

        Promise.all([
            repo.getSurvey(surveyId),
            repo.listSurveySections(templateId),
        ]).then(([s, sec]) => {
            if (!alive) return;
            console.log('[SF] OK sections=' + sec.length);
            setSurvey(s);
            setSections(sec);
            setLoading(false);
        }).catch((e: any) => {
            if (!alive) return;
            setError(e?.message || 'Gagal memuat');
            setLoading(false);
        });

        return () => { alive = false; };
    }, [surveyId, templateId, retryKey]);

    useEffect(() => {
        const h = () => {
            if (currentSection) { setCurrentSection(null); return true; }
            onBack(); return true;
        };
        const sub = BackHandler.addEventListener('hardwareBackPress', h);
        return () => sub.remove();
    }, [currentSection, onBack]);

    // ─── Stats ──────────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        let totalQ = 0, doneQ = 0;
        sections.forEach(s => {
            const qs = s.questions || [];
            totalQ += qs.length;
            doneQ += qs.filter((q: any) => !!answers[q.id]).length;
        });
        return { totalQ, doneQ, pct: totalQ > 0 ? Math.round((doneQ / totalQ) * 100) : 0 };
    }, [sections, answers]);

    // ─── Handlers ───────────────────────────────────────────────────────────
    const onAnswer = async (qId: string, val: any, type: string) => {
        setAnswers(p => ({ ...p, [qId]: val }));
        try {
            setSaving(true);
            const payload: any = {};
            if (type === 'NUMBER') payload.number = String(val);
            else if (type === 'BOOLEAN') payload.boolean = !!val;
            else if (type === 'DATE') payload.date = val;
            else payload.text = String(val);
            await submitSurveyAnswer(surveyId, qId, payload);
        } catch (e) { console.warn(e); }
        finally { setSaving(false); }
    };

    const onNext = () => {
        if (!currentSection) return;
        const qs = currentSection.questions || [];
        if (qIdx < qs.length - 1) setQIdx(qIdx + 1);
        else setCurrentSection(null);
    };

    const onSubmit = async () => {
        try {
            await submitSurvey(surveyId, surveyorId!);
            Alert.alert('Berhasil', 'Survey telah berhasil dikirim.', [{ text: 'OK', onPress: onBack }]);
        } catch { Alert.alert('Gagal', 'Gagal mengirim survey. Silakan coba lagi.'); }
    };

    // ════════════════════════════════════════════════════════════════════════
    // LOADING STATE
    // ════════════════════════════════════════════════════════════════════════
    if (loading) {
        return (
            <View style={s.centerScreen}>
                <View style={s.loadingIconWrap}>
                    <View style={s.loadingIconInner}>
                        <ActivityIndicator size="large" color={C.primary} />
                    </View>
                </View>
                <Text style={s.loadingTitle}>Menyiapkan Form</Text>
                <Text style={s.loadingSubtitle}>Mengambil data survey & template...</Text>
                <TouchableOpacity onPress={onBack} style={s.ghostBtn}>
                    <ArrowLeft color={C.sub} size={16} />
                    <Text style={s.ghostBtnText}>Kembali</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // ERROR STATE
    // ════════════════════════════════════════════════════════════════════════
    if (error || !survey) {
        return (
            <View style={s.centerScreen}>
                <View style={[s.loadingIconWrap, { backgroundColor: C.dangerL }]}>
                    <AlertCircle color={C.danger} size={40} strokeWidth={1.5} />
                </View>
                <Text style={s.errorTitle}>Gagal Memuat</Text>
                <Text style={s.errorMsg}>{error || 'Data tidak ditemukan'}</Text>
                <TouchableOpacity onPress={() => setRetryKey(k => k + 1)} style={s.primaryBtn}>
                    <RefreshCw color={C.white} size={16} />
                    <Text style={s.primaryBtnText}>Coba Lagi</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onBack} style={s.ghostBtn}>
                    <ArrowLeft color={C.sub} size={16} />
                    <Text style={s.ghostBtnText}>Kembali ke Dashboard</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // QUESTION VIEW
    // ════════════════════════════════════════════════════════════════════════
    if (currentSection) {
        const qs = currentSection.questions || [];
        const q = qs[qIdx];
        if (!q) { setCurrentSection(null); return null; }
        const total = qs.length;
        const pct = ((qIdx + 1) / total) * 100;
        const isLast = qIdx === total - 1;

        return (
            <View style={{ flex: 1, backgroundColor: C.bg }}>
                {/* Header */}
                <View style={[s.qHeader, { paddingTop: insets.top + 12 }]}>
                    <View style={s.qHeaderTop}>
                        <TouchableOpacity onPress={() => setCurrentSection(null)} style={s.qBackBtn}>
                            <ArrowLeft color={C.text} size={20} strokeWidth={2.5} />
                        </TouchableOpacity>

                        <View style={s.qSectionLabel}>
                            <Text style={s.qSectionLabelText}>
                                {currentSection.sectionName}
                            </Text>
                        </View>

                        <View style={s.qSaveIndicator}>
                            {saving
                                ? <ActivityIndicator size="small" color={C.primary} />
                                : <CheckCircle size={18} color={C.success} strokeWidth={2.5} />}
                        </View>
                    </View>

                    {/* Progress */}
                    <View style={s.qProgressRow}>
                        <Text style={s.qProgressLabel}>Pertanyaan {qIdx + 1} dari {total}</Text>
                        <Text style={s.qProgressPct}>{Math.round(pct)}%</Text>
                    </View>
                    <View style={s.qProgressTrack}>
                        <View style={[s.qProgressFill, { width: `${pct}%` }]} />
                    </View>
                </View>

                {/* Question */}
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 28, paddingBottom: 40 }}>
                    <View style={s.qQuestionCard}>
                        <View style={s.qQuestionNumWrap}>
                            <Text style={s.qQuestionNum}>Q{qIdx + 1}</Text>
                        </View>
                        <Text style={s.qQuestionText}>{q.questionText}</Text>
                    </View>

                    {/* Answer Area */}
                    <View style={{ marginTop: 28 }}>
                        {q.answerType === 'BOOLEAN' ? (
                            <View style={{ flexDirection: 'row', gap: 14 }}>
                                {[{ v: true, label: 'Ya', icon: '✓' }, { v: false, label: 'Tidak', icon: '✗' }].map(opt => {
                                    const active = answers[q.id] === opt.v;
                                    const bg = active ? (opt.v ? C.success : C.danger) : C.card;
                                    const border = active ? bg : C.border;
                                    return (
                                        <TouchableOpacity key={String(opt.v)}
                                            onPress={() => onAnswer(q.id, opt.v, 'BOOLEAN')}
                                            activeOpacity={0.7}
                                            style={[s.boolBtn, { backgroundColor: bg, borderColor: border }]}>
                                            <Text style={[s.boolIcon, { color: active ? C.white : C.muted }]}>{opt.icon}</Text>
                                            <Text style={[s.boolLabel, { color: active ? C.white : C.sub }]}>{opt.label}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ) : (q.options?.length || 0) > 0 ? (
                            <View style={{ gap: 12 }}>
                                {q.options.map((opt: any, i: number) => {
                                    const active = answers[q.id] === opt.optionValue;
                                    return (
                                        <TouchableOpacity key={opt.id || i}
                                            onPress={() => onAnswer(q.id, opt.optionValue, 'TEXT')}
                                            activeOpacity={0.7}
                                            style={[s.optionBtn, active && s.optionBtnActive]}>
                                            <View style={[s.optionRadio, active && s.optionRadioActive]}>
                                                {active && <View style={s.optionRadioDot} />}
                                            </View>
                                            <Text style={[s.optionLabel, active && s.optionLabelActive]}>
                                                {opt.optionLabel}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ) : (
                            <View style={s.textInputWrap}>
                                <TextInput
                                    style={s.textInput}
                                    placeholder="Ketik jawaban Anda di sini..."
                                    placeholderTextColor={C.muted}
                                    multiline
                                    value={answers[q.id] || ''}
                                    onChangeText={t => onAnswer(q.id, t, q.answerType)}
                                />
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* Bottom Nav */}
                <View style={s.qFooter}>
                    <TouchableOpacity
                        onPress={() => qIdx > 0 ? setQIdx(qIdx - 1) : setCurrentSection(null)}
                        style={s.qPrevBtn} activeOpacity={0.7}>
                        <ArrowLeft color={C.sub} size={20} strokeWidth={2.5} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onNext} style={[s.qNextBtn, isLast && { backgroundColor: C.success }]} activeOpacity={0.8}>
                        <Text style={s.qNextBtnText}>{isLast ? 'SELESAI' : 'LANJUT'}</Text>
                        <ChevronRight color={C.white} size={18} strokeWidth={3} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // SECTION LIST (Main View)
    // ════════════════════════════════════════════════════════════════════════
    return (
        <View style={{ flex: 1, backgroundColor: C.bg }}>
            {/* Hero Header */}
            <View style={[s.heroWrap, { paddingTop: insets.top + 12 }]}>
                <View style={s.heroInner}>
                    <TouchableOpacity onPress={onBack} style={s.heroBackBtn} activeOpacity={0.7}>
                        <ArrowLeft color={C.white} size={22} strokeWidth={2.5} />
                    </TouchableOpacity>

                    <Text style={s.heroLabel}>SURVEY FORM</Text>
                    <Text style={s.heroName}>{survey.applicantName || 'Applicant'}</Text>

                    <View style={s.heroMeta}>
                        <View style={s.heroBadge}>
                            <Hash color="rgba(255,255,255,0.9)" size={12} strokeWidth={3} />
                            <Text style={s.heroBadgeText}>{surveyId.substring(0, 8).toUpperCase()}</Text>
                        </View>
                        <Text style={s.heroPurpose}>{survey.surveyPurpose || 'Survey Lapangan'}</Text>
                    </View>

                    {/* Overall Progress */}
                    <View style={s.heroProgress}>
                        <View style={s.heroProgressHeader}>
                            <Text style={s.heroProgressLabel}>Progress Keseluruhan</Text>
                            <Text style={s.heroProgressPct}>{stats.pct}%</Text>
                        </View>
                        <View style={s.heroProgressTrack}>
                            <View style={[s.heroProgressFill, { width: `${stats.pct}%` }]} />
                        </View>
                        <Text style={s.heroProgressSub}>
                            {stats.doneQ} dari {stats.totalQ} pertanyaan dijawab
                        </Text>
                    </View>
                </View>
            </View>

            {/* Section Cards */}
            <ScrollView style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}>

                <View style={s.sectionHeader}>
                    <View>
                        <Text style={s.sectionTitle}>Daftar Bagian</Text>
                        <Text style={s.sectionSub}>Klik untuk mulai mengisi</Text>
                    </View>
                    <View style={s.sectionCount}>
                        <FileText color={C.primary} size={14} />
                        <Text style={s.sectionCountText}>{sections.length}</Text>
                    </View>
                </View>

                {sections.map((sec: any, idx: number) => {
                    const qs = sec.questions || [];
                    const done = qs.filter((q: any) => !!answers[q.id]).length;
                    const total = qs.length;
                    const full = total > 0 && done === total;
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                    return (
                        <TouchableOpacity key={sec.id || idx}
                            onPress={() => { setCurrentSection(sec); setQIdx(0); }}
                            activeOpacity={0.7}
                            style={s.sectionCard}>

                            {/* Left Icon */}
                            <View style={[s.secIcon, { backgroundColor: full ? C.successL : C.primaryL }]}>
                                {full
                                    ? <CheckCircle2 color={C.success} size={26} strokeWidth={2} />
                                    : <ClipboardList color={C.primary} size={26} strokeWidth={2} />}
                            </View>

                            {/* Content */}
                            <View style={{ flex: 1 }}>
                                <View style={s.secTopRow}>
                                    <Text style={s.secLabel}>BAGIAN {idx + 1}</Text>
                                    <Text style={[s.secStatus, { color: full ? C.success : C.primary }]}>
                                        {full ? '✓ Selesai' : `${done}/${total}`}
                                    </Text>
                                </View>
                                <Text style={s.secName}>{sec.sectionName}</Text>

                                {/* Mini progress */}
                                <View style={s.secProgressWrap}>
                                    <View style={s.secProgressTrack}>
                                        <View style={[
                                            s.secProgressFill,
                                            { width: `${pct}%`, backgroundColor: full ? C.success : C.primary },
                                        ]} />
                                    </View>
                                    <Text style={[s.secProgressText, { color: full ? C.success : C.sub }]}>
                                        {pct}%
                                    </Text>
                                </View>
                            </View>

                            <ChevronRight color={C.border} size={20} />
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Submit Button */}
            <View style={s.submitWrap}>
                <TouchableOpacity onPress={onSubmit} activeOpacity={0.8}
                    style={[s.submitBtn, stats.pct < 100 && { opacity: 0.6 }]}>
                    {actionLoading
                        ? <ActivityIndicator color={C.white} />
                        : <>
                            <Send color={C.white} size={18} />
                            <Text style={s.submitBtnText}>Finalisasi Survey</Text>
                        </>}
                </TouchableOpacity>
                {stats.pct < 100 && (
                    <Text style={s.submitHint}>
                        Selesaikan semua pertanyaan terlebih dahulu
                    </Text>
                )}
            </View>
        </View>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
    // ── Shared ────────────────────────────────────────
    centerScreen: {
        flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40,
    },
    loadingIconWrap: {
        width: 100, height: 100, borderRadius: 32, backgroundColor: C.primaryL,
        alignItems: 'center', justifyContent: 'center', marginBottom: 28,
    },
    loadingIconInner: {
        width: 56, height: 56, borderRadius: 20, backgroundColor: C.card,
        alignItems: 'center', justifyContent: 'center',
        elevation: 4, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12,
    },
    loadingTitle: {
        fontSize: 18, fontWeight: '800', color: C.dark, marginBottom: 8,
    },
    loadingSubtitle: {
        fontSize: 13, color: C.sub, marginBottom: 32, textAlign: 'center',
    },
    errorTitle: {
        fontSize: 20, fontWeight: '900', color: C.danger, marginBottom: 8,
    },
    errorMsg: {
        fontSize: 13, color: C.sub, textAlign: 'center', marginBottom: 28, lineHeight: 20,
    },
    primaryBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: C.primary, paddingHorizontal: 28, paddingVertical: 14,
        borderRadius: 16, marginBottom: 14,
        elevation: 3, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
    },
    primaryBtnText: {
        color: C.white, fontWeight: '800', fontSize: 14,
    },
    ghostBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12,
    },
    ghostBtnText: {
        color: C.sub, fontWeight: '700', fontSize: 13,
    },

    // ── Hero Header ──────────────────────────────────
    heroWrap: {
        backgroundColor: C.primary,
        paddingBottom: 32,
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
    },
    heroInner: {
        paddingHorizontal: 24,
    },
    heroBackBtn: {
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 24,
    },
    heroLabel: {
        color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '900',
        letterSpacing: 3, marginBottom: 6,
    },
    heroName: {
        color: C.white, fontSize: 26, fontWeight: '900', marginBottom: 14,
    },
    heroMeta: {
        flexDirection: 'row', alignItems: 'center', marginBottom: 22,
    },
    heroBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: 'rgba(255,255,255,0.18)',
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginRight: 12,
    },
    heroBadgeText: {
        color: C.white, fontSize: 11, fontWeight: '900',
    },
    heroPurpose: {
        color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '700', fontStyle: 'italic',
    },
    heroProgress: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 18, padding: 16,
    },
    heroProgressHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
    },
    heroProgressLabel: {
        color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700',
    },
    heroProgressPct: {
        color: C.white, fontSize: 15, fontWeight: '900',
    },
    heroProgressTrack: {
        height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 99, overflow: 'hidden',
    },
    heroProgressFill: {
        height: '100%', backgroundColor: C.white, borderRadius: 99,
    },
    heroProgressSub: {
        color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '600', marginTop: 8,
    },

    // ── Section List ─────────────────────────────────
    sectionHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 4, marginTop: 22, marginBottom: 18,
    },
    sectionTitle: {
        fontSize: 20, fontWeight: '900', color: C.dark,
    },
    sectionSub: {
        fontSize: 12, color: C.sub, fontWeight: '600', marginTop: 2,
    },
    sectionCount: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: C.primaryL, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
    },
    sectionCountText: {
        color: C.primary, fontSize: 14, fontWeight: '900',
    },
    sectionCard: {
        backgroundColor: C.card, padding: 20, borderRadius: 22,
        marginBottom: 14, flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderColor: C.borderL,
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8,
    },
    secIcon: {
        width: 52, height: 52, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center', marginRight: 16,
    },
    secTopRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4,
    },
    secLabel: {
        color: C.sub, fontSize: 10, fontWeight: '800', letterSpacing: 1,
    },
    secStatus: {
        fontSize: 11, fontWeight: '800',
    },
    secName: {
        color: C.text, fontWeight: '800', fontSize: 16, marginBottom: 10,
    },
    secProgressWrap: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
    },
    secProgressTrack: {
        flex: 1, height: 4, backgroundColor: C.borderL, borderRadius: 99, overflow: 'hidden',
    },
    secProgressFill: {
        height: '100%', borderRadius: 99,
    },
    secProgressText: {
        fontSize: 10, fontWeight: '800', width: 30, textAlign: 'right',
    },

    // ── Submit ───────────────────────────────────────
    submitWrap: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 20, paddingBottom: 28, paddingTop: 16,
        backgroundColor: C.bg,
    },
    submitBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        backgroundColor: C.primary, height: 58, borderRadius: 20,
        elevation: 6, shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 16,
    },
    submitBtnText: {
        color: C.white, fontWeight: '900', fontSize: 14, letterSpacing: 1.5, textTransform: 'uppercase',
    },
    submitHint: {
        textAlign: 'center', color: C.muted, fontSize: 11, fontWeight: '600', marginTop: 10,
    },

    // ── Question View ────────────────────────────────
    qHeader: {
        backgroundColor: C.card, paddingHorizontal: 24, paddingBottom: 24,
        borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
        elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10,
    },
    qHeaderTop: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20,
    },
    qBackBtn: {
        width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
        backgroundColor: C.bg, borderRadius: 14,
    },
    qSectionLabel: {
        backgroundColor: C.primaryL, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10,
    },
    qSectionLabelText: {
        color: C.primary, fontWeight: '800', fontSize: 12,
    },
    qSaveIndicator: {
        width: 44, alignItems: 'flex-end',
    },
    qProgressRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
    },
    qProgressLabel: {
        color: C.sub, fontSize: 12, fontWeight: '700',
    },
    qProgressPct: {
        color: C.primary, fontSize: 13, fontWeight: '900',
    },
    qProgressTrack: {
        height: 5, backgroundColor: C.borderL, borderRadius: 99, overflow: 'hidden',
    },
    qProgressFill: {
        height: '100%', backgroundColor: C.primary, borderRadius: 99,
    },

    qQuestionCard: {
        backgroundColor: C.card, borderRadius: 24, padding: 28,
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8,
        borderWidth: 1, borderColor: C.borderL,
    },
    qQuestionNumWrap: {
        backgroundColor: C.primaryL, alignSelf: 'flex-start',
        paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, marginBottom: 16,
    },
    qQuestionNum: {
        color: C.primary, fontWeight: '900', fontSize: 12,
    },
    qQuestionText: {
        color: C.dark, fontSize: 20, fontWeight: '800', lineHeight: 32,
    },

    boolBtn: {
        flex: 1, height: 88, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, elevation: 1,
    },
    boolIcon: {
        fontSize: 28, fontWeight: '900', marginBottom: 4,
    },
    boolLabel: {
        fontWeight: '800', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1,
    },

    optionBtn: {
        flexDirection: 'row', alignItems: 'center', padding: 18,
        borderRadius: 16, borderWidth: 2, borderColor: C.border,
        backgroundColor: C.card,
    },
    optionBtnActive: {
        borderColor: C.primary, backgroundColor: C.primaryL,
    },
    optionRadio: {
        width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.border,
        alignItems: 'center', justifyContent: 'center', marginRight: 14,
    },
    optionRadioActive: {
        borderColor: C.primary,
    },
    optionRadioDot: {
        width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary,
    },
    optionLabel: {
        fontWeight: '700', fontSize: 15, color: C.text,
    },
    optionLabelActive: {
        color: C.primary, fontWeight: '800',
    },

    textInputWrap: {
        backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border,
        overflow: 'hidden',
    },
    textInput: {
        padding: 24, fontSize: 16, minHeight: 160, color: C.text,
        textAlignVertical: 'top',
    },

    qFooter: {
        flexDirection: 'row', padding: 20, paddingBottom: 28,
        backgroundColor: C.bg,
    },
    qPrevBtn: {
        height: 54, width: 54, borderRadius: 18, backgroundColor: C.card,
        borderWidth: 1, borderColor: C.border,
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    qNextBtn: {
        flex: 1, backgroundColor: C.primary, height: 54, borderRadius: 18,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        elevation: 4, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10,
    },
    qNextBtnText: {
        color: C.white, fontWeight: '900', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase',
    },
});
