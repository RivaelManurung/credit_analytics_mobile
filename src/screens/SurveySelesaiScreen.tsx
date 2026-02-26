import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'SurveySelesai'>;

const SurveySelesaiScreen: React.FC = () => {
    const navigation = useNavigation<NavProp>();

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />
            <View style={styles.container}>
                <View style={styles.iconCircle}>
                    <Text style={styles.iconText}>✓</Text>
                </View>
                <Text style={styles.title}>Survey Selesai!</Text>
                <Text style={styles.subtitle}>
                    Data survey berhasil disimpan.{'\n'}Terima kasih atas kunjungannya.
                </Text>
                <TouchableOpacity
                    style={styles.button}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('Dashboard')}>
                    <Text style={styles.buttonText}>Kembali ke Dashboard</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.success,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        elevation: 6,
        shadowColor: Colors.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
    },
    iconText: {
        color: Colors.white,
        fontSize: 48,
        fontWeight: '800',
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: Colors.textPrimary,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 15,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 40,
    },
    button: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 40,
        elevation: 3,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
    },
    buttonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
});

export default SurveySelesaiScreen;
