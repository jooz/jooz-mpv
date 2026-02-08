import Constants from 'expo-constants';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

// We wrap the import in a conditional check if possible, or handle the failure of the native component.
// In Expo Go, importing this might fail depending on the version, but using it definitely fails.
let BannerAd: any;
let BannerAdSize: any;
let TestIds: any;

try {
    // If we're not in Expo Go and not on Web, we can try to use the library
    if (Platform.OS !== 'web' && Constants.appOwnership !== 'expo') {
        const AdModule = require('react-native-google-mobile-ads');
        BannerAd = AdModule.BannerAd;
        BannerAdSize = AdModule.BannerAdSize;
        TestIds = AdModule.TestIds;
    }
} catch (e) {
    console.warn('AdMob native module not available in this environment');
}

const adUnitId = __DEV__
    ? (TestIds?.BANNER || 'ca-app-pub-3940256099942544/6300978111')
    : Platform.select({
        android: 'ca-app-pub-3940256099942544/6300978111',
        ios: 'ca-app-pub-3940256099942544/2934735716',
        default: TestIds?.BANNER || 'ca-app-pub-3940256099942544/6300978111',
    });

interface AdBannerProps {
    onAdLoaded?: () => void;
    onAdFailed?: (error: Error) => void;
}

const AdBanner: React.FC<AdBannerProps> = ({ onAdLoaded, onAdFailed }) => {
    const [hasError, setHasError] = useState(false);
    const isExpoGo = Constants.appOwnership === 'expo';

    // If we are in Expo Go or there was an error loading the module
    if (isExpoGo || !BannerAd || hasError) {
        if (__DEV__) {
            return (
                <View style={[styles.container, styles.placeholder]}>
                    <Text style={styles.placeholderText}>Ad Banner Placeholder (Expo Go)</Text>
                </View>
            );
        }
        return null;
    }

    return (
        <View style={styles.container}>
            <BannerAd
                unitId={adUnitId}
                size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: true,
                }}
                onAdLoaded={() => {
                    console.log('Banner ad loaded');
                    onAdLoaded?.();
                }}
                onAdFailedToLoad={(error: Error) => {
                    console.error('Banner ad failed to load: ', error);
                    setHasError(true);
                    onAdFailed?.(error);
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: 0,
    },
    placeholder: {
        height: 50,
        backgroundColor: '#f3f4f6',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    placeholderText: {
        fontSize: 10,
        color: '#9ca3af',
    },
});

export default AdBanner;
