import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export const SplashScreen: React.FC = () => {

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to SIC</Text>
            <Text style={styles.subtitle}>Discovery Phase</Text>
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#02757A" />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666666',
    },
    loadingContainer: {
        marginTop: 20,
    },
});
