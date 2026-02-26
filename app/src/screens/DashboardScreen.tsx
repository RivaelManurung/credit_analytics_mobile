import React from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    SafeAreaView,
} from 'react-native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { currentUser, kunjunganHariIni, formatRupiah } from '../data/mockData';
import { Kunjungan, RootDrawerParamList, RootStackParamList } from '../types';

type DashboardNav = DrawerNavigationProp<RootDrawerParamList, 'Main'> &
    NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

const DashboardScreen: React.FC = () => {
    const navigation = useNavigation<DashboardNav>();

    const renderKunjunganItem = ({ item }: { item: Kunjungan }) => (
        <View style={styles.card}>
            {/* Nama & Nomor Pinjaman */}
            <View style={styles.cardHeader}>
                <Text style={styles.namaNasabah}>{item.nasabah.nama}</Text>
                <Text style={styles.nomorPinjaman}>ID: {item.nasabah.nomorPinjaman}</Text>
            </View>

            {/* Jumlah Pinjaman */}
            <View style={styles.pinjamanContainer}>
                <Text style={styles.pinjamanLabel}>Jumlah Pinjaman</Text>
                <Text style={styles.pinjamanNominal}>
                    {formatRupiah(item.nasabah.jumlahPinjaman)}
                </Text>
            </View>

            {/* Alamat */}
            <View style={styles.alamatRow}>
                <Text style={styles.alamatIcon}>📍</Text>
                <Text style={styles.alamatText} numberOfLines={2}>
                    {item.nasabah.alamat}
                </Text>
            </View>

            {/* Tombol Mulai Survey */}
            <TouchableOpacity
                style={styles.surveyButton}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Survey', { kunjungan: item })}>
                <Text style={styles.surveyButtonText}>Mulai Survey</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />

            {/* Header Bar */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.hamburger}
                    onPress={() => navigation.openDrawer()}
                    activeOpacity={0.7}>
                    <View style={styles.hamburgerLine} />
                    <View style={styles.hamburgerLine} />
                    <View style={styles.hamburgerLine} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>CA Mobile Survey</Text>
                <View style={styles.avatarSmall}>
                    <Text style={styles.avatarSmallText}>
                        {currentUser.nama.charAt(0)}
                    </Text>
                </View>
            </View>

            <FlatList
                data={kunjunganHariIni}
                keyExtractor={(item) => item.id}
                renderItem={renderKunjunganItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <>
                        {/* Kartu Selamat Datang */}
                        <View style={styles.welcomeCard}>
                            <Text style={styles.welcomeGreeting}>Selamat datang,</Text>
                            <Text style={styles.welcomeName}>{currentUser.nama}</Text>
                            <View style={styles.badgeRow}>
                                <View style={styles.badge}>
                                    <Text style={styles.badgeNumber}>
                                        {kunjunganHariIni.length}
                                    </Text>
                                </View>
                                <Text style={styles.badgeLabel}>Kunjungan Hari Ini</Text>
                            </View>
                        </View>

                        {/* Judul List */}
                        <Text style={styles.sectionTitle}>Daftar Kunjungan Hari Ini</Text>
                    </>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📋</Text>
                        <Text style={styles.emptyText}>Tidak ada kunjungan hari ini</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },

    /* ── Header ── */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 14,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    hamburger: {
        padding: 4,
        marginRight: 12,
        justifyContent: 'center',
    },
    hamburgerLine: {
        width: 22,
        height: 2.5,
        backgroundColor: Colors.white,
        borderRadius: 2,
        marginBottom: 4,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: Colors.white,
        letterSpacing: 0.3,
    },
    avatarSmall: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarSmallText: {
        color: Colors.primary,
        fontSize: 16,
        fontWeight: '700',
    },

    /* ── Welcome Card ── */
    welcomeCard: {
        backgroundColor: Colors.primary,
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
        borderRadius: 16,
        padding: 20,
        elevation: 3,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    welcomeGreeting: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 2,
    },
    welcomeName: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.white,
        marginBottom: 16,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    badge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    badgeNumber: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: '800',
    },
    badgeLabel: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: '500',
        opacity: 0.9,
    },

    /* ── Section Title ── */
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginHorizontal: 16,
        marginTop: 20,
        marginBottom: 12,
    },

    /* ── List ── */
    listContent: {
        paddingBottom: 24,
    },

    /* ── Kartu Nasabah ── */
    card: {
        backgroundColor: Colors.cardBackground,
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 14,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    cardHeader: {
        marginBottom: 12,
    },
    namaNasabah: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 3,
    },
    nomorPinjaman: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    pinjamanContainer: {
        backgroundColor: Colors.primaryLight,
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    pinjamanLabel: {
        fontSize: 12,
        color: Colors.primary,
        fontWeight: '500',
        marginBottom: 4,
    },
    pinjamanNominal: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.primary,
        letterSpacing: 0.5,
    },
    alamatRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    alamatIcon: {
        fontSize: 14,
        marginRight: 6,
        marginTop: 1,
    },
    alamatText: {
        flex: 1,
        fontSize: 13,
        color: Colors.textSecondary,
        lineHeight: 18,
    },

    /* ── Tombol Survey ── */
    surveyButton: {
        backgroundColor: Colors.primary,
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        elevation: 2,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    surveyButtonText: {
        color: Colors.white,
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.5,
    },

    /* ── Empty ── */
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 15,
        color: Colors.textSecondary,
    },
});

export default DashboardScreen;
