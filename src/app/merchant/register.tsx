import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

export default function MerchantRegisterScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(false);
    const [storeName, setStoreName] = useState('');
    const [rif, setRif] = useState('');
    const [location, setLocation] = useState('');

    async function handleSubmit() {
        if (!storeName || !rif || !location) {
            Alert.alert('Error', 'Por favor llena todos los campos');
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No estás autenticado');

            const { error } = await supabase
                .from('merchant_requests')
                .insert({
                    user_id: user.id,
                    store_name: storeName,
                    rif: rif,
                    location: location,
                    status: 'pending'
                });

            if (error) throw error;

            Alert.alert(
                'Solicitud Enviada',
                'Tu solicitud para ser perfil comercial ha sido enviada. Revisaremos tus datos y te avisaremos pronto.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudo enviar la solicitud');
        } finally {
            setLoading(false);
        }
    }

    return (
        <View className="flex-1 bg-white">
            <Stack.Screen
                options={{
                    headerTitle: 'Perfil Comercial',
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: 'white' },
                    headerTitleStyle: { fontFamily: 'System', fontWeight: '900' },
                }}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1 px-6"
                    contentContainerStyle={{ paddingTop: 20, paddingBottom: insets.bottom + 20 }}
                >
                    <View className="mb-8 items-center">
                        <View className="w-20 h-20 bg-primary/20 rounded-full items-center justify-center mb-4">
                            <MaterialIcons name="business-center" size={40} color="#102216" />
                        </View>
                        <Text className="text-2xl font-black text-gray-900 text-center">Únete como Socio Jooz</Text>
                        <Text className="text-gray-500 text-center mt-2 font-medium">
                            Llega a más clientes y mantén tus precios actualizados con el sello de verificación.
                        </Text>
                    </View>

                    <View className="space-y-6">
                        <View>
                            <Text className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2 ml-1">Nombre del Comercio</Text>
                            <TextInput
                                className="bg-gray-50 border border-gray-100 p-5 rounded-2xl font-bold text-gray-900"
                                placeholder="Ej. Bodegón El Rey"
                                placeholderTextColor="#94a3b8"
                                value={storeName}
                                onChangeText={setStoreName}
                            />
                        </View>

                        <View>
                            <Text className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2 ml-1">Número de RIF</Text>
                            <TextInput
                                className="bg-gray-50 border border-gray-100 p-5 rounded-2xl font-bold text-gray-900"
                                placeholder="Ej. J-12345678-9"
                                placeholderTextColor="#94a3b8"
                                value={rif}
                                onChangeText={setRif}
                                autoCapitalize="characters"
                            />
                        </View>

                        <View>
                            <Text className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2 ml-1">Ubicación / Dirección</Text>
                            <TextInput
                                className="bg-gray-50 border border-gray-100 p-5 rounded-2xl font-bold text-gray-900"
                                placeholder="Ej. Av. Principal con Calle 4"
                                placeholderTextColor="#94a3b8"
                                value={location}
                                onChangeText={setLocation}
                                multiline
                                numberOfLines={2}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        className={`mt-10 py-5 rounded-2xl items-center justify-center ${loading ? 'bg-gray-200' : 'bg-primary'}`}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#102216" />
                        ) : (
                            <Text className="text-[#102216] font-black text-lg">ENVIAR SOLICITUD</Text>
                        )}
                    </TouchableOpacity>

                    <Text className="text-gray-400 text-[10px] text-center mt-6 uppercase font-bold px-4">
                        Al enviar, aceptas que revisaremos los datos de tu comercio para otorgar el sello de verificación.
                    </Text>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
