import Constants from 'expo-constants';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

let InterstitialAd: any;
let AdEventType: any;
let TestIds: any;
let interstitialInstance: any = null;

try {
    // Check if we are running in a native environment (not web) and not in Expo Go (if desired to mock there)
    if (Platform.OS !== 'web' && Constants.appOwnership !== 'expo') {
        const AdModule = require('react-native-google-mobile-ads');
        InterstitialAd = AdModule.InterstitialAd;
        AdEventType = AdModule.AdEventType;
        TestIds = AdModule.TestIds;

        const adUnitId = __DEV__
            ? TestIds.INTERSTITIAL
            : Platform.select({
                android: 'ca-app-pub-3940256099942544/1033173712',
                ios: 'ca-app-pub-3940256099942544/4411468910',
                default: TestIds.INTERSTITIAL, // Corrected default to TestIds properties
            });

        if (InterstitialAd) {
            interstitialInstance = InterstitialAd.createForAdRequest(adUnitId, {
                requestNonPersonalizedAdsOnly: true,
            });
        }
    }
} catch (e) {
    console.warn('Google Mobile Ads module not available in this environment.');
}

export const useInterstitialAd = () => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!interstitialInstance || !AdEventType) return;

        const unsubscribeLoaded = interstitialInstance.addAdEventListener(AdEventType.LOADED, () => {
            setLoaded(true);
            setError(null);
        });

        const unsubscribeError = interstitialInstance.addAdEventListener(AdEventType.ERROR, (err: any) => {
            console.error('Interstitial Ad Error:', err);
            setError(err);
            setLoaded(false);
        });

        const unsubscribeClosed = interstitialInstance.addAdEventListener(AdEventType.CLOSED, () => {
            setLoaded(false);
            // Preload next ad
            interstitialInstance.load();
        });

        // Initial load
        interstitialInstance.load();

        return () => {
            unsubscribeLoaded();
            unsubscribeError();
            unsubscribeClosed();
        };
    }, []);

    const showAd = useCallback(() => {
        if (loaded && interstitialInstance) {
            try {
                interstitialInstance.show();
                return true;
            } catch (e) {
                console.error('Failed to show interstitial ad:', e);
                return false;
            }
        }

        if (Constants.appOwnership === 'expo') {
            console.log('[AdMob Mock] showAd called in Expo Go - Ignoring.');
        } else {
            console.warn('Interstitial ad not loaded yet or instance missing');
        }
        return false;
    }, [loaded]);

    return {
        loaded,
        error,
        showAd,
    };
};
