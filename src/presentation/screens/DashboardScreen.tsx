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
    Modal,
    Pressable,
} from 'react-native';

import { SidebarLayout } from '../components/Layout/SidebarLayout';
import { ChevronRight, Search, X, User, Building2, ChevronDown } from 'lucide-react-native';

import { useApplications } from '../hooks/useApplications';
import { useMySurveys } from '../hooks/useSurveys';
import { useAuth } from '../context/AuthContext';
import { useAppNavigator } from '../context/NavigationContext';

import { ApplicationMapper } from '../utils/ApplicationMapper';
import { AttributeUtils } from '../utils/AttributeUtils';
import { applicantRepo, applicationRepo } from '../../data/repositories';

import { getStatusConfig } from '../../constants';

import type { CustomerListItem } from '../types/customer';
import { Application } from '../../gen/application/v1/application_pb';
import type { ApplicationSurvey } from '../../gen/survey/v1/survey_pb';

type ApplicantFilter = string;
// Sort order hanya menggunakan status yang diakui backend:
// UNASSIGNED | ASSIGNED | IN_PROGRESS | SUBMITTED | VERIFIED
const STATUS_SORT_ORDER: Record<string, number> = {
    IN_PROGRESS: 0,
    ASSIGNED: 1,
    SUBMITTED: 2,
    VERIFIED: 3,
    UNASSIGNED: 99,
};

