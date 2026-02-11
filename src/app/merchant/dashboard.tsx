import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

export default function MerchantDashboardScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [stores, setStores] = useState<any[]>([]);
    const [selectedStore, setSelectedStore] = useState<any>(null);
    const [inventory, setInventory] = useState<any[]>([]);
    const [csvText, setCsvText] = useState('');
    const [showCsvInput, setShowCsvInput] = useState(false);

    useEffect(() => {
        fetchMerchantData();
    }, []);

    async function fetchMerchantData() {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace('/login');
                return;
            }

            // Fetch stores owned by this merchant
            const { data: storeData, error: sError } = await supabase
                .from('stores')
                .select('*')
                .eq('merchant_id', user.id);

            if (sError) throw sError;
            setStores(storeData || []);

            if (storeData && storeData.length > 0) {
                setSelectedStore(storeData[0]);
                fetchInventory(storeData[0].id);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    }

    async function fetchInventory(storeId: string) {
        try {
            const { data, error } = await supabase
                .from('prices')
                .select(`
                    id,
                    price_usd,
                    updated_at,
                    products (
                        id,
                        name,
                        brand,
                        image_url
                    )
                `)
                .eq('store_id', storeId)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setInventory(data || []);
        } catch (error: any) {
            console.error('Error fetching inventory:', error);
        }
    }

    async function handleUpdateAll() {
        if (!selectedStore) return;
        setSubmitting(true);
        try {
            const now = new Date().toISOString();
            const { error } = await supabase
                .from('prices')
                .update({ updated_at: now })
                .eq('store_id', selectedStore.id);

            if (error) throw error;
            Alert.alert('¡Éxito!', 'Todos los precios han sido marcados como actualizados hoy.');
            fetchInventory(selectedStore.id);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleCsvImport() {
        if (!csvText || !selectedStore) return;
        setSubmitting(true);
        try {
            const lines = csvText.split('\n');
            const newPrices = [];
            const { data: { user } } = await supabase.auth.getUser();

            for (const line of lines) {
                if (!line.trim()) continue;
                const [productId, priceStr] = line.split(',');
                const price = parseFloat(priceStr?.trim());

                if (productId && !isNaN(price)) {
                    newPrices.push({
                        product_id: productId.trim(),
                        store_id: selectedStore.id,
                        price_usd: price,
                        updated_by: user?.id
                    });
                }
            }

            if (newPrices.length === 0) {
                throw new Error('No se detectaron datos válidos en el CSV. Formato: id_producto, precio');
            }

            const { error } = await supabase
                .from('prices')
                .upsert(newPrices, { onConflict: 'product_id,store_id' });

            if (error) throw error;

            Alert.alert('¡Éxito!', `Se han importado/actualizado ${newPrices.length} productos.`);
            setCsvText('');
            setShowCsvInput(false);
            fetchInventory(selectedStore.id);
        } catch (error: any) {
            Alert.alert('Error de Importación', error.message);
        } finally {
            setSubmitting(false);
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
                    headerTitle: 'Panel de Comercio',
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: '#102216' },
                    headerTintColor: 'white',
                }}
            />

            {stores.length === 0 ? (
                <View className="flex-1 items-center justify-center px-10">
                    <MaterialIcons name="storefront" size={80} color="#cbd5e1" />
                    <Text className="text-xl font-bold text-gray-900 text-center mt-6">Aún no tienes tiendas verificadas</Text>
                    <Text className="text-gray-500 text-center mt-2">
                        Si ya enviaste tu solicitud, estamos revisándola. Si no, regístrate en los ajustes de tu perfil.
                    </Text>
                    <TouchableOpacity
                        className="mt-8 bg-primary px-8 py-4 rounded-2xl"
                        onPress={() => router.back()}
                    >
                        <Text className="text-[#102216] font-black">VOLVER</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
                >
                    {/* Store Selector / Header */}
                    <View className="bg-[#102216] px-6 pb-12 pt-6 rounded-b-[40px] shadow-lg">
                        <Text className="text-primary/60 font-black uppercase tracking-widest text-[10px] mb-2">Gestionando:</Text>
                        <View className="flex-row items-center justify-between">
                            <View>
                                <Text className="text-white text-2xl font-black">{selectedStore?.name}</Text>
                                <Text className="text-gray-400 font-medium">{selectedStore?.location}</Text>
                            </View>
                            <View className="bg-primary/20 p-3 rounded-2xl">
                                <MaterialIcons name="verified" size={24} color="#13ec5b" />
                            </View>
                        </View>
                    </View>

                    {/* Actions Card */}
                    <View className="px-6 -mt-8">
                        <View className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 mb-8">
                            <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-4">Acciones Rápidas</Text>

                            <View className="flex-row space-x-3">
                                <TouchableOpacity
                                    className="flex-1 bg-emerald-50 p-4 rounded-2xl items-center justify-center border border-emerald-100"
                                    onPress={handleUpdateAll}
                                    disabled={submitting}
                                >
                                    <MaterialIcons name="offline-pin" size={24} color="#10b981" />
                                    <Text className="text-[#065f46] font-black text-xs text-center mt-2">ACTUALIZAR TODO</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    className="flex-1 bg-blue-50 p-4 rounded-2xl items-center justify-center border border-blue-100"
                                    onPress={() => setShowCsvInput(!showCsvInput)}
                                >
                                    <MaterialIcons name="file-upload" size={24} color="#3b82f6" />
                                    <Text className="text-blue-800 font-black text-xs text-center mt-2">CARGA MASIVA</Text>
                                </TouchableOpacity>
                            </View>

                            {showCsvInput && (
                                <View className="mt-6 pt-6 border-t border-gray-100">
                                    <Text className="text-gray-600 font-bold mb-2">Editor de Carga (CSV)</Text>
                                    <Text className="text-gray-400 text-[10px] mb-4">Formato sugerido: ID_PRODUCTO, PRECIO_USD (una por línea)</Text>
                                    <TextInput
                                        className="bg-gray-50 border border-gray-100 p-4 rounded-xl font-mono text-xs h-32"
                                        multiline
                                        placeholder="uuid-producto-1, 1.50&#10;uuid-producto-2, 3.25"
                                        value={csvText}
                                        onChangeText={setCsvText}
                                    />
                                    <TouchableOpacity
                                        className="mt-4 bg-blue-600 py-4 rounded-xl items-center"
                                        onPress={handleCsvImport}
                                        disabled={submitting}
                                    >
                                        <Text className="text-white font-black">PROCESAR IMPORTACIÓN</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* Inventory List */}
                        <Text className="text-gray-900 font-black text-xl mb-4 ml-2">Mi Inventario</Text>

                        {inventory.length === 0 ? (
                            <View className="bg-white rounded-3xl p-10 items-center justify-center border border-dashed border-gray-200">
                                <MaterialIcons name="inventory" size={48} color="#f1f5f9" />
                                <Text className="text-gray-400 font-bold mt-4 text-center">Tu inventario está vacío. Usa la carga masiva para empezar.</Text>
                            </View>
                        ) : (
                            inventory.map((item) => (
                                <View
                                    key={item.id}
                                    className="bg-white rounded-2xl p-4 mb-3 flex-row items-center border border-gray-100"
                                >
                                    <View className="w-12 h-12 bg-gray-50 rounded-lg mr-4 items-center justify-center overflow-hidden border border-gray-100">
                                        {item.products?.image_url ? (
                                            <Image source={{ uri: item.products.image_url }} className="w-full h-full" contentFit="cover" />
                                        ) : (
                                            <MaterialIcons name="inventory" size={20} color="#cbd5e1" />
                                        )}
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-400 text-[10px] font-black uppercase">{item.products?.brand}</Text>
                                        <Text className="text-gray-900 font-bold" numberOfLines={1}>{item.products?.name}</Text>
                                        <Text className="text-emerald-600 font-black">${item.price_usd.toFixed(2)}</Text>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-gray-400 text-[10px] font-bold">ACTUALIZADO</Text>
                                        <Text className="text-gray-900 text-[10px] font-black uppercase">
                                            {new Date(item.updated_at).toLocaleDateString()}
                                        </Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                </ScrollView>
            )}
        </View>
    );
}
