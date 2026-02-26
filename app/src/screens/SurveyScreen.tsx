import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    SafeAreaView,
    TextInput,
    Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../types';
import { formatRupiah } from '../data/mockData';

type SurveyRouteProp = RouteProp<RootStackParamList, 'Survey'>;
type SurveyNavProp = NativeStackNavigationProp<RootStackParamList, 'Survey'>;
``
const SurveyScreen: React.FC = () => {
    const navigation = useNavigation<SurveyNavProp>();
    const route = useRoute<SurveyRouteProp>();
    const { kunjungan } = route.params;
    const { nasabah } = kunjungan;

    const [pendapatan, setPendapatan] = useState('');
    const [pengeluaran, setPengeluaran] = useState('');
    const [pekerjaan, setPekerjaan] = useState('');
    const [tanggungan, setTanggungan] = useState('');
    const [kondisiRumah, setKondisiRumah] = useState<string | null>(null);
    const [catatan, setCatatan] = useState('');

    const kondisiOptions = ['Milik Sendiri', 'Kontrak/Sewa', 'Menumpang', 'Lainnya'];

    const handleSelesai = () => {
        if (!pendapatan || !pekerjaan || !kondisiRumah) {
            Alert.alert(
                'Data Belum Lengkap',
                'Mohon isi pendapatan, pekerjaan, dan kondisi rumah terlebih dahulu.',
                [{ text: 'OK' }],
            );
            return;
        }
        Alert.alert(
            'Konfirmasi',
            'Apakah data survey sudah benar dan siap disimpan?',
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Simpan',
                    onPress: () => {
                        navigation.navigate('SurveySelesai', { kunjunganId: kunjungan.id });
                    },
                },
            ],
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}>
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Formulir Survey</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled">

                {/* Info Nasabah */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoCardTitle}>Data Nasabah</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Nama</Text>
                        <Text style={styles.infoValue}>{nasabah.nama}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>ID Pinjaman</Text>
                        <Text style={styles.infoValue}>{nasabah.nomorPinjaman}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Plafon</Text>
                        <Text style={[styles.infoValue, styles.infoValueBlue]}>
                            {formatRupiah(nasabah.jumlahPinjaman)}
                        </Text>
                    </View>
                    <View style={[styles.infoRow, styles.infoRowLast]}>
                        <Text style={styles.infoLabel}>Alamat</Text>
                        <Text style={[styles.infoValue, styles.infoValueWrap]}>
                            {nasabah.alamat}
                        </Text>
                    </View>
                </View>

                {/* Formulir */}
                <View style={styles.formSection}>
                    <Text style={styles.formSectionTitle}>Data Ekonomi</Text>

                    {/* Pekerjaan */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>
                            Pekerjaan <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Contoh: Pedagang, PNS, Wiraswasta"
                            placeholderTextColor={Colors.gray400}
                            value={pekerjaan}
                            onChangeText={setPekerjaan}
                        />
                    </View>

                    {/* Pendapatan */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>
                            Pendapatan Bulanan (Rp) <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Contoh: 5000000"
                            placeholderTextColor={Colors.gray400}
                            value={pendapatan}
                            onChangeText={setPendapatan}
                            keyboardType="numeric"
                        />
                    </View>

                    {/* Pengeluaran */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Pengeluaran Bulanan (Rp)</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Contoh: 3000000"
                            placeholderTextColor={Colors.gray400}
                            value={pengeluaran}
                            onChangeText={setPengeluaran}
                            keyboardType="numeric"
                        />
                    </View>

                    {/* Jumlah Tanggungan */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Jumlah Tanggungan</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Contoh: 3"
                            placeholderTextColor={Colors.gray400}
                            value={tanggungan}
                            onChangeText={setTanggungan}
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                {/* Kondisi Rumah */}
                <View style={styles.formSection}>
                    <Text style={styles.formSectionTitle}>Kondisi Tempat Tinggal</Text>
                    <Text style={styles.inputLabel}>
                        Status Kepemilikan <Text style={styles.required}>*</Text>
                    </Text>
                    <View style={styles.optionGrid}>
                        {kondisiOptions.map((opt) => (
                            <TouchableOpacity
                                key={opt}
                                style={[
                                    styles.optionButton,
                                    kondisiRumah === opt && styles.optionButtonSelected,
                                ]}
                                onPress={() => setKondisiRumah(opt)}
                                activeOpacity={0.75}>
                                <Text
                                    style={[
                                        styles.optionText,
                                        kondisiRumah === opt && styles.optionTextSelected,
                                    ]}>
                                    {opt}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Catatan */}
                <View style={styles.formSection}>
                    <Text style={styles.formSectionTitle}>Catatan Tambahan</Text>
                    <TextInput
                        style={[styles.textInput, styles.textArea]}
                        placeholder="Catatan observasi lapangan..."
                        placeholderTextColor={Colors.gray400}
                        value={catatan}
                        onChangeText={setCatatan}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

                {/* Tombol Selesai */}
                <TouchableOpacity
                    style={styles.submitButton}
                    activeOpacity={0.85}
                    onPress={handleSelesai}>
                    <Text style={styles.submitButtonText}>Selesaikan Survey</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 14,
        elevation: 4,
    },
    backButton: {
        padding: 4,
        marginRight: 8,
    },
    backArrow: {
        color: Colors.white,
        fontSize: 22,
        fontWeight: '700',
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: Colors.white,
        textAlign: 'center',
        marginRight: 32,
    },
    headerRight: {
        width: 32,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },

    /* ── Info Card ── */
    infoCard: {
        backgroundColor: Colors.white,
        borderRadius: 14,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    infoCardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.primary,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    infoRowLast: {
        borderBottomWidth: 0,
    },
    infoLabel: {
        fontSize: 13,
        color: Colors.textSecondary,
        flex: 1,
    },
    infoValue: {
        fontSize: 13,
        color: Colors.textPrimary,
        fontWeight: '600',
        flex: 2,
        textAlign: 'right',
    },
    infoValueBlue: {
        color: Colors.primary,
    },
    infoValueWrap: {
        flexShrink: 1,
        textAlign: 'right',
    },

    /* ── Form Sections ── */
    formSection: {
        backgroundColor: Colors.white,
        borderRadius: 14,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    formSectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.gray800,
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    inputGroup: {
        marginBottom: 14,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: 6,
    },
    required: {
        color: Colors.danger,
    },
    textInput: {
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        color: Colors.textPrimary,
        backgroundColor: Colors.gray50,
    },
    textArea: {
        height: 100,
        paddingTop: 12,
    },

    /* ── Option Buttons ── */
    optionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 8,
    },
    optionButton: {
        flex: 1,
        minWidth: '40%',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: Colors.border,
        alignItems: 'center',
        backgroundColor: Colors.gray50,
    },
    optionButtonSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    optionText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    optionTextSelected: {
        color: Colors.white,
    },

    /* ── Submit ── */
    submitButton: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 4,
        elevation: 3,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
    },
    submitButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});

export default SurveyScreen;
