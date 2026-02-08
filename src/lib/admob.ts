import mobileAds from 'react-native-google-mobile-ads';

export const initializeAdMob = async () => {
    const adapterStatuses = await mobileAds().initialize();
    return adapterStatuses;
};
