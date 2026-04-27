import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/app/navigation/types';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { useGlobalSearch } from '../hooks/useGlobalSearch';
import { SearchResultsSection } from '../components/SearchResultsSection';
import { useTheme } from '@/ui/context/ThemeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

export const SearchScreen: React.FC<Props> = ({ navigation }) => {
    const theme = useTheme();
    const [query, setQuery] = useState('');
    const trimmedQuery = useMemo(() => query.trim(), [query]);
    const { data, isLoading } = useGlobalSearch(trimmedQuery);

    const handleRestaurantPress = (item: any) => {
        if (!item?._id) return;
        navigation.navigate('MainTabs', {
            screen: 'RestaurantsStack',
            params: { screen: 'RestaurantDetail', params: { id: item._id } },
        });
    };

    const handleTiffinPress = (item: any) => {
        if (!item?._id) return;
        navigation.navigate('MainTabs', {
            screen: 'TiffinStack',
            params: { screen: 'TiffinDetail', params: { id: item._id } },
        });
    };

    const handleEventPress = (item: any) => {
        if (!item?._id) return;
        navigation.navigate('MainTabs', {
            screen: 'EventsStack',
            params: { screen: 'EventDetail', params: { id: item._id } },
        });
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <View style={{ backgroundColor: theme.headerBgSettings, paddingHorizontal: 20, paddingTop: 48, paddingBottom: 24, overflow: 'visible' }}>
                <View style={{ position: 'absolute', right: -30, top: -20, height: 112, width: 112, borderRadius: 56, backgroundColor: theme.headerCircleSettings }} />
                <View style={{ position: 'absolute', left: -20, bottom: -30, height: 96, width: 96, borderRadius: 48, backgroundColor: theme.headerCircleSettings }} />
                <ScreenHeader title="Search" subtitle="Find restaurants, tiffins, and events" showSearch={false} />
                <View style={{ marginTop: 16, zIndex: 1 }}>
                    <TextInput
                        style={{ backgroundColor: theme.inputBg, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, fontSize: 16, color: theme.inputText }}
                        placeholder="Search"
                        placeholderTextColor={theme.inputPlaceholder}
                        value={query}
                        onChangeText={setQuery}
                    />
                </View>
            </View>
            <View style={{ paddingHorizontal: 20, marginTop: -16, zIndex: 1 }}>
                <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}>
                {trimmedQuery.length === 0 ? (
                    <Text style={{ fontSize: 14, color: theme.subtext, marginTop: 8 }}>
                        Start typing to search across categories.
                    </Text>
                ) : isLoading ? (
                    <View style={{ marginTop: 16, alignItems: 'center' }}>
                        <ActivityIndicator color="#FF7A00" />
                    </View>
                ) : (
                    <View style={{ marginTop: 16 }}>
                        {data ? (
                            <Text style={{ fontSize: 12, color: theme.subtext, marginBottom: 12 }}>
                                {data.restaurants.length + data.tiffins.length + data.events.length} results
                            </Text>
                        ) : null}
                        <SearchResultsSection
                            title="Restaurants"
                            data={data?.restaurants ?? []}
                            onItemPress={handleRestaurantPress}
                        />
                        <SearchResultsSection
                            title="Tiffins"
                            data={data?.tiffins ?? []}
                            onItemPress={handleTiffinPress}
                        />
                        <SearchResultsSection
                            title="Events"
                            data={data?.events ?? []}
                            onItemPress={handleEventPress}
                        />
                        {data &&
                        data.restaurants.length === 0 &&
                        data.tiffins.length === 0 &&
                        data.events.length === 0 ? (
                            <Text style={{ fontSize: 14, color: theme.subtext, marginTop: 16, textAlign: 'center' }}>No results found.</Text>
                        ) : null}
                    </View>
                )}
                </View>
            </View>
        </View>
    );
};
