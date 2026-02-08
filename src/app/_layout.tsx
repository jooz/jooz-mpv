import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../../global.css';
import { ExchangeRateProvider } from '../context/ExchangeRateContext';
import { LocationProvider } from '../context/LocationContext';
import { supabase } from '../lib/supabase';

import { useColorScheme } from '@/components/useColorScheme';
import Constants from 'expo-constants';

// Configure Google Sign-In safely
function configureGoogleSignin() {
  try {
    // Check environment carefully
    const isWeb = Platform.OS === 'web';
    const isExpoGo = Constants.appOwnership === 'expo' || Constants.expoVersion === null || !Constants.appOwnership;

    // GoogleSignin only works in development builds (native) or production (native)
    // It DOES NOT work in Expo Go or Web.
    if (!isWeb && Constants.appOwnership !== 'expo') {
      // One last check: verify it's not actually running in Expo Go environment strings
      const isActuallyExpoGo = Constants.expoVersion && !Constants.appOwnership;
      if (!isActuallyExpoGo) {
        const { GoogleSignin } = require('@react-native-google-signin/google-signin');
        GoogleSignin.configure({
          webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        });
        console.log('[Google Sign-In] Configurado correctamente');
        return;
      }
    }
    console.log('[Google Sign-In] Corriendo en modo limitado (Expo Go o Web)');
  } catch (e) {
    console.log('[Google Sign-In] No disponible en este entorno (esperado en Expo Go/Web)');
  }
}

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  useEffect(() => {
    // Configure Google Sign-In on mount
    configureGoogleSignin();

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Delay slightly to ensure navigation is ready
        setTimeout(() => router.replace('/(tabs)'), 0);
      }
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth event:', _event, session ? 'Logged In' : 'Logged Out');
      if (session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <SafeAreaProvider>
      <ExchangeRateProvider>
        <LocationProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
              <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            </Stack>
          </ThemeProvider>
        </LocationProvider>
      </ExchangeRateProvider>
    </SafeAreaProvider>
  );
}
