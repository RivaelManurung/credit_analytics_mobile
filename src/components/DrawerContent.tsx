import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
} from 'react-native';
import { DrawerContentScrollView, DrawerContentComponentProps } from '@react-navigation/drawer';
import { Colors } from '../theme/colors';
import { currentUser } from '../data/mockData';

const DrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
    const { navigation, state } = props;
    const activeRouteName = state.routes[state.index]?.name;

    const menuItems = [
        { name: 'Dashboard', label: 'Dashboard', icon: '🏠' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                        {currentUser.nama.charAt(0).toUpperCase()}
                    </Text>
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{currentUser.nama}</Text>
                    <Text style={styles.userJabatan}>{currentUser.jabatan}</Text>
                </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Menu Items */}
            <DrawerContentScrollView
                {...props}
                contentContainerStyle={styles.scrollContainer}
                scrollEnabled={false}>
                {menuItems.map((item) => {
                    const isActive = activeRouteName === item.name;
                    return (
                        <TouchableOpacity
                            key={item.name}
                            style={[styles.menuItem, isActive && styles.menuItemActive]}
                            onPress={() => navigation.navigate(item.name)}
                            activeOpacity={0.7}>
                            <Text style={styles.menuIcon}>{item.icon}</Text>
                            <Text
                                style={[
                                    styles.menuLabel,
                                    isActive && styles.menuLabelActive,
                                ]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </DrawerContentScrollView>

            {/* Tombol Keluar */}
            <View style={styles.footer}>
                <View style={styles.divider} />
                <TouchableOpacity
                    style={styles.logoutButton}
                    activeOpacity={0.7}
                    onPress={() => {
                        // TODO: handle logout
                    }}>
                    <Text style={styles.logoutIcon}>→</Text>
                    <Text style={styles.logoutText}>Keluar</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 20,
        backgroundColor: Colors.white,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: Colors.white,
        fontSize: 20,
        fontWeight: '700',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    userJabatan: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginHorizontal: 0,
    },
    scrollContainer: {
        paddingTop: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        marginHorizontal: 12,
        marginVertical: 2,
        borderRadius: 10,
    },
    menuItemActive: {
        backgroundColor: Colors.primary,
    },
    menuIcon: {
        fontSize: 20,
        marginRight: 14,
    },
    menuLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: Colors.textPrimary,
    },
    menuLabelActive: {
        color: Colors.white,
        fontWeight: '600',
    },
    footer: {
        paddingBottom: 24,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        marginHorizontal: 12,
        marginTop: 8,
        borderRadius: 10,
        backgroundColor: Colors.dangerLight,
    },
    logoutIcon: {
        fontSize: 18,
        marginRight: 14,
        color: Colors.danger,
        transform: [{ scaleX: -1 }],
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.danger,
    },
});

export default DrawerContent;
