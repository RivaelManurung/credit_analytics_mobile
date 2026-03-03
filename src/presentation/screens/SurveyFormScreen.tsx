import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
    TextInput, Alert, BackHandler, StyleSheet, Dimensions,
    Modal, FlatList, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ArrowLeft, ClipboardList, CheckCircle2, ChevronRight,
    CheckCircle, Loader2, Send, RefreshCw, AlertCircle,
    FileText, Hash, Lock, ChevronDown, Camera, Image as ImageIcon,
} from 'lucide-react-native';
import { useSurveyControl } from '../hooks/useSurveys';
import { useAuth } from '../context/AuthContext';
import { SurveyRepositoryImpl } from '../../data/repositories/SurveyRepositoryImpl';

const repo = new SurveyRepositoryImpl();
const { width: SCREEN_W } = Dimensions.get('window');

// ─── Premium Color Palette ──────────────────────────────────────────────────
const C = {
    bg: '#F8FAFC',     // slate-50
    card: '#FFFFFF',
    primary: '#2563EB',
    primaryL: '#EFF6FF',
    primaryD: '#1E40AF',
    accent: '#7C3AED',
    accentL: '#F5F3FF',
    success: '#059669',
    successL: '#ECFDF5',
    danger: '#E11D48',
    dangerL: '#FFF1F2',
    warn: '#D97706',
    warnL: '#FFFBEB',
    dark: '#0F172A',
    text: '#1E293B',
    sub: '#64748B',
    muted: '#94A3B8',
    border: '#E2E8F0',
    borderL: '#F1F5F9',
    white: '#FFFFFF',
};

interface Props {
    surveyId: string;
    applicationId: string;
    onBack: () => void;
}

