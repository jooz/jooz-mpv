import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Obtiene el módulo de Google Signin solo si estamos en un entorno nativo válido.
 * Retorna null en Web o Expo Go.
 */
export const getGoogleSignin = () => {
    try {
        const isWeb = Platform.OS === 'web';
        // En Expo Go, appOwnership es 'expo'
        const isExpoGo = Constants.appOwnership === 'expo';
        // Check adicional para versiones antiguas o casos raros de Expo Go
        const isActuallyExpoGo = Constants.expoVersion && !Constants.appOwnership;

        if (!isWeb && !isExpoGo && !isActuallyExpoGo) {
            return require('@react-native-google-signin/google-signin');
        }
    } catch (e) {
        // Silent fail
    }
    return null;
};

/**
 * Configura Google Signin globalmente.
 * Debe llamarse en el _layout o punto de entrada.
 */
export const configureGoogleSignin = () => {
    const GoogleModule = getGoogleSignin();
    if (GoogleModule) {
        try {
            const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
            if (!webClientId) console.warn('[Google Auth] ALERTA: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID no definido');

            GoogleModule.GoogleSignin.configure({
                webClientId: webClientId,
                offlineAccess: true, // Importante para Supabase/Backend
            });
            console.log('[Google Auth] Configurado correctamente');
        } catch (e) {
            console.error('[Google Auth] Error configurando:', e);
        }
    } else {
        console.log('[Google Auth] Omitido (Entorno no nativo)');
    }
};
