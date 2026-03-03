import React, { useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { useApplications } from '../hooks/useApplications';
import { ChevronRight, Users, Search, Info } from 'lucide-react-native';
import { SidebarLayout } from '../components/Layout/SidebarLayout';
import { ApplicationMapper, DisplayApplication } from '../utils/ApplicationMapper';

const STATUS_CONFIG: Record<string, any> = {
    PENDING: { label: 'Menunggu', color: '#6B7280', bg: 'bg-slate-50', dot: 'bg-slate-400' },
    APPROVED: { label: 'Disetujui', color: '#10B981', bg: 'bg-emerald-50', dot: 'bg-emerald-600' },
    REJECTED: { label: 'Ditolak', color: '#e11d48', bg: 'bg-rose-50', dot: 'bg-rose-600' },
};

export const ApplicationListScreen: React.FC = () => {
    const { data: applications = [], isLoading: loading, error, refetch } = useApplications();

    const displayApplications = useMemo(() => {
        return (applications as any[]).map(app => ApplicationMapper.toDisplay(app));
    }, [applications]);

    const renderItem = ({ item }: { item: DisplayApplication }) => {
        const config = STATUS_CONFIG[item.status] || {
            label: item.status,
            color: '#6B7280',
            bg: 'bg-slate-50',
            dot: 'bg-slate-400'
        };

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-slate-100 flex-row items-center"
            >
                <View className="w-12 h-12 rounded-2xl bg-slate-50 items-center justify-center border border-slate-100 mr-4">
                    <Text className="text-slate-600 font-black text-lg">{item.applicantName.charAt(0)}</Text>
                </View>

                <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-dark font-bold text-[15px]" numberOfLines={1}>
                            {item.applicantName}
                        </Text>
                        <View className={`flex-row items-center px-2 py-0.5 rounded-full ${config.bg}`}>
                            <View className={`w-1.5 h-1.5 rounded-full ${config.dot} mr-1.5`} />
                            <Text className="text-[9px] font-black tracking-tight uppercase" style={{ color: config.color }}>
                                {config.label}
                            </Text>
                        </View>
                    </View>

                    <Text className="text-slate-400 font-medium text-[10px] tracking-wider uppercase mb-3">
                        #{item.displayId}
                    </Text>

                    <View className="flex-row items-center gap-4">
                        <View className="bg-slate-50/50 px-3 py-1.5 rounded-xl border border-slate-100 flex-1">
                            <Text className="text-slate-400 text-[8px] uppercase font-bold tracking-widest">Plafon</Text>
                            <Text className="text-dark font-black text-[12px]">{item.amount}</Text>
                        </View>
                        <View className="bg-slate-50/50 px-3 py-1.5 rounded-xl border border-slate-100">
                            <Text className="text-slate-400 text-[8px] uppercase font-bold tracking-widest">Tenor</Text>
                            <Text className="text-dark font-black text-[12px]">{item.tenor}</Text>
                        </View>
                    </View>
                </View>

                <View className="ml-3 bg-slate-50 p-2 rounded-xl">
                    <ChevronRight color="#94A3B8" size={16} strokeWidth={3} />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SidebarLayout headerTitle="Database Nasabah">
            <View className="flex-1 bg-slate-50">
                {/* Brand Header */}
                <View className="bg-white px-6 pt-6 pb-8 border-b border-slate-100 mb-6">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-[3px] mb-2">Registration system</Text>
                    <View className="flex-row justify-between items-center">
                        <Text className="text-dark text-3xl font-black italic">Database <Text className="text-primary not-italic">Nasabah</Text></Text>
                        <View className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center border border-slate-100">
                            <Users color="#64748B" size={20} />
                        </View>
                    </View>
                </View>

                <View className="flex-1 px-6">
                    {/* Search Bar - Aesthetic only for now or functional if we add search logic */}
                    <View className="flex-row items-center bg-white px-4 py-3 rounded-2xl border border-slate-100 mb-6 shadow-sm">
                        <Search color="#94A3B8" size={18} />
                        <TextInput
                            placeholder="Cari Nasabah..."
                            placeholderTextColor="#94A3B8"
                            className="flex-1 ml-3 text-dark font-medium text-sm"
                        />
                    </View>

                    {error && (
                        <View className="bg-rose-50 p-4 rounded-2xl mb-6 border border-rose-100 flex-row items-center">
                            <Info color="#e11d48" size={16} />
                            <Text className="text-rose-600 font-bold text-[11px] ml-2">Gagal menghubungkan ke database nasabah.</Text>
                        </View>
                    )}

                    {loading && !displayApplications.length ? (
                        <View className="flex-1 justify-center items-center pb-20">
                            <ActivityIndicator size="small" color="#2563EB" />
                            <Text className="text-slate-400 mt-4 font-black text-[10px] uppercase tracking-widest">Sinkronisasi...</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={displayApplications}
                            keyExtractor={(item) => item.id}
                            renderItem={renderItem}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 100 }}
                            refreshControl={
                                <RefreshControl refreshing={loading} onRefresh={refetch} tintColor="#2563EB" />
                            }
                            ListEmptyComponent={
                                !loading && !error ? (
                                    <View className="bg-white p-12 rounded-3xl items-center border border-slate-100 mt-4 shadow-sm">
                                        <View className="w-16 h-16 bg-slate-50 rounded-full items-center justify-center mb-6 border border-slate-100">
                                            <Users color="#CBD5E1" size={32} />
                                        </View>
                                        <Text className="text-dark font-black text-center text-lg italic">Database Kosong</Text>
                                        <Text className="text-slate-400 text-[10px] text-center mt-2 uppercase tracking-[2px] font-bold">Belum ada data nasabah</Text>
                                    </View>
                                ) : null
                            }
                        />
                    )}
                </View>
            </View>
        </SidebarLayout>
    );
};

