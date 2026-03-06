import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
    TextInput,
    Animated,
} from 'react-native';

import { SidebarLayout } from '../components/Layout/SidebarLayout';
import { ChevronRight, Search, X, User } from 'lucide-react-native';

import { useApplications } from '../hooks/useApplications';
import { useMySurveys } from '../hooks/useSurveys';
import { useAuth } from '../context/AuthContext';
import { useAppNavigator } from '../context/NavigationContext';

import { ApplicationMapper } from '../utils/ApplicationMapper';
import { applicantRepo } from '../../data/repositories';

import { getStatusConfig } from '../../constants';

import type { CustomerListItem } from '../types/customer';
import type { Application } from '../../gen/application/v1/application_pb';
import type { ApplicationSurvey } from '../../gen/survey/v1/survey_pb';

const STATUS_SORT_ORDER: Record<string, number> = {
    IN_PROGRESS: 0,
    START: 1,
    ASSIGNED: 2,
    NEW: 3,
};

export function DashboardScreen() {

    const { surveyorId } = useAuth();
    const { navigate } = useAppNavigator();

    const [searchQuery, setSearchQuery] = useState('');
    const [applicantTypeMap, setApplicantTypeMap] = useState<Record<string, string>>({});

    const applicationsQuery = useApplications();
    const surveysQuery = useMySurveys(surveyorId || '');

    const isLoading = applicationsQuery.isLoading || surveysQuery.isLoading;
    const isRefreshing = applicationsQuery.isRefetching || surveysQuery.isRefetching;

    useEffect(() => {

        const apps =
            applicationsQuery.data?.pages.flatMap(page => page.applications) || [];

        const uniqueIds =
            [...new Set(apps.map(a => a.applicantId).filter(Boolean))];

        const newIds = uniqueIds.filter(id => !applicantTypeMap[id]);

        if (newIds.length === 0) return;

        Promise.all(
            newIds.map(id =>
                applicantRepo.getApplicant(id)
                    .then(applicant => ({ id, type: applicant.type }))
                    .catch(() => ({ id, type: '' })),
            ),
        ).then(results => {

            const newMap: Record<string, string> = {};

            results.forEach(r => {
                newMap[r.id] = r.type;
            });

            setApplicantTypeMap(prev => ({ ...prev, ...newMap }));

        });

    }, [applicationsQuery.data]);

    const customerList = useMemo((): CustomerListItem[] => {

        const apps: Application[] =
            applicationsQuery.data?.pages.flatMap(p => p.applications) || [];

        const surveys: ApplicationSurvey[] =
            surveysQuery.data || [];

        const mapped: CustomerListItem[] = apps.map(app => {

            const survey =
                surveys.find(s => s.applicationId === app.id);

            const applicantType =
                applicantTypeMap[app.applicantId] || '';

            return {
                app,
                survey,
                display: ApplicationMapper.toDisplay(app, applicantType),
            };

        });

        const query = searchQuery.toLowerCase();

        const filtered =
            query.length > 0
                ? mapped.filter(item =>
                    item.display.applicantName.toLowerCase().includes(query) ||
                    item.app.id.toLowerCase().includes(query),
                )
                : mapped;

        return filtered.sort(
            (a, b) =>
                (STATUS_SORT_ORDER[a.survey?.status || 'NEW'] ?? 99) -
                (STATUS_SORT_ORDER[b.survey?.status || 'NEW'] ?? 99),
        );

    }, [applicationsQuery.data, surveysQuery.data, searchQuery, applicantTypeMap]);

    const stats = useMemo(() => ({

        total:
            applicationsQuery.data?.pages.flatMap(p => p.applications).length || 0,

        active:
            (surveysQuery.data || []).filter(s => s.status === 'IN_PROGRESS').length,

        completed:
            (surveysQuery.data || []).filter(s =>
                ['SUBMITTED', 'VERIFIED'].includes(s.status),
            ).length,

    }), [applicationsQuery.data, surveysQuery.data]);

    const handleAction = (item: CustomerListItem) => {

        navigate('ApplicationDetail', {
            applicationId: item.app.id,
            surveyId: item.survey?.id,
        });

    };

    const handleLoadMore = () => {

        if (applicationsQuery.hasNextPage && !applicationsQuery.isFetchingNextPage) {
            applicationsQuery.fetchNextPage();
        }

    };

    const handleRefresh = () => {

        applicationsQuery.refetch();
        surveysQuery.refetch();

    };

    const showSkeletons = isLoading || isRefreshing;

    return (

        <SidebarLayout headerTitle="Dashboard">

            <FlatList
                data={showSkeletons ? [] : customerList}
                keyExtractor={item => item.app.id}
                contentContainerStyle={{ paddingBottom: 60 }}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.3}

                ListHeaderComponent={

                    <View style={{ paddingHorizontal: 24, paddingTop: 20 }}>

                        <Text style={{
                            fontSize: 26,
                            fontWeight: '800',
                            color: '#0F172A',
                            marginBottom: 6
                        }}>
                            Survey Nasabah
                        </Text>

                        <Text style={{
                            fontSize: 13,
                            color: '#64748B',
                            marginBottom: 24
                        }}>
                            Monitoring dan kelola survey kredit nasabah
                        </Text>

                        <View style={{
                            flexDirection: 'row',
                            gap: 12,
                            marginBottom: 24
                        }}>

                            <StatCard label="Total" value={stats.total} />
                            <StatCard label="Aktif" value={stats.active} />
                            <StatCard label="Selesai" value={stats.completed} />

                        </View>

                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#F8FAFC',
                            borderRadius: 14,
                            paddingHorizontal: 14,
                            height: 46,
                            marginBottom: 18
                        }}>

                            <Search size={18} color="#94A3B8" />

                            <TextInput
                                placeholder="Cari nasabah..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                style={{
                                    flex: 1,
                                    marginLeft: 10,
                                    fontSize: 14,
                                    color: '#0F172A'
                                }}
                            />

                            {searchQuery !== '' && (

                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <X size={18} color="#94A3B8" />
                                </TouchableOpacity>

                            )}

                        </View>

                        <Text style={{
                            fontSize: 16,
                            fontWeight: '700',
                            color: '#0F172A',
                            marginBottom: 12
                        }}>
                            Daftar Nasabah
                        </Text>

                        {showSkeletons && (
                            <>
                                <SkeletonCard />
                                <SkeletonCard />
                                <SkeletonCard />
                            </>
                        )}

                    </View>

                }

                renderItem={({ item }) => (

                    <View style={{ paddingHorizontal: 24, marginBottom: 12 }}>
                        <CustomerCard item={item} onPress={() => handleAction(item)} />
                    </View>

                )}

                ListEmptyComponent={() => !showSkeletons && (

                    <View style={{
                        alignItems: 'center',
                        paddingTop: 80
                    }}>

                        <Text style={{
                            fontSize: 15,
                            color: '#94A3B8'
                        }}>
                            Tidak ada data
                        </Text>

                    </View>

                )}

                ListFooterComponent={() =>

                    applicationsQuery.isFetchingNextPage ? (

                        <View style={{ paddingVertical: 24 }}>
                            <ActivityIndicator color="#2563EB" />
                        </View>

                    ) : <View style={{ height: 40 }} />

                }

            />

        </SidebarLayout>

    );
}

