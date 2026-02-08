import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

// Safely get GoogleSignin module
const getGoogleSignin = () => {
    try {
        const isWeb = Platform.OS === 'web';
        const isExpoGo = Constants.appOwnership === 'expo' || !Constants.appOwnership;

        if (!isWeb && !isExpoGo) {
            return require('@react-native-google-signin/google-signin');
        }
    } catch (e) {
        console.log('[Google Auth] Módulo nativo no encontrado (Normal en Expo Go)');
    }
    return null;
};

export default function Login() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function signInWithGoogle() {
        const GoogleModule = getGoogleSignin();

        if (!GoogleModule) {
            Alert.alert(
                'Entorno no compatible',
                'El inicio de sesión automático con Google requiere un Build de Desarrollo o una App Instalada.\n\nEn Expo Go, puedes presionar "Continuar sin cuenta" para probar la aplicación.'
            );
            return;
        }

        const { GoogleSignin, statusCodes } = GoogleModule;

        setLoading(true);
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();

            if (userInfo.data?.idToken) {
                const { data, error } = await supabase.auth.signInWithIdToken({
                    provider: 'google',
                    token: userInfo.data.idToken,
                });

                if (error) throw error;

                if (data?.session) {
                    router.replace('/(tabs)');
                }
            } else {
                throw new Error('No se pudo obtener el ID Token de Google');
            }
        } catch (error: any) {
            if (error.code === statusCodes?.SIGN_IN_CANCELLED) {
                console.log('Google Sign-In cancelado');
            } else if (error.code === statusCodes?.IN_PROGRESS) {
                Alert.alert('Proceso en curso', 'El inicio de sesión ya está en progreso.');
            } else {
                Alert.alert('Error de Google Auth', error.message || 'Ocurrió un error inesperado');
                console.error('Google Auth Error:', error);
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-[#0a1e12]">
            <StatusBar style="light" />

            <View className="flex-1 justify-between px-8 py-12">
                {/* Top Section: Branding */}
                <View className="items-center mt-10">
                    <View className="bg-primary w-24 h-24 rounded-3xl items-center justify-center shadow-2xl shadow-primary/40 rotate-12">
                        <MaterialIcons name="shopping-basket" size={56} color="#102216" />
                    </View>

                    <View className="mt-8 items-center">
                        <Text className="text-white text-5xl font-black tracking-tight">Jooz</Text>
                        <Text className="text-primary/70 text-lg font-medium mt-1">SincroVzla</Text>
                    </View>
                </View>

                {/* Middle Section: Welcome Text */}
                <View>
                    <Text className="text-white text-3xl font-bold leading-tight">
                        Encuentra el mejor precio cerca de ti
                    </Text>
                    <Text className="text-gray-400 text-base mt-3">
                        Únete a la comunidad que ayuda a ahorrar en el mercado diario de Venezuela.
                    </Text>
                </View>

                {/* Bottom Section: Actions */}
                <View className="mb-4">
                    <TouchableOpacity
                        className={`flex-row items-center justify-center bg-white h-16 rounded-2xl shadow-xl ${loading ? 'opacity-70' : ''}`}
                        onPress={signInWithGoogle}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#102216" />
                        ) : (
                            <>
                                <FontAwesome name="google" size={24} color="#EA4335" />
                                <Text className="text-[#102216] font-black text-lg ml-4">
                                    Seguir con Google
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="mt-6 py-4"
                        onPress={() => router.replace('/(tabs)')}
                    >
                        <Text className="text-gray-500 text-center font-bold text-sm uppercase tracking-widest">
                            Continuar sin cuenta
                        </Text>
                    </TouchableOpacity>

                    <View className="mt-8 items-center">
                        <Text className="text-gray-600 text-xs text-center">
                            Al continuar, aceptas nuestros términos y políticas de privacidad.
                        </Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

