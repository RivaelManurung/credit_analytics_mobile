import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight, CreditCard, MapPin } from 'lucide-react-native';

interface ClientCardProps {
    name: string;
    status: string;
    idApp: string;
    amount: string;
    address: string;
    onPressStart: () => void;
}

export function ClientCard({ name, status, idApp, amount, address, onPressStart }: ClientCardProps) {
    const isStarted = status === 'IN_PROGRESS';
    const isSubmitted = status === 'SUBMITTED';

    return (
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-slate-50">
            <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center flex-1">
                    <Text className="text-dark text-lg font-bold mr-2" numberOfLines={1}>{name}</Text>
                    <View className={`px-2 py-1 rounded-full ${status === 'ASSIGNED' ? 'bg-blue-50' : status === 'IN_PROGRESS' ? 'bg-amber-50' : 'bg-green-50'}`}>
                        <Text className={`text-[10px] font-bold ${status === 'ASSIGNED' ? 'text-primary' : status === 'IN_PROGRESS' ? 'text-amber-600' : 'text-green-600'}`}>
                            {status}
                        </Text>
                    </View>
                </View>
                <ChevronRight color="#8ca4b5" size={20} />
            </View>

            <View className="flex-row items-center mb-2">
                <Text className="text-secondary text-xs font-medium">ID Aplikasi:</Text>
                <Text className="text-primary text-xs font-semibold ml-1">{idApp}</Text>
            </View>

            <View className="flex-row items-center mb-2">
                <CreditCard color="#8ca4b5" size={14} />
                <Text className="text-slate-600 text-xs ml-2">Pinjaman: {amount}</Text>
            </View>

            <View className="flex-row items-center mb-4">
                <MapPin color="#8ca4b5" size={14} />
                <Text className="text-slate-600 text-xs ml-2" numberOfLines={1}>{address}</Text>
            </View>

            {!isSubmitted && (
                <TouchableOpacity
                    className={`rounded-xl py-3 items-center ${isStarted ? 'bg-amber-500' : 'bg-primary'}`}
                    onPress={onPressStart}
                >
                    <Text className="text-white font-bold text-sm">
                        {isStarted ? 'Lanjutkan Survey' : 'Mulai Survey'}
                    </Text>
                </TouchableOpacity>
            )}

            {isSubmitted && (
                <View className="bg-slate-100 rounded-xl py-3 items-center">
                    <Text className="text-slate-500 font-bold text-sm">Survey Dikirim</Text>
                </View>
            )}
        </View>
    );
}