export function DashboardScreen() {

    const { surveyorId } = useAuth();
    const { navigate } = useAppNavigator();

    const [searchQuery, setSearchQuery] = useState('');
    const [applicantFilter, setApplicantFilter] = useState<ApplicantFilter>('ALL');
    const [filterVisible, setFilterVisible] = useState(false);
    const [applicantTypeMap, setApplicantTypeMap] = useState<Record<string, string>>({});
    const [extraApps, setExtraApps] = useState<Record<string, Application>>({});

    const applicationsQuery = useApplications();
    const surveysQuery = useMySurveys(surveyorId || '');

    const isLoading = applicationsQuery.isLoading || surveysQuery.isLoading;
    const isRefreshing = applicationsQuery.isRefetching || surveysQuery.isRefetching;

    useEffect(() => {
        const currentApps = applicationsQuery.data?.pages.flatMap(page => page.applications) || [];
        const surveys = surveysQuery.data || [];

        // 1. Identifikasi aplikasi yang metadata-nya belum ada di list (pagination) atau extraApps
        const missingAppIds = surveys
            .map(s => s.applicationId)
            .filter(id => !currentApps.find(a => a.id === id) && !extraApps[id]);

        if (missingAppIds.length > 0) {
            Promise.all(missingAppIds.map(id => applicationRepo.getApplication(id).catch(() => null)))
                .then(results => {
                    const newAppsMap: Record<string, Application> = {};
                    results.forEach(app => {
                        if (app) newAppsMap[app.id] = app;
                    });
                    if (Object.keys(newAppsMap).length > 0) {
                        setExtraApps(prev => ({ ...prev, ...newAppsMap }));
                    }
                });
        }

        // 2. Kumpulkan semua applicantId dari SEMUA aplikasi yang kita punya
        const allAvailableApps = [...currentApps, ...Object.values(extraApps)];
        const uniqueIdsForType = [...new Set(
            allAvailableApps
                .map(a => a.applicantId || AttributeUtils.getValue(a.attributes, 'applicant_id'))
                .filter(Boolean)
        )];

        const missingTypeIds = uniqueIdsForType.filter(id => !applicantTypeMap[id]);

        if (missingTypeIds.length > 0) {
            Promise.all(
                missingTypeIds.map(id =>
                    applicantRepo.getApplicant(id)
                        .then(applicant => {
                            let type = applicant.type || (applicant as any).applicantType || '';

                            // Fallback 1: Cek details case
                            if (!type && applicant.details?.case) {
                                type = applicant.details.case === 'individual' ? 'PERSONAL' : 'COMPANY';
                            }

                            // Fallback 2: Cek attributes applicant (struktur berbeda dengan ApplicationAttribute)
                            if (!type && applicant.attributes) {
                                const attr = (applicant.attributes as any[]).find(a =>
                                    (a.code === 'applicant_type' || a.id === 'applicant_type' || a.attributeId === 'applicant_type')
                                );
                                if (attr) {
                                    type = typeof attr.value === 'string' ? attr.value : attr.value?.rawValue || '';
                                }
                            }

                            if (!type) {
                                console.log(`[DEBUG] Applicant ${id} type remains unknown. Details: ${applicant.details?.case}. Attrs:`, applicant.attributes.map(a => (a as any).code || (a as any).attributeId || a.id).join(', '));
                            }

                            return { id, type };
                        })
                        .catch(err => {
                            console.log(`[DEBUG] Failed to fetch applicant ${id}:`, err);
                            return { id, type: '' };
                        }),
                ),
            ).then(results => {
                const newTypeMap: Record<string, string> = {};
                results.forEach(r => {
                    if (r.type) newTypeMap[r.id] = r.type;
                });
                if (Object.keys(newTypeMap).length > 0) {
                    setApplicantTypeMap(prev => ({ ...prev, ...newTypeMap }));
                }
            });
        }
    }, [applicationsQuery.data, surveysQuery.data, extraApps]);

    // Get unique applicant types straight from Backend the loaded data
    const availableFilters = useMemo(() => {
        const types = new Set<string>();
        // Add default 'ALL' item
        types.add('ALL');

        Object.values(applicantTypeMap).forEach(type => {
            if (type && type.trim() !== '') {
                types.add(type);
            }
        });

        return Array.from(types);
    }, [applicantTypeMap]);

    // Reset filter if current filter is not in available types anymore
    useEffect(() => {
        if (!availableFilters.includes(applicantFilter)) {
            setApplicantFilter('ALL');
        }
    }, [availableFilters]);

    const customerList = useMemo((): CustomerListItem[] => {

        const apps: Application[] =
            applicationsQuery.data?.pages.flatMap(p => p.applications) || [];

        const surveys: ApplicationSurvey[] =
            surveysQuery.data || [];

        // ── Sumber data utama adalah survey yang ditugaskan admin ──────────
        // Iterate dari surveys (bukan dari apps), sehingga hanya nasabah yang
        // sudah diassign admin ke surveyor ini yang muncul di dashboard.
        // Status yang ditampilkan murni dari backend — tidak ada hardcode apapun.

        // Type helper: survey dijamin ada (bukan undefined) di list ini
        type AssignedItem = Omit<CustomerListItem, 'survey'> & {
            survey: ApplicationSurvey;
            applicantType: string;
        };

        const mapped: AssignedItem[] = surveys
            .map((survey): AssignedItem | null => {
                // Cari di list utama atau di extraApps
                const app = apps.find(a => a.id === survey.applicationId) || extraApps[survey.applicationId];
                if (!app) return null;

                const actualApplicantId = app.applicantId || AttributeUtils.getValue(app.attributes, 'applicant_id');
                const applicantType = applicantTypeMap[actualApplicantId]
                    || AttributeUtils.getValue(app.attributes, 'applicant_type')
                    || '';
                console.log('[MAP]', actualApplicantId, '=', applicantType);

                return {
                    app,
                    survey,
                    applicantType, // Sediakan raw type untuk filtering
                    display: ApplicationMapper.toDisplay(app, applicantType),
                };
            })
            .filter((item): item is AssignedItem => item !== null);

        const query = searchQuery.toLowerCase();

        const filtered = mapped.filter(item => {
            const matchSearch = query.length === 0
                || item.display.applicantName.toLowerCase().includes(query)
                || item.app.id.toLowerCase().includes(query);

            const rawType = item.applicantType || '';
            const matchType = applicantFilter === 'ALL' || rawType.toLowerCase() === applicantFilter.toLowerCase();

            if (applicantFilter !== 'ALL' && matchType) {
                console.log(`[FILTER MATCH] Found ${item.display.applicantName} for type: ${applicantFilter}`);
            }

            return matchSearch && matchType;
        });

        if (applicantFilter !== 'ALL') {
            console.log(`[FILTER SUMMARY] Filtered ${filtered.length} customers for type: ${applicantFilter}`);
        }

        // Urutkan berdasarkan status dari backend — murni dari data survey, tanpa hardcode
        return filtered.sort(
            (a, b) =>
                (STATUS_SORT_ORDER[a.survey.status] ?? 99) -
                (STATUS_SORT_ORDER[b.survey.status] ?? 99),
        ) as CustomerListItem[];

    }, [applicationsQuery.data, surveysQuery.data, searchQuery, applicantFilter, applicantTypeMap, extraApps]);

    const stats = useMemo(() => ({

        // Total = jumlah survey yang ditugaskan admin ke surveyor ini
        total:
            (surveysQuery.data || []).length,

        active:
            (surveysQuery.data || []).filter(s => s.status === 'IN_PROGRESS').length,

        completed:
            (surveysQuery.data || []).filter(s =>
                ['SUBMITTED', 'VERIFIED'].includes(s.status),
            ).length,

    }), [surveysQuery.data]);

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

                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 12
                        }}>
                            <Text style={{
                                fontSize: 16,
                                fontWeight: '700',
                                color: '#0F172A'
                            }}>
                                Daftar Nasabah
                            </Text>

                            <TouchableOpacity
                                onPress={() => setFilterVisible(true)}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: '#F1F5F9',
                                    paddingHorizontal: 12,
                                    paddingVertical: 8,
                                    borderRadius: 8,
                                    gap: 6
                                }}
                            >
                                <Text style={{
                                    fontSize: 12,
                                    fontWeight: '600',
                                    color: '#0F172A'
                                }}>
                                    {applicantFilter === 'ALL' ? 'Semua' : applicantFilter}
                                </Text>
                                <ChevronDown size={14} color="#64748B" />
                            </TouchableOpacity>
                        </View>

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

            <Modal
                visible={filterVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setFilterVisible(false)}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    activeOpacity={1}
                    onPress={() => setFilterVisible(false)}
                >
                    <View style={{
                        backgroundColor: '#FFF',
                        borderRadius: 16,
                        width: '80%',
                        padding: 20,
                        shadowColor: '#000',
                        shadowOpacity: 0.1,
                        shadowRadius: 10,
                        shadowOffset: { width: 0, height: 4 },
                        elevation: 5
                    }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 16, color: '#0F172A' }}>
                            Tipe Nasabah
                        </Text>
                        {availableFilters.map((type, index) => (
                            <TouchableOpacity
                                key={type}
                                style={{
                                    paddingVertical: 14,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    borderBottomWidth: index !== availableFilters.length - 1 ? 1 : 0,
                                    borderBottomColor: '#F1F5F9'
                                }}
                                onPress={() => {
                                    setApplicantFilter(type as any);
                                    setFilterVisible(false);
                                }}
                            >
                                <Text style={{
                                    fontSize: 15,
                                    color: applicantFilter === type ? '#2563EB' : '#0F172A',
                                    fontWeight: applicantFilter === type ? '700' : '500',
                                    textTransform: type === 'ALL' ? 'none' : 'capitalize'
                                }}>
                                    {type === 'ALL' ? 'Semua Nasabah' : type}
                                </Text>
                                {applicantFilter === type && (
                                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563EB' }} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

        </SidebarLayout>

    );
}

const CustomerCard = React.memo(
    ({ item, onPress }: { item: CustomerListItem, onPress: () => void }) => {

        const { display, survey, app } = item;

        // Survey selalu ada — hanya nasabah yang sudah diassign admin yang muncul di dashboard.
        // Status diambil murni dari backend, tidak ada hardcode.
        const statusKey = survey?.status ?? 'ASSIGNED';

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
                        {display.amount} • {display.applicantType}
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