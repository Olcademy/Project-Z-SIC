import * as Linking from 'expo-linking';
import { LinkingOptions } from '@react-navigation/native';
import { RootStackParamList } from './types';

const prefix = Linking.createURL('/');

export const linking: LinkingOptions<RootStackParamList> = {
    prefixes: [prefix, 'sic://'],
    config: {
        screens: {
            MainTabs: {
                screens: {
                    RestaurantsStack: {
                        screens: {
                            RestaurantList: 'restaurant',
                            RestaurantDetail: 'restaurant/:id',
                        },
                    },
                    TiffinStack: {
                        screens: {
                            TiffinList: 'tiffin',
                            TiffinDetail: 'tiffin/:id',
                        },
                    },
                    EventsStack: {
                        screens: {
                            EventList: 'event',
                            EventDetail: 'event/:id',
                        },
                    },
                    SettingsStack: {
                        screens: {
                            Settings: 'settings',
                        },
                    },
                },
            },
        },
    },
};
