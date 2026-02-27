import React from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useApplications } from '../hooks/useApplications';
import { ChevronRight } from 'lucide-react-native';

export const ApplicationListScreen: React.FC = () => {
    const { applications, loading, error, refetch } = useApplications();

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-slate-50 flex-row items-center justify-between">
            <View className="flex-1">
                <View className="flex-row items-center mb-1">
                    <Text className="text-dark font-bold text-base">{item.applicationType}</Text>
                    <View className={`ml-2 px-2 py-0.5 rounded-md ${item.status === 'APPROVED' ? 'bg-green-100' : 'bg-amber-100'}`}>
                        <Text className={`text-[10px] font-bold ${item.status === 'APPROVED' ? 'text-green-700' : 'text-amber-700'}`}>
                            {item.status}
                        </Text>
                    </View>
                </View>
                <Text className="text-secondary text-xs">Pinjaman: <Text className="text-dark font-medium">{item.baseAmount}</Text></Text>
                <Text className="text-secondary text-xs">Tenor: <Text className="text-dark font-medium">{item.tenorMonths} bulan</Text></Text>
            </View>
            <ChevronRight color="#CBD5E1" size={20} />
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-light p-4">
            <Text className="text-primary text-2xl font-bold mb-6">Aplikasi Kredit</Text>

            {error && (
                <View className="bg-red-50 p-4 rounded-xl mb-4 border border-red-100">
                    <Text className="text-red-600 font-medium">Error: {error}</Text>
                </View>
            )}

            {loading && !applications.length ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#0b78ed" />
                </View>
            ) : (
                <FlatList
                    data={applications}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={refetch} tintColor="#0b78ed" />
                    }
                    ListEmptyComponent={
                        !loading && !error ? (
                            <View className="items-center mt-10">
                                <Text className="text-slate-400 font-medium">Tidak ada aplikasi ditemukan.</Text>
                            </View>
                        ) : null
                    }
                />
            )}
        </View>
    );
};
