import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TestScreen() {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Text style={styles.title}>Test Screen</Text>
            <Text style={styles.subtitle}>If you see this, React Native works!</Text>
            <View style={styles.box}>
                <Text style={styles.boxText}>Green Box</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f6f8f6',
        padding: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#102216',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        marginBottom: 20,
    },
    box: {
        backgroundColor: '#13ec5b',
        padding: 20,
        borderRadius: 12,
        marginTop: 20,
    },
    boxText: {
        color: '#102216',
        fontSize: 18,
        fontWeight: '600',
    },
});
