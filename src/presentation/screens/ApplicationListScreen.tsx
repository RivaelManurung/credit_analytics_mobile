import React from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useApplications } from '../hooks/useApplications';
import { ChevronRight, Users } from 'lucide-react-native';
import { SidebarLayout } from '../components/Layout/SidebarLayout';

export const ApplicationListScreen: React.FC = () => {
    const { data: applications = [], isLoading: loading, error, refetch } = useApplications();

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity className="bg-white rounded-[24px] p-5 mb-4 shadow-sm border border-slate-100 flex-row items-center justify-between">
            <View className="flex-1">
                <View className="flex-row items-center mb-2">
                    <Text className="text-dark font-bold text-lg">{item.applicantName || 'Nama Tidak Tersedia'}</Text>
                    <View className={`ml-3 px-3 py-1 rounded-full ${item.status === 'APPROVED' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                        <Text className={`text-[10px] font-black tracking-wider ${item.status === 'APPROVED' ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {item.status}
                        </Text>
                    </View>
                </View>
                <View className="flex-row gap-4">
                    <View>
                        <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Pinjaman</Text>
                        <Text className="text-dark font-semibold text-sm">
                            {item.loanAmount ? `Rp ${Number(item.loanAmount).toLocaleString('id-ID')}` : '-'}
                        </Text>
                    </View>
                    <View>
                        <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Tenor</Text>
                        <Text className="text-dark font-semibold text-sm">{item.tenorMonths} Bulan</Text>
                    </View>
                </View>
                <Text className="text-slate-400 text-[11px] mt-2 italic">{item.applicationType}</Text>
            </View>
            <View className="bg-slate-50 p-2 rounded-full">
                <ChevronRight color="#94a3b8" size={18} />
            </View>
        </TouchableOpacity>
    );

    return (
        <SidebarLayout headerTitle="List Nasabah">
            <View className="flex-1 bg-slate-50 px-6 pt-6">
                <View className="mb-8">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-[4px] mb-2">Internal App</Text>
                    <Text className="text-dark text-4xl font-black italic">Nasabah</Text>
                    <View className="h-2 w-16 bg-primary mt-2 rounded-full" />
                </View>

                {error && (
                    <View className="bg-rose-50 p-4 rounded-3xl mb-6 border border-rose-100">
                        <Text className="text-rose-600 font-bold text-xs text-center">Terjadi kesalahan saat memuat data.</Text>
                    </View>
                )}

                {loading && !applications.length ? (
                    <View className="flex-1 justify-center items-center pb-20">
                        <ActivityIndicator size="large" color="#3b82f6" />
                        <Text className="text-slate-400 mt-4 font-bold">Memuat data...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={applications}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                        refreshControl={
                            <RefreshControl refreshing={loading} onRefresh={refetch} tintColor="#3b82f6" />
                        }
                        ListEmptyComponent={
                            !loading && !error ? (
                                <View className="bg-white p-12 rounded-[40px] items-center border border-slate-100 mt-4">
                                    <Users color="#E2E8F0" size={64} />
                                    <Text className="text-slate-400 mt-6 text-center font-bold">Tidak ada nasabah ditemukan</Text>
                                    <Text className="text-slate-300 text-[10px] text-center mt-2 uppercase tracking-widest">Silahkan cek kembali nanti</Text>
                                </View>
                            ) : null
                        }
                    />
                )}
            </View>
        </SidebarLayout>
    );
};