const CustomerCard = React.memo(
    ({ item, onPress }: { item: CustomerListItem, onPress: () => void }) => {

        const { display, survey, app } = item;

        const statusKey = survey?.status || 'NEW';

        const config = getStatusConfig(statusKey);

        return (

            <TouchableOpacity
                activeOpacity={0.85}
                onPress={onPress}
                style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 18,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOpacity: 0.05,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 3 },
                    elevation: 2
                }}
            >

                <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: '#F1F5F9',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12
                }}>
                    <Text style={{
                        fontWeight: '700',
                        fontSize: 16,
                        color: '#0F172A'
                    }}>
                        {display.applicantName.charAt(0)}
                    </Text>
                </View>

                <View style={{ flex: 1 }}>

                    <Text
                        numberOfLines={1}
                        style={{
                            fontWeight: '700',
                            fontSize: 15,
                            color: '#0F172A'
                        }}
                    >
                        {display.applicantName}
                    </Text>

                    <Text style={{
                        fontSize: 12,
                        color: '#64748B',
                        marginTop: 3
                    }}>
                        {display.amount}
                    </Text>

                </View>

                <View style={{
                    backgroundColor: config.bg,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                    marginRight: 8
                }}>
                    <Text style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: config.color
                    }}>
                        {config.label}
                    </Text>
                </View>

                <ChevronRight size={18} color="#CBD5E1" />

            </TouchableOpacity>

        );

    });

const SkeletonCard = () => {

    const pulse = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {

        Animated.loop(

            Animated.sequence([
                Animated.timing(pulse, { toValue: 0.7, duration: 700, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 0.3, duration: 700, useNativeDriver: true })
            ])

        ).start();

    }, []);

    return (

        <Animated.View
            style={{
                opacity: pulse,
                backgroundColor: '#FFF',
                borderRadius: 18,
                height: 72,
                marginBottom: 12
            }}
        />

    );

};

const StatCard = ({ label, value }: { label: string, value: number }) => (

    <View style={{
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1
    }}>

        <Text style={{
            fontSize: 20,
            fontWeight: '800',
            color: '#0F172A'
        }}>
            {value}
        </Text>

        <Text style={{
            fontSize: 11,
            color: '#64748B',
            marginTop: 4
        }}>
            {label}
        </Text>

    </View>

);