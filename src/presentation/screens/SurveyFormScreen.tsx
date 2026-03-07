import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator,
    TextInput, Alert, BackHandler, StyleSheet, Dimensions,
    Modal, FlatList, Pressable, Platform, PermissionsAndroid,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ArrowLeft, CheckCircle2, ChevronRight, CheckCircle,
    Send, RefreshCw, AlertCircle, Lock,
    ChevronDown, Camera, X, ClipboardList, Calendar as CalendarIcon,
    ListTodo
} from 'lucide-react-native';
import { useSurveyControl } from '../hooks/useSurveys';
import { useAuth } from '../context/AuthContext';
import { useSurveyForm } from '../hooks/useSurveyForm';
import { launchCamera } from 'react-native-image-picker';
import { debounce } from '../utils/debounce';
import { COLORS } from '../../constants';

const { width: SW, height: SH } = Dimensions.get('window');

// ════════════════════════════════════════════════════════════════════════════
// TYPES & STATE MACHINE
// ════════════════════════════════════════════════════════════════════════════
interface Props {
    surveyId: string;
    applicationId: string;
    onBack: () => void;
}

type MachineState = 'loading' | 'error' | 'sections' | 'question' | 'submitting' | 'success';

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
export function SurveyFormScreen({ surveyId, applicationId, onBack }: Props) {
    const insets = useSafeAreaInsets();
    const { surveyorId } = useAuth();
    const { startSurvey, submitSurvey, submitSurveyAnswer } = useSurveyControl();

    // Custom hook for data fetching (React Query)
    const { survey, sections, rawAnswers, isLoading, isError, error, refetch } = useSurveyForm(surveyId, applicationId);

    const [machine, setMachine] = useState<MachineState>('loading');
    const [currentSection, setCurrentSection] = useState<any>(null);
    const [qIdx, setQIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});

    // Reset local state when survey changes to avoid stale pollution
    useEffect(() => {
        setAnswers({});
        setQIdx(0);
        setCurrentSection(null);
        setMachine('loading');
    }, [surveyId]);
    const [lightbox, setLightbox] = useState<{ uris: string[]; index: number } | null>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    const STORAGE_KEY = `survey_draft_${surveyId}`;

    // Debounced API call to prevent spamming server
    const debouncedSave = useMemo(
        () => debounce(async (qId: string, payload: any) => {
            setSaveStatus('saving');
            try {
                await submitSurveyAnswer(surveyId, qId, payload);
                setSaveStatus('saved');
                // Hide "Tersimpan" after 3 seconds
                setTimeout(() => setSaveStatus((prev: 'idle' | 'saving' | 'saved' | 'error') => prev === 'saved' ? 'idle' : prev), 3000);
            } catch (err) {
                console.warn('[Autosave Error]', err);
                setSaveStatus('error');
            }
        }, 2000),
        [surveyId, submitSurveyAnswer]
    );

    // Handle mapping initial answers when data is ready
    useEffect(() => {
        if (isLoading) {
            setMachine('loading');
            return;
        }
        if (isError || !survey) {
            setMachine('error');
            return;
        }

        // Map answer types for formatting
        const qTypes: Record<string, string> = {};
        sections.forEach((sec: any) => (sec.questions || []).forEach((q: any) => { qTypes[q.id] = q.answerType; }));

        const initAnswers: Record<string, any> = {};
        rawAnswers.forEach((a: any) => {
            const qId = a.questionId ?? a.question_id;
            if (!qId) return;
            const type = qTypes[qId];
            const txt = a.answerText ?? a.answer_text;
            const num = a.answerNumber ?? a.answer_number;
            const boo = a.answerBoolean ?? a.answer_boolean;
            const dat = a.answerDate ?? a.answer_date;

            if (type === 'BOOLEAN') initAnswers[qId] = (boo === true || txt === 'true');
            else if (type === 'NUMBER') initAnswers[qId] = num ?? txt;
            else if (type === 'DATE') initAnswers[qId] = dat ?? txt;
            else if (type === 'IMAGE') initAnswers[qId] = txt ? txt.split(',').filter(Boolean) : [];
            else initAnswers[qId] = txt ?? num ?? String(boo ?? '');
        });

        // Load and Merge with local draft
        AsyncStorage.getItem(STORAGE_KEY).then(local => {
            let finalAnswers = initAnswers;
            if (local) {
                try {
                    const localDraft = JSON.parse(local);
                    finalAnswers = { ...initAnswers, ...localDraft };
                } catch (e) {
                    console.warn('[Storage Parse Error]', e);
                }
            }
            setAnswers(finalAnswers);
            setMachine('sections');
        }).catch(() => {
            setAnswers(initAnswers);
            setMachine('sections');
        });

        // Start survey if assigned
        if (survey.status === 'ASSIGNED' && surveyorId) {
            startSurvey(surveyId, surveyorId).catch(console.error);
        }
    }, [isLoading, isError, survey, sections, rawAnswers, surveyorId]); // eslint-disable-line

    // Hardware back navigation logic based on state machine
    useEffect(() => {
        const handler = () => {
            if (lightbox) { setLightbox(null); return true; }
            if (machine === 'question') {
                setCurrentSection(null);
                setMachine('sections');
                return true;
            }
            onBack();
            return true;
        };
        const sub = BackHandler.addEventListener('hardwareBackPress', handler);
        return () => sub.remove();
    }, [lightbox, machine, onBack]);

    // Cleanup debouncer on unmount
    useEffect(() => {
        return () => debouncedSave.cancel();
    }, [debouncedSave]);

    // Calculate progress stats (memoized)
    const stats = useMemo(() => {
        let total = 0, done = 0, requiredMissing = false;
        sections.forEach(s => {
            const qs = s.questions ?? [];
            total += qs.length;
            qs.forEach((q: any) => {
                const a = answers[q.id];
                const hasVal = a !== undefined && a !== null && a !== '' && (Array.isArray(a) ? a.length > 0 : true);
                if (hasVal) done++;
                if (q.isRequired && !hasVal) requiredMissing = true;
            });
        });
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        return { total, done, pct, isComplete: total > 0 && done === total && !requiredMissing };
    }, [sections, answers]);

    // Action Handlers
    const saveAnswer = useCallback((qId: string, val: any, type: string) => {
        // Optimistic UI update
        setAnswers((prev: Record<string, any>) => {
            const next = { ...prev, [qId]: val };
            // Save to local storage as fallback
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(console.warn);
            return next;
        });

        // Prepare DB payload
        const payload: any = {};
        if (type === 'NUMBER') payload.number = String(val);
        else if (type === 'BOOLEAN') payload.boolean = !!val;
        else if (type === 'DATE') payload.date = val;
        else if (type === 'IMAGE') payload.text = Array.isArray(val) ? val.join(',') : val;
        else payload.text = String(val);

        // Debounce API call
        debouncedSave(qId, payload);
    }, [debouncedSave, STORAGE_KEY]);

    const handleSelectSection = useCallback((sec: any) => {
        setCurrentSection(sec);
        setQIdx(0);
        setMachine('question');
    }, []);

    const handleBackToSections = useCallback(() => {
        setCurrentSection(null);
        setMachine('sections');
    }, []);

    const handleSubmit = async () => {
        if (!stats.isComplete) {
            Alert.alert('Belum Selesai', 'Harap selesaikan semua pertanyaan sebelum mengirim survey.');
            return;
        }

        setMachine('submitting');
        try {
            await submitSurvey(surveyId, surveyorId!);
            setMachine('success');
            // Clear local draft on success
            AsyncStorage.removeItem(STORAGE_KEY).catch(console.warn);
            Alert.alert('Berhasil', 'Survey telah berhasil dikirim.', [{ text: 'OK', onPress: onBack }]);
        } catch (err: any) {
            console.error('[Submit Error]', err);
            setMachine('sections');
            Alert.alert('Gagal', 'Gagal mengirim survey. Silakan coba lagi.');
        }
    };

    // ── Main Render Structure ───────────────────────────────────────────
    let content;

    if (machine === 'loading') {
        content = <LoadingView insets={insets} onBack={onBack} />;
    } else if (machine === 'error') {
        content = <ErrorView error={error} onRetry={refetch} onBack={onBack} />;
    } else if (machine === 'question' && currentSection) {
        content = (
            <QuestionView
                insets={insets}
                section={currentSection}
                qIdx={qIdx}
                setQIdx={setQIdx}
                answers={answers}
                saveAnswer={saveAnswer}
                onBack={handleBackToSections}
                setLightbox={setLightbox}
                saveStatus={saveStatus}
            />
        );
    } else {
        content = (
            <View style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
                    <SurveyHeader insets={insets} survey={survey} stats={stats} onBack={onBack} saveStatus={saveStatus} />
                    <SurveyProgress stats={stats} />
                    <SectionList sections={sections} answers={answers} onSelectSection={handleSelectSection} />
                </ScrollView>
                <SubmitFooter stats={stats} loading={machine === 'submitting'} onSubmit={handleSubmit} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
            {content}

            {lightbox && (
                <ImageLightbox
                    lightbox={lightbox}
                    onClose={() => setLightbox(null)}
                />
            )}
        </View>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// MEMOIZED SUB-COMPONENTS (Pure Rendering)
// ════════════════════════════════════════════════════════════════════════════

const LoadingView = React.memo(({ insets, onBack }: { insets: any, onBack: () => void }) => (
    <View style={s.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={s.loadTitle}>Memuat Survey...</Text>
        <TouchableOpacity onPress={onBack} style={s.linkBtn}>
            <ArrowLeft color={COLORS.sub} size={15} />
            <Text style={s.linkTxt}>Kembali</Text>
        </TouchableOpacity>
    </View>
));

const ErrorView = React.memo(({ error, onRetry, onBack }: { error: string, onRetry: () => void, onBack: () => void }) => (
    <View style={s.center}>
        <View style={[s.iconBox, { backgroundColor: COLORS.dangerL }]}>
            <AlertCircle color={COLORS.danger} size={28} />
        </View>
        <Text style={s.errorTitle}>Gagal Memuat</Text>
        <Text style={s.errorMsg}>{error || 'Data tidak ditemukan'}</Text>
        <TouchableOpacity onPress={onRetry} style={s.btn}>
            <RefreshCw color={COLORS.white} size={15} />
            <Text style={s.btnTxt}>Coba Lagi</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onBack} style={s.linkBtn}>
            <ArrowLeft color={COLORS.sub} size={15} />
            <Text style={s.linkTxt}>Kembali</Text>
        </TouchableOpacity>
    </View>
));

const SurveyHeader = React.memo(({ insets, survey, stats, onBack, saveStatus }: any) => (
    <View style={[s.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
            <ArrowLeft color={COLORS.text} size={20} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={s.headerSub}>Survey Form</Text>
                {saveStatus !== 'idle' && (
                    <Text style={[s.saveStatus, saveStatus === 'error' && { color: COLORS.danger }]}>
                        • {saveStatus === 'saving' ? 'Menyimpan...' : saveStatus === 'saved' ? 'Tersimpan' : 'Gagal Simpan'}
                    </Text>
                )}
            </View>
            <Text style={s.headerTitle} numberOfLines={1}>{survey?.applicantName ?? 'Applicant'}</Text>
        </View>
        <View style={[s.badge, stats.pct === 100 && { backgroundColor: COLORS.successL }]}>
            <Text style={[s.badgeTxt, stats.pct === 100 && { color: COLORS.success }]}>{stats.pct}%</Text>
        </View>
    </View>
));

const SurveyProgress = React.memo(({ stats }: any) => (
    <View style={s.progCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={s.progCardLabel}>Progress Keseluruhan</Text>
            <Text style={s.progCardCount}>{stats.done}/{stats.total} dijawab</Text>
        </View>
        <View style={s.progTrackLg}>
            <View style={[s.progFillLg, { width: `${stats.pct}%`, backgroundColor: stats.pct === 100 ? COLORS.success : COLORS.primary }]} />
        </View>
    </View>
));

const SectionList = React.memo(({ sections, answers, onSelectSection }: any) => {
    return (
        <View style={{ paddingHorizontal: 16 }}>
            <Text style={s.listTitle}>Daftar Bagian</Text>
            {sections.map((sec: any, idx: number) => {
                const qs = sec.questions ?? [];
                const done = qs.filter((q: any) => {
                    const a = answers[q.id];
                    return a !== undefined && a !== null && a !== '';
                }).length;
                const pct = qs.length > 0 ? Math.round((done / qs.length) * 100) : 0;
                const full = qs.length > 0 && done === qs.length;

                // Lock section if previous is not fully answered
                const isLocked = idx > 0 && (() => {
                    const prevQs = sections[idx - 1].questions ?? [];
                    return prevQs.filter((q: any) => {
                        const a = answers[q.id];
                        return a !== undefined && a !== null && a !== '';
                    }).length < prevQs.length;
                })();

                return (
                    <TouchableOpacity key={sec.id ?? idx}
                        onPress={() => {
                            if (isLocked) {
                                Alert.alert('Terkunci', 'Selesaikan bagian sebelumnya terlebih dahulu.');
                                return;
                            }
                            onSelectSection(sec);
                        }}
                        activeOpacity={isLocked ? 1 : 0.7}
                        style={[s.secCard, isLocked && { opacity: 0.5 }]}>

                        <View style={[s.secIconBox, { backgroundColor: isLocked ? COLORS.border : full ? COLORS.successL : COLORS.primaryL }]}>
                            {isLocked ? <Lock color={COLORS.muted} size={20} /> : full ? <CheckCircle2 color={COLORS.success} size={20} /> : <ClipboardList color={COLORS.primary} size={20} />}
                        </View>

                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                                <Text style={s.secIdx}>Bagian {idx + 1}</Text>
                                <Text style={[s.secStat, { color: isLocked ? COLORS.muted : full ? COLORS.success : COLORS.primary }]}>
                                    {isLocked ? 'Terkunci' : full ? 'Selesai' : `${done}/${qs.length}`}
                                </Text>
                            </View>
                            <Text style={[s.secName, isLocked && { color: COLORS.muted }]}>{sec.sectionName}</Text>
                            <View style={s.secProg}>
                                <View style={s.secProgTrack}>
                                    <View style={[s.secProgFill, { width: `${pct}%`, backgroundColor: isLocked ? COLORS.muted : full ? COLORS.success : COLORS.primary }]} />
                                </View>
                                <Text style={s.secProgTxt}>{pct}%</Text>
                            </View>
                        </View>
                        {!isLocked && <ChevronRight color={COLORS.muted} size={16} style={{ marginLeft: 8 }} />}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
});

const SubmitFooter = React.memo(({ stats, loading, onSubmit }: any) => (
    <View style={s.submitWrap}>
        <TouchableOpacity
            onPress={onSubmit}
            activeOpacity={0.8}
            disabled={!stats.isComplete || loading}
            style={[s.submitBtn, (!stats.isComplete || loading) && { opacity: 0.5 }]}
        >
            {loading ? <ActivityIndicator color={COLORS.white} /> : <><Send color={COLORS.white} size={17} /><Text style={s.submitTxt}>Kirim Survey</Text></>}
        </TouchableOpacity>
        {!stats.isComplete && (
            <Text style={s.submitHint}>Selesaikan semua pertanyaan terlebih dahulu</Text>
        )}
    </View>
));

const QuestionView = React.memo(({ insets, section, qIdx, setQIdx, answers, saveAnswer, onBack, setLightbox, saveStatus }: any) => {
    const qs = section.questions ?? [];
    const q = qs[qIdx];
    const isLast = qIdx === qs.length - 1;
    const pct = ((qIdx + 1) / qs.length) * 100;
    const [isListOpen, setIsListOpen] = useState(false);

    // Internal state for text input to not lag the UI
    const [localTxt, setLocalTxt] = useState(answers[q?.id] ?? '');

    // Sync localTxt when question changes (with formatting for NUMBER)
    useEffect(() => {
        const raw = answers[q?.id] ?? '';
        if (q?.answerType === 'NUMBER' && raw) {
            // Format existing value with dots
            const clean = String(raw).replace(/[^0-9]/g, '');
            setLocalTxt(clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
        } else {
            setLocalTxt(raw);
        }
    }, [q?.id, answers]);

    const handleNext = () => {
        const answer = answers[q.id];
        let hasAns = false;

        // Ambil nilai "bersih" (tanpa titik pemisah ribuan) untuk validasi & simpan
        const rawVal = q.answerType === 'NUMBER' ? String(localTxt).replace(/\./g, '') : String(localTxt);
        const ansVal = q.answerType === 'NUMBER' ? String(answer || '').replace(/\./g, '') : answer;

        if (q.answerType === 'BOOLEAN') {
            hasAns = answer !== undefined && answer !== null;
        } else if (q.answerType === 'IMAGE') {
            hasAns = Array.isArray(answer) && answer.length > 0;
        } else {
            const checkVal = (rawVal || String(ansVal || '')).trim();
            hasAns = checkVal !== '' && checkVal !== '[]';
        }

        if (!hasAns) {
            Alert.alert('Belum Dijawab', 'Tolong isi jawaban sebelum melanjutkan.');
            return;
        }

        // Validasi Angka yang lebih ketat (menggunakan nilai bersih)
        if (q.answerType === 'NUMBER') {
            const numStr = rawVal.trim();
            const num = parseInt(numStr);
            if (isNaN(num) || numStr === '') {
                Alert.alert('Angka Tidak Valid', 'Tolong masukkan format angka yang benar.');
                return;
            }

            // Simpan nilai bersih ke DB
            saveAnswer(q.id, numStr, q.answerType);
        } else if (q.answerType !== 'BOOLEAN' && localTxt !== (answers[q.id] ?? '')) {
            saveAnswer(q.id, localTxt, q.answerType);
        }

        if (!isLast) setQIdx((prev: number) => prev + 1);
        else onBack();
    };

    if (!q) return null;

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
            <View style={[s.qHead, { paddingTop: insets.top + 10 }]}>
                <View style={[s.qHeadRow, { marginBottom: 8 }]}>
                    <TouchableOpacity onPress={onBack} style={s.iconBtn}>
                        <ArrowLeft color={COLORS.text} size={20} />
                    </TouchableOpacity>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={s.qSectionName} numberOfLines={1}>{section.sectionName}</Text>
                        {saveStatus !== 'idle' && (
                            <Text style={[s.saveStatusSmall, saveStatus === 'error' && { color: COLORS.danger }]}>
                                {saveStatus === 'saving' ? 'Menyimpan...' : saveStatus === 'saved' ? 'Tersimpan' : 'Gagal'}
                            </Text>
                        )}
                    </View>
                    <TouchableOpacity onPress={() => setIsListOpen(true)} style={s.iconBtn}>
                        <ListTodo color={COLORS.primary} size={22} />
                    </TouchableOpacity>
                </View>
                <View style={s.progRow}>
                    <Text style={s.progLabel}>{qIdx + 1} / {qs.length}</Text>
                    <View style={s.progTrack}>
                        <View style={[s.progFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={s.progPct}>{Math.round(pct)}%</Text>
                </View>
            </View>

            <Modal visible={isListOpen} transparent animationType="slide">
                <Pressable style={s.overlay} onPress={() => setIsListOpen(false)}>
                    <View style={s.sheet}>
                        <View style={s.sheetTitleRow}>
                            <Text style={s.sheetTitle}>Daftar Pertanyaan</Text>
                            <TouchableOpacity onPress={() => setIsListOpen(false)}>
                                <X size={20} color={COLORS.sub} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={qs}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            renderItem={({ item, index }) => {
                                const ans = answers[item.id];
                                const isDone = ans !== undefined && ans !== null && ans !== '' && (Array.isArray(ans) ? ans.length > 0 : true);
                                const isActive = qIdx === index;

                                // Accessible if it's first OR all previous are done
                                let isLocked = false;
                                for (let i = 0; i < index; i++) {
                                    const prevA = answers[qs[i].id];
                                    if (prevA === undefined || prevA === null || prevA === '' || (Array.isArray(prevA) && prevA.length === 0)) {
                                        isLocked = true;
                                        break;
                                    }
                                }

                                return (
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (isLocked) return;
                                            setQIdx(index);
                                            setIsListOpen(false);
                                        }}
                                        disabled={isLocked}
                                        style={[
                                            s.sheetItem,
                                            isActive && { backgroundColor: COLORS.primaryL },
                                            isLocked && { opacity: 0.4 }
                                        ]}>
                                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                            <View style={[s.qCircle, isActive && { backgroundColor: COLORS.primary }, isDone && !isActive && { backgroundColor: COLORS.successL }]}>
                                                <Text style={[s.qCircleTxt, isActive && { color: '#fff' }, isDone && !isActive && { color: COLORS.success }]}>{index + 1}</Text>
                                            </View>
                                            <Text style={[s.sheetItemTxt, isActive && { fontWeight: '700', color: COLORS.primary }]} numberOfLines={1}>
                                                {item.questionText}
                                            </Text>
                                        </View>
                                        {isDone && <CheckCircle2 size={18} color={COLORS.success} />}
                                        {isLocked && <Lock size={16} color={COLORS.muted} />}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                </Pressable>
            </Modal>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
                <View style={s.qCard}>
                    <Text style={s.qNum}>Pertanyaan {qIdx + 1}</Text>
                    <Text style={s.qText}>{q.questionText}</Text>
                </View>

                <View style={{ marginTop: 20 }}>
                    <QuestionInput
                        q={q}
                        localTxt={localTxt}
                        setLocalTxt={(val: string) => {
                            setLocalTxt(val);
                            saveAnswer(q.id, val, q.answerType);
                        }}
                        answers={answers}
                        saveAnswer={saveAnswer}
                        setLightbox={setLightbox}
                    />
                </View>
            </ScrollView>

            <View style={s.qFooter}>
                <TouchableOpacity onPress={() => qIdx > 0 ? setQIdx((i: number) => i - 1) : onBack()} style={s.prevBtn}>
                    <ArrowLeft color={COLORS.sub} size={20} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleNext} style={[s.nextBtn, isLast && { backgroundColor: COLORS.success }]}>
                    <Text style={s.nextBtnTxt}>{isLast ? 'Selesai Bagian' : 'Lanjut'}</Text>
                    <ChevronRight color={COLORS.white} size={18} />
                </TouchableOpacity>
            </View>
        </View>
    );
});

const QuestionInput = React.memo(({ q, localTxt, setLocalTxt, answers, saveAnswer, setLightbox }: any) => {
    if (q.answerType === 'BOOLEAN') {
        return <BooleanInput q={q} answers={answers} saveAnswer={saveAnswer} />;
    }

    if (q.answerType === 'OPTION' || q.answerType === 'SELECT') {
        return <SelectInput q={q} answers={answers} saveAnswer={saveAnswer} />;
    }

    if (q.answerType === 'DATE') {
        return <DateInput q={q} answers={answers} saveAnswer={saveAnswer} />;
    }

    if (q.answerType === 'IMAGE') {
        return <ImageInput q={q} answers={answers} saveAnswer={saveAnswer} setLightbox={setLightbox} />;
    }

    return (
        <View>
            <TextInput
                style={s.textInput}
                placeholder={q.answerType === 'NUMBER' ? 'Contoh: 1.000.000' : 'Ketik jawaban...'}
                placeholderTextColor={COLORS.muted}
                keyboardType={q.answerType === 'NUMBER' ? 'numeric' : 'default'}
                multiline={q.answerType !== 'NUMBER'}
                value={localTxt}
                onChangeText={(v) => {
                    if (q.answerType === 'NUMBER') {
                        // Hanya ambil angka
                        const clean = v.replace(/[^0-9]/g, '');
                        // Format ribuan dengan titik (contoh: 1.000.000)
                        const formatted = clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                        setLocalTxt(formatted);
                    } else {
                        setLocalTxt(v);
                    }
                }}
            />
            {q.answerType === 'NUMBER' && localTxt !== '' && (
                <Text style={{ fontSize: 13, color: COLORS.sub, marginTop: 8, fontWeight: '600' }}>
                    Rp {localTxt}
                </Text>
            )}
        </View>
    );
});

// ── Input Type Components ──────────────────────────────────────────

const BooleanInput = React.memo(({ q, answers, saveAnswer }: any) => (
    <View style={{ flexDirection: 'row', gap: 12 }}>
        {[{ v: true, label: 'Ya' }, { v: false, label: 'Tidak' }].map(opt => {
            const active = answers[q.id] === opt.v;
            const color = opt.v ? COLORS.success : COLORS.danger;
            return (
                <TouchableOpacity key={String(opt.v)}
                    onPress={() => saveAnswer(q.id, opt.v, 'BOOLEAN')}
                    style={[s.boolBtn, active && { backgroundColor: color, borderColor: color }]}>
                    <Text style={[s.boolTxt, { color: active ? COLORS.white : COLORS.sub }]}>{opt.label}</Text>
                </TouchableOpacity>
            );
        })}
    </View>
));

const SelectInput = React.memo(({ q, answers, saveAnswer }: any) => {
    const [pickerOpen, setPickerOpen] = useState(false);
    return (
        <>
            <TouchableOpacity onPress={() => setPickerOpen(true)} style={s.selectTrigger}>
                <Text style={[s.selectVal, !answers[q.id] && { color: COLORS.muted }]}>
                    {q.options?.find((o: any) => o.optionValue === answers[q.id])?.optionText ||
                        q.options?.find((o: any) => o.optionValue === answers[q.id])?.optionLabel ||
                        'Pilih jawaban...'}
                </Text>
                <ChevronDown color={COLORS.sub} size={18} />
            </TouchableOpacity>
            <Modal visible={pickerOpen} transparent animationType="slide">
                <Pressable style={s.overlay} onPress={() => setPickerOpen(false)}>
                    <View style={s.sheet}>
                        <Text style={s.sheetTitle}>Pilih Opsi</Text>
                        <FlatList
                            data={q.options ?? []}
                            keyExtractor={(o, i) => o.id ?? String(i)}
                            renderItem={({ item: opt }) => {
                                const active = answers[q.id] === opt.optionValue;
                                const label = opt.optionText || opt.optionLabel || opt.optionValue || 'Tanpa Label';
                                return (
                                    <TouchableOpacity
                                        onPress={() => { saveAnswer(q.id, opt.optionValue, 'TEXT'); setPickerOpen(false); }}
                                        style={[s.sheetItem, active && { backgroundColor: COLORS.primaryL }]}>
                                        <Text style={[s.sheetItemTxt, active && { color: COLORS.primary, fontWeight: '700' }]}>{label}</Text>
                                        {active && <CheckCircle size={15} color={COLORS.primary} />}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                </Pressable>
            </Modal>
        </>
    );
});

const DateInput = React.memo(({ q, answers, saveAnswer }: any) => {
    const currentVal = answers[q.id] || '';
    const [showDateModal, setShowDateModal] = useState(false);

    // Internal temp state for values during modal editing
    const [tempD, setTempD] = useState(currentVal && !currentVal.startsWith('0001') ? currentVal.split('-')[2] : "01");
    const [tempM, setTempM] = useState(currentVal && !currentVal.startsWith('0001') ? currentVal.split('-')[1] : "01");
    const [tempY, setTempY] = useState(currentVal && !currentVal.startsWith('0001') ? currentVal.split('-')[0] : String(new Date().getFullYear()));

    const formatDisplay = (iso: string) => {
        if (!iso || iso.startsWith('0001')) return 'Pilih tanggal...';
        const [y, m, d] = iso.split('-');
        return `${d}-${m}-${y}`;
    };

    const handleConfirm = () => {
        const d = parseInt(tempD);
        const m = parseInt(tempM);
        const y = parseInt(tempY);

        if (isNaN(d) || d < 1 || d > 31) {
            Alert.alert('Tanggal Tidak Valid', 'Masukkan tanggal antara 1 sampai 31.');
            return;
        }
        if (isNaN(m) || m < 1 || m > 12) {
            Alert.alert('Bulan Tidak Valid', 'Masukkan bulan antara 1 sampai 12.');
            return;
        }

        // Validasi kalender (misal: cek tanggal 31 di bulan yang hanya punya 30 hari)
        const dateObj = new Date(y, m - 1, d);
        if (dateObj.getFullYear() !== y || dateObj.getMonth() !== (m - 1) || dateObj.getDate() !== d) {
            Alert.alert('Format Tidak Valid', 'Kombinasi tanggal tersebut tidak ada dalam kalender.');
            return;
        }

        const iso = `${tempY}-${String(tempM).padStart(2, '0')}-${String(tempD).padStart(2, '0')}`;
        saveAnswer(q.id, iso, 'DATE');
        setShowDateModal(false);
    };

    return (
        <>
            <TouchableOpacity onPress={() => setShowDateModal(true)} style={s.selectTrigger}>
                <Text style={[s.selectVal, (!currentVal || currentVal.startsWith('0001')) && { color: COLORS.muted }]}>
                    {formatDisplay(currentVal)}
                </Text>
                <CalendarIcon color={COLORS.primary} size={18} />
            </TouchableOpacity>

            <Modal visible={showDateModal} transparent animationType="fade">
                <View style={s.overlay}>
                    <View style={[s.sheet, { padding: 24, maxHeight: undefined }]}>
                        <Text style={[s.sheetTitle, { padding: 0, borderBottomWidth: 0, marginBottom: 20 }]}>Pilih Tanggal</Text>

                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 30 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={s.progCardLabel}>Tgl</Text>
                                <View style={s.selectTrigger}>
                                    <TextInput
                                        value={tempD}
                                        onChangeText={(v) => {
                                            const clean = v.replace(/[^0-9]/g, '');
                                            if (clean === '' || (parseInt(clean) >= 0 && parseInt(clean) <= 31)) setTempD(clean);
                                        }}
                                        keyboardType="numeric" maxLength={2} placeholder="01"
                                        style={{ color: COLORS.text, fontWeight: '700', flex: 1, padding: 0 }}
                                    />
                                </View>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.progCardLabel}>Bln</Text>
                                <View style={s.selectTrigger}>
                                    <TextInput
                                        value={tempM}
                                        onChangeText={(v) => {
                                            const clean = v.replace(/[^0-9]/g, '');
                                            if (clean === '' || (parseInt(clean) >= 0 && parseInt(clean) <= 12)) setTempM(clean);
                                        }}
                                        keyboardType="numeric" maxLength={2} placeholder="01"
                                        style={{ color: COLORS.text, fontWeight: '700', flex: 1, padding: 0 }}
                                    />
                                </View>
                            </View>
                            <View style={{ flex: 1.5 }}>
                                <Text style={s.progCardLabel}>Thn</Text>
                                <View style={s.selectTrigger}>
                                    <TextInput
                                        value={tempY}
                                        onChangeText={(v) => setTempY(v.replace(/[^0-9]/g, ''))}
                                        keyboardType="numeric" maxLength={4} placeholder="2024"
                                        style={{ color: COLORS.text, fontWeight: '700', flex: 1, padding: 0 }}
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity onPress={() => setShowDateModal(false)} style={[s.btn, { flex: 1, backgroundColor: COLORS.border, marginBottom: 0 }]}>
                                <Text style={[s.btnTxt, { color: COLORS.text }]}>Batal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleConfirm} style={[s.btn, { flex: 1, marginBottom: 0 }]}>
                                <Text style={s.btnTxt}>Simpan</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
});

const ImageInput = React.memo(({ q, answers, saveAnswer, setLightbox }: any) => {
    const pickPhoto = async () => {
        if (Platform.OS === 'android') {
            const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
            if (result !== PermissionsAndroid.RESULTS.GRANTED) {
                Alert.alert('Izin Ditolak', 'Kamera tidak dapat diakses.');
                return;
            }
        }
        launchCamera({ mediaType: 'photo', quality: 0.8, saveToPhotos: false }, (res) => {
            if (res.didCancel || res.errorCode) return;
            const uri = res.assets?.[0]?.uri;
            if (uri) {
                const prev = Array.isArray(answers[q.id]) ? answers[q.id] : [];
                saveAnswer(q.id, [...prev, uri], 'IMAGE');
            }
        });
    };

    return (
        <View style={{ gap: 12 }}>
            {Array.isArray(answers[q.id]) && answers[q.id].length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {answers[q.id].map((uri: string, i: number) => (
                        <TouchableOpacity key={i} onPress={() => setLightbox({ uris: answers[q.id], index: i })} style={s.thumb}>
                            <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                            <TouchableOpacity onPress={() => saveAnswer(q.id, answers[q.id].filter((_: any, j: number) => j !== i), 'IMAGE')} style={s.thumbDel}>
                                <X color="#fff" size={11} />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
            <TouchableOpacity onPress={pickPhoto} style={s.photoBtn}>
                <Camera color={COLORS.primary} size={22} />
                <View>
                    <Text style={s.photoBtnTitle}>{answers[q.id]?.length > 0 ? `Tambah Foto (${answers[q.id].length})` : 'Ambil Foto'}</Text>
                    <Text style={s.photoBtnSub}>Bisa lebih dari 1 foto</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
});


const ImageLightbox = React.memo(({ lightbox, onClose }: any) => {
    const [activeIndex, setActiveIndex] = useState(lightbox.index || 0);

    const onScroll = (event: any) => {
        const x = event.nativeEvent.contentOffset.x;
        const index = Math.round(x / SW);
        if (index !== activeIndex) {
            setActiveIndex(index);
        }
    };

    return (
        <Modal visible animationType="fade" transparent statusBarTranslucent>
            <View style={{ flex: 1, backgroundColor: '#000' }}>
                <View style={[s.lbHeader, { paddingTop: Platform.OS === 'ios' ? 60 : 40 }]}>
                    <Text style={s.lbCount}>{activeIndex + 1} / {lightbox.uris.length}</Text>
                    <TouchableOpacity
                        onPress={onClose}
                        style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20 }}
                    >
                        <X color="#fff" size={24} />
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={lightbox.uris}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    initialScrollIndex={lightbox.index}
                    getItemLayout={(_, i) => ({ length: SW, offset: SW * i, index: i })}
                    keyExtractor={(_, i) => String(i)}
                    onMomentumScrollEnd={onScroll}
                    renderItem={({ item }) => (
                        <View style={{ width: SW, height: SH - 100, justifyContent: 'center', alignItems: 'center' }}>
                            <Image
                                source={{ uri: item }}
                                style={{ width: SW, height: SH * 0.8 }}
                                resizeMode="contain"
                            />
                        </View>
                    )}
                />

                <View style={{ paddingBottom: 40, alignItems: 'center' }}>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600' }}>
                        Geser untuk melihat foto lainnya
                    </Text>
                </View>
            </View>
        </Modal>
    );
});

// ════════════════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
    center: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center', padding: 32 },
    iconBox: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    loadTitle: { fontSize: 15, color: COLORS.sub, marginTop: 14, marginBottom: 24 },
    errorTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
    errorMsg: { fontSize: 13, color: COLORS.sub, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    btn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 12, marginBottom: 12 },
    btnTxt: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
    linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12 },
    linkTxt: { color: COLORS.sub, fontWeight: '600', fontSize: 13 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
    headerSub: { fontSize: 11, color: COLORS.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginTop: 2 },
    badge: { backgroundColor: COLORS.primaryL, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    badgeTxt: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
    progCard: { marginHorizontal: 16, marginBottom: 20, backgroundColor: COLORS.card, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: COLORS.border },
    progCardLabel: { fontSize: 13, color: COLORS.sub, fontWeight: '600' },
    progCardCount: { fontSize: 13, color: COLORS.text, fontWeight: '700' },
    progTrackLg: { height: 6, backgroundColor: COLORS.border, borderRadius: 99, overflow: 'hidden' },
    progFillLg: { height: '100%', borderRadius: 99 },
    listTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
    secCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
    secIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    secIdx: { fontSize: 11, color: COLORS.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    secStat: { fontSize: 12, fontWeight: '700' },
    secName: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
    secProg: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    secProgTrack: { flex: 1, height: 3, backgroundColor: COLORS.border, borderRadius: 99, overflow: 'hidden' },
    secProgFill: { height: '100%', borderRadius: 99 },
    secProgTxt: { fontSize: 11, color: COLORS.muted, fontWeight: '600', width: 28, textAlign: 'right' },
    submitWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 28, backgroundColor: COLORS.bg, borderTopWidth: 1, borderTopColor: COLORS.border },
    submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.primary, height: 52, borderRadius: 14 },
    submitTxt: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
    submitHint: { textAlign: 'center', color: COLORS.muted, fontSize: 11, marginTop: 8 },
    qHead: { backgroundColor: COLORS.card, paddingHorizontal: 16, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    qHeadRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    qSectionName: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
    progRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    progLabel: { fontSize: 12, color: COLORS.muted, fontWeight: '600', width: 36 },
    progTrack: { flex: 1, height: 4, backgroundColor: COLORS.border, borderRadius: 99, overflow: 'hidden' },
    progFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 99 },
    progPct: { fontSize: 12, fontWeight: '700', color: COLORS.primary, width: 34, textAlign: 'right' },
    qCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.border },
    qNum: { fontSize: 11, color: COLORS.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
    qText: { fontSize: 18, fontWeight: '700', color: COLORS.text, lineHeight: 28 },
    boolBtn: { flex: 1, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.card },
    boolTxt: { fontSize: 15, fontWeight: '700' },
    selectTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.card, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
    selectVal: { fontSize: 15, fontWeight: '600', color: COLORS.text },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: Dimensions.get('window').height * 0.65, paddingBottom: 32 },
    sheetTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    sheetItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    sheetItemTxt: { fontSize: 15, color: COLORS.text, fontWeight: '500' },
    thumb: { width: 86, height: 86, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
    thumbDel: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, padding: 4 },
    photoBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORS.card, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border },
    photoBtnTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
    photoBtnSub: { fontSize: 12, color: COLORS.muted },
    textInput: { backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 16, fontSize: 15, color: COLORS.text, minHeight: 140, textAlignVertical: 'top' },
    qFooter: { flexDirection: 'row', padding: 16, paddingBottom: 28, backgroundColor: COLORS.bg, gap: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
    prevBtn: { width: 52, height: 52, borderRadius: 14, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
    nextBtn: { flex: 1, backgroundColor: COLORS.primary, height: 52, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    nextBtnTxt: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
    lbHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 },
    lbCount: { color: '#fff', fontSize: 14, fontWeight: '600' },
    sheetTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    qCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
    qCircleTxt: { fontSize: 12, fontWeight: '700', color: COLORS.sub },
    saveStatus: { fontSize: 10, fontWeight: '600', color: COLORS.success, textTransform: 'uppercase', letterSpacing: 0.5 },
    saveStatusSmall: { fontSize: 10, color: COLORS.success, fontWeight: '700', marginTop: -2 },
});