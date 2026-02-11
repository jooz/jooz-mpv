import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

export default function AdminRequestsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<any[]>([]);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    async function fetchRequests() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('merchant_requests')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleAction(requestId: string, action: 'approve' | 'reject', userId: string, storeName: string, location: string, rif: string) {
        setProcessing(requestId);
        try {
            if (action === 'approve') {
                const expiresAt = new Date();
                expiresAt.setMonth(expiresAt.getMonth() + 6);

                // 1. Update Request Status
                const { error: reqError } = await supabase
                    .from('merchant_requests')
                    .update({ status: 'approved' })
                    .eq('id', requestId);
                if (reqError) throw reqError;

                // 2. Check if store already exists or create/update it
                // Logic: Search by RIF or Name? Let's use name/location for now or create new
                const { data: existingStore } = await supabase
                    .from('stores')
                    .select('id')
                    .eq('name', storeName)
                    .single();

                if (existingStore) {
                    await supabase
                        .from('stores')
                        .update({
                            merchant_id: userId,
                            is_verified: true,
                            rif: rif,
                            subscription_tier: 'premium',
                            subscription_active: true,
                            subscription_expires_at: expiresAt.toISOString()
                        })
                        .eq('id', existingStore.id);
                } else {
                    await supabase
                        .from('stores')
                        .insert({
                            name: storeName,
                            location: location,
                            merchant_id: userId,
                            is_verified: true,
                            rif: rif,
                            subscription_tier: 'premium',
                            subscription_active: true,
                            subscription_expires_at: expiresAt.toISOString()
                        });
                }

                Alert.alert('¡Aprobado!', `El comercio ${storeName} ha sido activado con 6 meses Premium.`);
            } else {
                const { error } = await supabase
                    .from('merchant_requests')
                    .update({ status: 'rejected' })
                    .eq('id', requestId);
                if (error) throw error;
                Alert.alert('Rechazado', 'La solicitud ha sido rechazada.');
            }

            fetchRequests();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setProcessing(null);
        }
    }

    if (loading) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator color="#13ec5b" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#f8fafc]">
            <Stack.Screen
                options={{
                    headerTitle: 'Solicitudes Pendientes',
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: '#102216' },
                    headerTintColor: 'white',
                }}
            />

            {requests.length === 0 ? (
                <View className="flex-1 items-center justify-center px-10">
                    <MaterialIcons name="fact-check" size={80} color="#cbd5e1" />
                    <Text className="text-xl font-bold text-gray-900 text-center mt-6">No hay solicitudes pendientes</Text>
                    <Text className="text-gray-500 text-center mt-2">Buen trabajo, estás al día.</Text>
                </View>
            ) : (
                <FlatList
                    data={requests}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 20 }}
                    renderItem={({ item }) => (
                        <View className="bg-white rounded-3xl p-6 mb-4 shadow-sm border border-gray-100">
                            <View className="flex-row items-center mb-4">
                                <View className="bg-primary/10 p-3 rounded-2xl mr-4">
                                    <MaterialIcons name="storefront" size={24} color="#102216" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-900 font-black text-lg">{item.store_name}</Text>
                                    <Text className="text-gray-400 font-medium text-xs">RIF: {item.rif}</Text>
                                </View>
                            </View>

                            <View className="bg-gray-50 rounded-2xl p-4 mb-6">
                                <View className="flex-row items-start">
                                    <MaterialIcons name="location-on" size={16} color="#64748b" style={{ marginTop: 2 }} />
                                    <Text className="text-gray-600 ml-2 flex-1">{item.location}</Text>
                                </View>
                                <Text className="text-gray-400 text-[10px] mt-4 font-bold uppercase">Solicitado el:</Text>
                                <Text className="text-gray-600 font-bold">{new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString()}</Text>
                            </View>

                            <View className="flex-row space-x-3">
                                <TouchableOpacity
                                    className="flex-1 bg-rose-50 py-4 rounded-2xl items-center border border-rose-100"
                                    onPress={() => handleAction(item.id, 'reject', item.user_id, item.store_name, item.location, item.rif)}
                                    disabled={!!processing}
                                >
                                    <Text className="text-rose-600 font-black">RECHAZAR</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="flex-2 bg-primary py-4 rounded-2xl items-center"
                                    onPress={() => handleAction(item.id, 'approve', item.user_id, item.store_name, item.location, item.rif)}
                                    disabled={!!processing}
                                >
                                    <Text className="text-white font-black">APROBAR 6M PREMIUM</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                />
            )}
        </View>
    );
}
