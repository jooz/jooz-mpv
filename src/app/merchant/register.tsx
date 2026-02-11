import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
            Alert.alert('Faltan datos', 'Por favor completa todos los campos.');
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace('/login');
                return;
            }

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
                'Tu solicitud está siendo procesada. Te notificaremos cuando seas verificado.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <View className="flex-1 bg-[#f8fafc]">
            <Stack.Screen
                options={{
                    headerTitle: 'Registro de Comercio',
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: '#102216' },
                    headerTintColor: 'white',
                }}
            />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 40 }}
            >
                <View className="bg-primary/10 p-6 rounded-[32px] mb-8 items-center">
                    <MaterialIcons name="verified-user" size={48} color="#102216" />
                    <Text className="text-[#102216] font-black text-xl mt-4 text-center">Únete como Comercio Verificado</Text>
                    <Text className="text-gray-600 text-center mt-2">
                        Gestiona tus propios precios, obtén el sello oficial y destaca ante los usuarios de tu zona.
                    </Text>
                </View>

                <View className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
                    <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-6">Información del Negocio</Text>

                    <View className="mb-6">
                        <Text className="text-gray-900 font-bold mb-2 ml-1">Nombre Comercial</Text>
                        <TextInput
                            className="bg-gray-50 p-4 rounded-2xl border border-gray-100 font-bold"
                            placeholder="Ej: Bodegón La Excelencia"
                            value={storeName}
                            onChangeText={setStoreName}
                        />
                    </View>

                    <View className="mb-6">
                        <Text className="text-gray-900 font-bold mb-2 ml-1">RIF (V-00000000-0)</Text>
                        <TextInput
                            className="bg-gray-50 p-4 rounded-2xl border border-gray-100 font-bold"
                            placeholder="J-12345678-9"
                            value={rif}
                            onChangeText={setRif}
                        />
                    </View>

                    <View className="mb-8">
                        <Text className="text-gray-900 font-bold mb-2 ml-1">Ubicación / Dirección Corta</Text>
                        <TextInput
                            className="bg-gray-50 p-4 rounded-2xl border border-gray-100 font-bold"
                            placeholder="Ej: Av. Principal, Sector Centro"
                            value={location}
                            onChangeText={setLocation}
                        />
                    </View>

                    <TouchableOpacity
                        className={`py-5 rounded-[24px] items-center ${loading ? 'bg-gray-200' : 'bg-[#102216]'}`}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-primary font-black text-lg">ENVIAR SOLICITUD</Text>
                        )}
                    </TouchableOpacity>

                    <Text className="text-gray-400 text-[10px] text-center mt-6 font-medium">
                        Al enviar, aceptas que un administrador valide tus datos legales.
                    </Text>
                </View>

                {/* Benefits */}
                <View className="mt-8 space-y-4">
                    <View className="flex-row items-center bg-white p-4 rounded-3xl border border-gray-100">
                        <View className="bg-emerald-50 p-2 rounded-xl mr-4">
                            <MaterialIcons name="trending-up" size={20} color="#10b981" />
                        </View>
                        <Text className="text-gray-600 font-bold text-xs flex-1">Posicionamiento prioritario en búsquedas</Text>
                    </View>
                    <View className="flex-row items-center bg-white p-4 rounded-3xl border border-gray-100">
                        <View className="bg-blue-50 p-2 rounded-xl mr-4">
                            <MaterialIcons name="upload-file" size={20} color="#3b82f6" />
                        </View>
                        <Text className="text-gray-600 font-bold text-xs flex-1">Carga masiva de inventario vía CSV</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
