import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight, CreditCard, MapPin } from 'lucide-react-native';

interface ClientCardProps {
    name: string;
    status: string;
    activeStatus: string;
    idApp: string;
    amount: string;
    address: string;
    onPressStart: () => void;
}

export function ClientCard({ name, status, activeStatus, idApp, amount, address, onPressStart }: ClientCardProps) {
    const isStarted = activeStatus === 'IN_PROGRESS';
    const isSubmitted = activeStatus === 'SUBMITTED' || activeStatus === 'VERIFIED';

    // Application Status Styling (The categories user mentioned)
    const getAppStatusStyle = (appStatus: string) => {
        const s = appStatus.toUpperCase();
        if (s.includes('SURVEY')) return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', label: 'SURVEY' };
        if (s.includes('INTAKE')) return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', label: 'INTAKE' };
        if (s.includes('REJECTED')) return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', label: 'REJECTED' };
        if (s.includes('COMMITTE')) return { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', label: 'COMMITTEE' };
        if (s.includes('APPROVED')) return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', label: 'APPROVED' };

        return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', label: appStatus };
    };

    const appStatusStyle = getAppStatusStyle(status);

    return (
        <View className="bg-white rounded-xl p-4 mb-3 shadow-md border border-slate-50">
            <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1 mr-2">
                    <Text className="text-dark text-lg font-bold mb-1" numberOfLines={1}>{name}</Text>
                    <View className="flex-row items-center flex-wrap gap-2">
                        {/* Application Category Badge */}
                        <View className={`px-2.5 py-1 rounded-md border ${appStatusStyle.bg} ${appStatusStyle.border}`}>
                            <Text className={`text-[10px] font-bold ${appStatusStyle.text}`}>
                                {appStatusStyle.label}
                            </Text>
                        </View>

                        {/* Survey Progress Badge */}
                        {activeStatus !== 'PENDING' && (
                            <View className={`px-2.5 py-1 rounded-md border ${isStarted ? 'bg-amber-50 border-amber-100' : 'bg-green-50 border-green-100'}`}>
                                <Text className={`text-[9px] font-bold ${isStarted ? 'text-amber-600' : 'text-green-600'}`}>
                                    {isStarted ? 'SEDANG DISURVEY' : 'SURVEY SELESAI'}
                                </Text>
                            </View>
                        )}

                        <Text className="text-secondary text-[11px] font-medium">#{idApp}</Text>
                    </View>
                </View>
                <ChevronRight color="#CBD5E1" size={20} />
            </View>

            <View className="h-px bg-slate-100 mb-3 w-full" />

            <View className="flex-row items-center mb-2">
                <CreditCard color="#0b78ed" size={14} />
                <Text className="text-slate-600 text-xs ml-2 font-medium">Pinjaman: <Text className="text-dark">{amount}</Text></Text>
            </View>

            <View className="flex-row items-center mb-4">
                <MapPin color="#8ca4b5" size={14} />
                <Text className="text-slate-600 text-xs ml-2" numberOfLines={1}>{address}</Text>
            </View>

            {!isSubmitted ? (
                <TouchableOpacity
                    className={`rounded-xl py-3 items-center shadow-sm ${isStarted ? 'bg-amber-500' : 'bg-primary'}`}
                    onPress={onPressStart}
                >
                    <Text className="text-white font-bold text-sm">
                        {isStarted ? 'Lanjutkan Survey' : 'Mulai Survey'}
                    </Text>
                </TouchableOpacity>
            ) : (
                <View className="bg-green-50 rounded-xl py-3 items-center border border-green-100">
                    <Text className="text-green-600 font-bold text-sm">Survey Selesai</Text>
                </View>
            )}
        </View>
    );
}