export function SurveyFormScreen({ surveyId, applicationId, onBack }: Props) {
    const insets = useSafeAreaInsets();
    const { surveyorId } = useAuth();
    const { startSurvey, submitSurvey, submitSurveyAnswer, loading: actionLoading } = useSurveyControl();

    const [survey, setSurvey] = useState<any>(null);
    const [sections, setSections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentSection, setCurrentSection] = useState<any>(null);
    const [qIdx, setQIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [saving, setSaving] = useState(false);
    const [retryKey, setRetryKey] = useState(0);
    const [localTxt, setLocalTxt] = useState('');
    const [pickerOpen, setPickerOpen] = useState(false);

    // Sync localTxt saat pindah pertanyaan
    useEffect(() => {
        if (currentSection) {
            const q = currentSection.questions?.[qIdx];
            if (q) setLocalTxt(answers[q.id] || '');
        }
    }, [currentSection, qIdx, answers]);

    // ─── Fetch ──────────────────────────────────────────────────────────────
    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError('');
        console.log('[SF] fetch surveyId=%s applicationId=%s', surveyId, applicationId);

        // Fetch surveys by applicationId untuk ambil templateId yang sesuai
        repo.listSurveysByApplication(applicationId)
            .then(async (surveys) => {
                if (!alive) return;

                const activeSurvey = surveys.find((s: any) => s.id === surveyId) ?? surveys[0];
                if (!activeSurvey) throw new Error('Survey tidak ditemukan untuk nasabah ini.');

                const derivedTemplateId = activeSurvey.templateId;
                console.log('[SF] Found survey. templateId=%s status=%s', derivedTemplateId, activeSurvey.status);

                // Fetch sections + existing answers secara paralel
                const [sec, ans] = await Promise.all([
                    repo.listSurveySections(derivedTemplateId),
                    repo.listSurveyAnswers(surveyId).catch(() => []),
                ]);

                if (!alive) return;
                console.log('[SF] sections=%d answers=%d', sec.length, ans.length);

                setSurvey(activeSurvey);
                setSections(sec);

                // Auto-start jika masih ASSIGNED
                if (activeSurvey.status === 'ASSIGNED' && surveyorId) {
                    startSurvey(surveyId, surveyorId).catch(console.error);
                }

                const initialAnswers: Record<string, any> = {};
                const qTypes: Record<string, string> = {};
                sec.forEach(s => (s.questions || []).forEach(q => { qTypes[q.id] = q.answerType; }));

                console.log('[SF] Mapping answers. Total raw:', ans.length);
                ans.forEach((a: any) => {
                    const qId = a.questionId || a.question_id;
                    if (!qId) return;

                    const type = qTypes[qId];
                    // Support camelCase dan snake_case dari backend
                    const txt = a.answerText ?? a.answer_text;
                    const num = a.answerNumber ?? a.answer_number;
                    const boo = a.answerBoolean ?? a.answer_boolean;
                    const dat = a.answerDate ?? a.answer_date;

                    if (type === 'BOOLEAN') {
                        initialAnswers[qId] = (boo === true || txt === 'true' || txt === '1');
                    } else if (type === 'NUMBER') {
                        initialAnswers[qId] = (num !== undefined && num !== null && num !== '') ? num : txt;
                    } else if (type === 'DATE') {
                        initialAnswers[qId] = (dat !== undefined && dat !== null && dat !== '') ? dat : txt;
                    } else {
                        initialAnswers[qId] = txt || num || String(boo ?? '');
                    }
                });

                console.log('[SF] Initial Answers Loaded:', Object.keys(initialAnswers).length);
                setAnswers(initialAnswers);
                setLoading(false);
            }).catch((e: any) => {
                if (!alive) return;
                console.error('[SF] Fetch error:', e);
                setError(e?.message || 'Gagal memuat data survey.');
                setLoading(false);
            });

        return () => { alive = false; };
    }, [surveyId, applicationId, retryKey]);

    useEffect(() => {
        const h = () => {
            if (currentSection) { onExitSection(); return true; }
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
            doneQ += qs.filter((q: any) => {
                const ans = answers[q.id];
                return ans !== undefined && ans !== null && ans !== '';
            }).length;
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

    const onNext = async () => {
        if (!currentSection) return;
        const qs = currentSection.questions || [];
        const q = qs[qIdx];

        // Simpan text input sebelum pindah
        if (q.answerType !== 'BOOLEAN' && localTxt !== (answers[q.id] || '')) {
            await onAnswer(q.id, localTxt, q.answerType);
        }

        const currentAns = answers[q?.id] ?? localTxt;
        const hasAnswer = currentAns !== undefined && currentAns !== null && currentAns !== '';

        if (!hasAnswer) {
            Alert.alert('Belum Dijawab', 'Tolong berikan jawaban Anda sebelum melanjutkan.');
            return;
        }

        if (qIdx < qs.length - 1) setQIdx(qIdx + 1);
        else setCurrentSection(null);
    };

    const onExitSection = async () => {
        const q = currentSection?.questions?.[qIdx];
        if (q && q.answerType !== 'BOOLEAN' && localTxt !== (answers[q.id] || '')) {
            await onAnswer(q.id, localTxt, q.answerType);
        }
        setCurrentSection(null);
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
                        <TouchableOpacity onPress={onExitSection} style={s.qBackBtn}>
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
                        ) : q.answerType === 'OPTION' || q.answerType === 'SELECT' ? (
                            <View>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => setPickerOpen(true)}
                                    style={s.pickerTrigger}>
                                    <Text style={[s.pickerValue, !answers[q.id] && { color: C.muted }]}>
                                        {q.options?.find((o: any) => o.optionValue === answers[q.id])?.optionLabel || 'Pilih jawaban...'}
                                    </Text>
                                    <ChevronDown color={C.sub} size={20} />
                                </TouchableOpacity>

                                <Modal visible={pickerOpen} transparent animationType="fade">
                                    <Pressable style={s.modalOverlay} onPress={() => setPickerOpen(false)}>
                                        <View style={s.pickerModal}>
                                            <View style={s.pickerHeader}>
                                                <Text style={s.pickerTitle}>Pilih Opsi</Text>
                                            </View>
                                            <FlatList
                                                data={q.options || []}
                                                keyExtractor={(o, i) => o.id || String(i)}
                                                renderItem={({ item: opt }) => {
                                                    const active = answers[q.id] === opt.optionValue;
                                                    return (
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                onAnswer(q.id, opt.optionValue, 'TEXT');
                                                                setPickerOpen(false);
                                                            }}
                                                            style={[s.pickerItem, active && s.pickerItemActive]}>
                                                            <Text style={[s.pickerItemText, active && s.pickerItemTextActive]}>
                                                                {opt.optionLabel}
                                                            </Text>
                                                            {active && <CheckCircle size={16} color={C.primary} />}
                                                        </TouchableOpacity>
                                                    );
                                                }}
                                            />
                                        </View>
                                    </Pressable>
                                </Modal>
                            </View>
                        ) : q.answerType === 'IMAGE' ? (
                            <View>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => Alert.alert('Kamera', 'Fitur Live Capture akan segera tersedia.')}
                                    style={s.imageBtn}>
                                    <View style={s.imageBtnIcon}>
                                        <Camera color={C.primary} size={32} />
                                    </View>
                                    <View>
                                        <Text style={s.imageBtnTitle}>Ambil Foto Lapangan</Text>
                                        <Text style={s.imageBtnSub}>Pastikan lokasi terang & jelas</Text>
                                    </View>
                                    <TouchableOpacity style={s.imageBtnPlus}>
                                        <ImageIcon color={C.white} size={14} />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={s.textInputWrap}>
                                <TextInput
                                    style={s.textInput}
                                    placeholder={q.answerType === 'NUMBER' ? "Masukkan angka saja..." : "Ketik jawaban Anda di sini..."}
                                    placeholderTextColor={C.muted}
                                    keyboardType={q.answerType === 'NUMBER' ? 'numeric' : 'default'}
                                    multiline={q.answerType !== 'NUMBER'}
                                    value={localTxt}
                                    onChangeText={setLocalTxt}
                                    onBlur={() => {
                                        if (localTxt !== (answers[q.id] || '')) {
                                            onAnswer(q.id, localTxt, q.answerType);
                                        }
                                    }}
                                />
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* Bottom Nav */}
                <View style={s.qFooter}>
                    <TouchableOpacity
                        onPress={() => qIdx > 0 ? setQIdx(qIdx - 1) : onExitSection()}
                        style={s.qPrevBtn} activeOpacity={0.7}>
                        <ArrowLeft color={C.sub} size={20} strokeWidth={2.5} />
                    </TouchableOpacity>

                    {/* Next Button Style Updates */}
                    {(() => {
                        const q = qs[qIdx];
                        const hasAns = answers[q?.id] !== undefined && answers[q?.id] !== '';
                        return (
                            <TouchableOpacity
                                onPress={onNext}
                                style={[
                                    s.qNextBtn,
                                    isLast && { backgroundColor: C.success },
                                    !hasAns && { opacity: 0.5 }
                                ]}
                                activeOpacity={hasAns ? 0.8 : 1}
                            >
                                <Text style={s.qNextBtnText}>{isLast ? 'SELESAI' : 'LANJUT'}</Text>
                                <ChevronRight color={C.white} size={18} strokeWidth={3} />
                            </TouchableOpacity>
                        );
                    })()}
                </View>
            </View>
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // SECTION LIST (Main View)
    // ════════════════════════════════════════════════════════════════════════
    return (
        <View style={{ flex: 1, backgroundColor: C.bg }}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Header - Now Inside ScrollView */}
                <View style={[s.heroWrap, { paddingTop: insets.top + 20 }]}>
                    <View style={s.heroInner}>
                        {/* Header Top Row: Back + Label */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                            <TouchableOpacity onPress={onBack} style={s.heroBackBtn} activeOpacity={0.7}>
                                <ArrowLeft color={C.white} size={18} strokeWidth={3} />
                            </TouchableOpacity>
                            <Text style={[s.heroLabel, { marginBottom: 0, marginLeft: 12 }]}>SURVEY FORM</Text>
                        </View>

                        {/* Info Section Below */}
                        <Text style={s.heroName}>{survey.applicantName || 'Applicant'}</Text>

                        <View style={s.heroMeta}>
                            <View style={s.heroBadge}>
                                <Hash color="rgba(255,255,255,0.9)" size={12} strokeWidth={3} />
                                <Text style={s.heroBadgeText}>{surveyId.substring(0, 8).toUpperCase()}</Text>
                            </View>
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

                {/* Section Cards Container */}
                <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
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
                        const done = qs.filter((q: any) => {
                            const ans = answers[q.id];
                            return ans !== undefined && ans !== null && ans !== '';
                        }).length;
                        const total = qs.length;
                        const full = total > 0 && done === total;
                        const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                        // Check if previous section is complete
                        let isLocked = false;
                        if (idx > 0) {
                            const prevSec = sections[idx - 1];
                            const prevQs = prevSec.questions || [];
                            const prevDone = prevQs.filter((q: any) => {
                                const ans = answers[q.id];
                                return ans !== undefined && ans !== null && ans !== '';
                            }).length;
                            isLocked = prevDone < prevQs.length;
                        }

                        return (
                            <TouchableOpacity key={sec.id || idx}
                                onPress={() => {
                                    if (isLocked) {
                                        Alert.alert('Bagian Terkunci', 'Selesaikan bagian sebelumnya terlebih dahulu untuk membuka bagian ini.');
                                        return;
                                    }
                                    setCurrentSection(sec);
                                    setQIdx(0);
                                }}
                                activeOpacity={isLocked ? 1 : 0.7}
                                style={[s.sectionCard, isLocked && { opacity: 0.6, borderColor: C.border }]}>

                                {/* Left Icon */}
                                <View style={[s.secIcon, { backgroundColor: isLocked ? C.borderL : (full ? C.successL : C.primaryL) }]}>
                                    {isLocked ? (
                                        <Lock color={C.muted} size={24} />
                                    ) : (
                                        full
                                            ? <CheckCircle2 color={C.success} size={26} strokeWidth={2} />
                                            : <ClipboardList color={C.primary} size={26} strokeWidth={2} />
                                    )}
                                </View>

                                {/* Content */}
                                <View style={{ flex: 1 }}>
                                    <View style={s.secTopRow}>
                                        <Text style={s.secLabel}>BAGIAN {idx + 1}</Text>
                                        <Text style={[s.secStatus, { color: isLocked ? C.muted : (full ? C.success : C.primary) }]}>
                                            {isLocked ? 'Terkunci' : (full ? '✓ Selesai' : `${done}/${total}`)}
                                        </Text>
                                    </View>
                                    <Text style={[s.secName, isLocked && { color: C.muted }]}>{sec.sectionName}</Text>

                                    {/* Mini progress */}
                                    <View style={s.secProgressWrap}>
                                        <View style={s.secProgressTrack}>
                                            <View style={[
                                                s.secProgressFill,
                                                {
                                                    width: `${pct}%`,
                                                    backgroundColor: isLocked ? C.muted : (full ? C.success : C.primary)
                                                },
                                            ]} />
                                        </View>
                                        <Text style={[s.secProgressText, { color: full ? C.success : C.sub }]}>
                                            {pct}%
                                        </Text>
                                    </View>
                                </View>

                                {isLocked ? null : <ChevronRight color={C.border} size={20} />}
                            </TouchableOpacity>
                        );
                    })}
                </View>
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
        width: 32, height: 32, borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center',
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

    // ── Picker ──────────────────────────────────────
    pickerTrigger: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: C.card, paddingHorizontal: 20, paddingVertical: 18,
        borderRadius: 18, borderWidth: 1, borderColor: C.border,
    },
    pickerValue: {
        fontSize: 16, fontWeight: '700', color: C.text,
    },
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end',
    },
    pickerModal: {
        backgroundColor: C.card, borderTopLeftRadius: 32, borderTopRightRadius: 32,
        maxHeight: Dimensions.get('window').height * 0.7, paddingBottom: 40,
    },
    pickerHeader: {
        padding: 24, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.borderL,
    },
    pickerTitle: {
        fontSize: 18, fontWeight: '900', color: C.dark,
    },
    pickerItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 24, borderBottomWidth: 1, borderBottomColor: C.borderL,
    },
    pickerItemActive: {
        backgroundColor: C.primaryL,
    },
    pickerItemText: {
        fontSize: 16, fontWeight: '700', color: C.text,
    },
    pickerItemTextActive: {
        color: C.primary, fontWeight: '800',
    },

    // ── Image Button ────────────────────────────────
    imageBtn: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.card, padding: 16, borderRadius: 24,
        borderWidth: 1, borderColor: C.border, gap: 16,
    },
    imageBtnIcon: {
        width: 64, height: 64, borderRadius: 16,
        backgroundColor: C.primaryL, alignItems: 'center', justifyContent: 'center',
    },
    imageBtnTitle: {
        fontSize: 16, fontWeight: '800', color: C.dark, marginBottom: 2,
    },
    imageBtnSub: {
        fontSize: 12, color: C.sub, fontWeight: '600',
    },
    imageBtnPlus: {
        position: 'absolute', right: 12, top: 12,
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
    },
});
