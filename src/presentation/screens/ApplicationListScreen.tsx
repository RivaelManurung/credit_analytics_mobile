import React from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useApplications } from '../hooks/useApplications';
import { ChevronRight, Users } from 'lucide-react-native';
import { SidebarLayout } from '../components/Layout/SidebarLayout';

export const ApplicationListScreen: React.FC = () => {
    const { data: applications = [], isLoading: loading, error, refetch } = useApplications();

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            activeOpacity={0.8}
            className="bg-white rounded-[28px] p-6 mb-4 shadow-sm border border-light flex-row items-center justify-between"
        >
            <View className="flex-1 pr-4">
                <View className="flex-row items-center mb-3">
                    <Text className="text-dark font-black text-base flex-1" numberOfLines={1}>
                        {item.applicantName || 'Nama Tidak Tersedia'}
                    </Text>
                    <View className={`ml-3 px-3 py-1.5 rounded-full ${item.status === 'APPROVED' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                        <Text className={`text-[9px] font-black tracking-widest uppercase ${item.status === 'APPROVED' ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {item.status}
                        </Text>
                    </View>
                </View>

                <View className="flex-row items-center gap-6">
                    <View>
                        <Text className="text-secondary text-[9px] uppercase font-extrabold tracking-widest mb-1">Pinjaman</Text>
                        <Text className="text-dark font-black text-sm">
                            {item.loanAmount ? `Rp ${Number(item.loanAmount).toLocaleString('id-ID')}` : '-'}
                        </Text>
                    </View>
                    <View>
                        <Text className="text-secondary text-[9px] uppercase font-extrabold tracking-widest mb-1">Tenor</Text>
                        <Text className="text-dark font-black text-sm">{item.tenorMonths}B <Text className="text-[10px] text-secondary">Masa</Text></Text>
                    </View>
                </View>

                {item.applicationType && (
                    <View className="mt-4 flex-row">
                        <View className="bg-slate-50 px-2.5 py-1 rounded-lg border border-light">
                            <Text className="text-secondary text-[10px] font-bold uppercase tracking-tight">{item.applicationType}</Text>
                        </View>
                    </View>
                )}
            </View>
            <View className="bg-primary/5 p-3 rounded-2xl border border-primary/10">
                <ChevronRight color="#2563EB" size={20} strokeWidth={2.5} />
            </View>
        </TouchableOpacity>
    );

    return (
        <SidebarLayout headerTitle="Nasabah">
            <View className="flex-1 bg-light">
                {/* Brand Header */}
                <View className="bg-white px-6 py-8 border-b border-light mb-6">
                    <Text className="text-secondary text-[10px] font-bold uppercase tracking-[3px] mb-1">SYSTEM DATABASE</Text>
                    <Text className="text-dark text-4xl font-black italic">Nasabah <Text className="text-primary not-italic">List</Text></Text>
                    <View className="h-1.5 w-12 bg-primary mt-3 rounded-full" />
                </View>

                <View className="flex-1 px-6">
                    {error && (
                        <View className="bg-rose-50 p-4 rounded-3xl mb-6 border border-rose-100/50">
                            <Text className="text-rose-600 font-bold text-xs text-center">Gagal memuat data nasabah.</Text>
                        </View>
                    )}

                    {loading && !applications.length ? (
                        <View className="flex-1 justify-center items-center pb-20">
                            <ActivityIndicator size="small" color="#2563EB" />
                            <Text className="text-secondary mt-4 font-extrabold text-[10px] uppercase tracking-widest">Sinkronisasi Data...</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={applications}
                            keyExtractor={(item) => item.id}
                            renderItem={renderItem}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 60 }}
                            refreshControl={
                                <RefreshControl refreshing={loading} onRefresh={refetch} tintColor="#2563EB" />
                            }
                            ListEmptyComponent={
                                !loading && !error ? (
                                    <View className="bg-white p-12 rounded-[40px] items-center border border-light mt-4 shadow-sm">
                                        <View className="w-20 h-20 bg-slate-50 rounded-full items-center justify-center mb-6 border border-light">
                                            <Users color="#CBD5E1" size={40} />
                                        </View>
                                        <Text className="text-dark font-black text-center text-lg">Database Kosong</Text>
                                        <Text className="text-secondary text-[11px] text-center mt-2 uppercase tracking-widest font-bold">Belum ada data nasabah terdaftar</Text>
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
