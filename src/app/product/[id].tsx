import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useExchangeRates } from '../../context/ExchangeRateContext';
import { useLocation } from '../../context/LocationContext';
import { supabase } from '../../lib/supabase';

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { rates } = useExchangeRates();
    const { location } = useLocation();

    const [product, setProduct] = useState<any>(null);
    const [prices, setPrices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchProductData();
        }
    }, [id, location.municipality_id]);

    async function fetchProductData() {
        setLoading(true);
        try {
            // Fetch product basics
            const { data: prod, error: pError } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single();

            if (pError) throw pError;
            setProduct(prod);

            // Fetch prices with store info
            let query = supabase
                .from('prices')
                .select(`
                    id,
                    price_usd,
                    updated_at,
                    stores (
                        id,
                        name,
                        location,
                        municipality_id
                    )
                `)
                .eq('product_id', id);

            // Filter by municipality if selected
            if (location.municipality_id) {
                // Since prices -> stores is a many-to-one, we need to handle filtering carefully in PostgREST
                // Better approach: fetch all and filter client side OR use join logic if supported
                // For MVP, we'll fetch all and filter here to show "Nearby" first
            }

            const { data: priceData, error: prError } = await query.order('price_usd', { ascending: true });

            if (prError) throw prError;

            // Sort logic: Municipality matches first, then price
            const sorted = (priceData || []).sort((a: any, b: any) => {
                const aInMuni = a.stores?.municipality_id === location.municipality_id;
                const bInMuni = b.stores?.municipality_id === location.municipality_id;

                if (aInMuni && !bInMuni) return -1;
                if (!aInMuni && bInMuni) return 1;
                return a.price_usd - b.price_usd;
            });

            setPrices(sorted);
        } catch (e) {
            console.error('Error fetching product detail:', e);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#13ec5b" />
            </View>
        );
    }

    if (!product) {
        return (
            <View className="flex-1 bg-white items-center justify-center px-10">
                <Text className="text-xl font-bold text-gray-900 mb-2">Producto no encontrado</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text className="text-primary font-bold">Volver atrás</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const lowestPrice = prices.length > 0 ? prices[0].price_usd : 0;
    const lowestPriceBs = rates?.rate_bcv ? (lowestPrice * rates.rate_bcv).toFixed(2) : '0.00';

    return (
        <View className="flex-1 bg-[#f8fafc]">
            <Stack.Screen
                options={{
                    headerTransparent: true,
                    headerTitle: '',
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="bg-white/90 p-2 rounded-full ml-2 shadow-sm"
                        >
                            <MaterialIcons name="arrow-back" size={24} color="#102216" />
                        </TouchableOpacity>
                    ),
                    headerRight: () => (
                        <TouchableOpacity
                            className="bg-white/90 p-2 rounded-full mr-2 shadow-sm"
                        >
                            <MaterialIcons name="favorite-border" size={24} color="#102216" />
                        </TouchableOpacity>
                    )
                }}
            />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hero Section / Image */}
                <View className="bg-white items-center justify-center pt-24 pb-12 rounded-b-[48px] shadow-sm">
                    {product.image_url ? (
                        <Image
                            source={{ uri: product.image_url }}
                            className="w-64 h-64"
                            resizeMode="contain"
                        />
                    ) : (
                        <View className="w-64 h-64 bg-gray-50 rounded-full items-center justify-center">
                            <MaterialIcons name="inventory" size={80} color="#cbd5e1" />
                        </View>
                    )}
                </View>

                {/* Main Content */}
                <View className="px-6 -mt-10">
                    <View className="bg-white rounded-[40px] p-8 shadow-xl shadow-black/5">
                        <Text className="text-[#13ec5b] font-black uppercase text-xs tracking-[3px] mb-3">{product.brand}</Text>
                        <Text className="text-gray-900 text-3xl font-black leading-tight mb-4">{product.name}</Text>

                        <View className="flex-row items-baseline mb-6">
                            <Text className="text-gray-400 text-sm font-medium">Mejor precio:</Text>
                            <Text className="text-[#102216] text-3xl font-black ml-3">${lowestPrice.toFixed(2)}</Text>
                            <Text className="text-gray-400 text-base ml-2 font-medium">≈ Bs. {lowestPriceBs}</Text>
                        </View>

                        <View className="h-[1px] bg-gray-100 mb-6" />

                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center">
                                <View className="bg-blue-50 p-2 rounded-lg">
                                    <MaterialIcons name="category" size={20} color="#3b82f6" />
                                </View>
                                <Text className="text-gray-600 font-bold ml-2">{product.category || 'Varios'}</Text>
                            </View>
                            <View className="flex-row items-center">
                                <View className="bg-orange-50 p-2 rounded-lg">
                                    <MaterialIcons name="update" size={20} color="#f97316" />
                                </View>
                                <Text className="text-gray-400 text-xs font-bold ml-2 uppercase">Hoy</Text>
                            </View>
                        </View>
                    </View>

                    {/* Stores List */}
                    <View className="mt-8 mb-12">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-black text-gray-900">Precios por Tienda</Text>
                            <View className="bg-white px-4 py-2 rounded-full border border-gray-100 flex-row items-center">
                                <MaterialIcons name="filter-list" size={16} color="#64748b" />
                                <Text className="text-gray-500 text-xs font-bold ml-2">ORDENAR</Text>
                            </View>
                        </View>

                        {prices.length === 0 ? (
                            <View className="bg-white rounded-3xl p-8 items-center border border-gray-100">
                                <MaterialIcons name="store" size={40} color="#f1f5f9" />
                                <Text className="text-gray-500 font-bold mt-4">No hay precios reportados aún</Text>
                                <Text className="text-gray-400 text-center text-xs mt-2">Sé el primero en reportar un precio para este artículo.</Text>
                            </View>
                        ) : (
                            prices.map((price, index) => {
                                const isLocal = price.stores?.municipality_id === location.municipality_id;
                                return (
                                    <View
                                        key={price.id}
                                        className={`bg-white rounded-3xl p-5 mb-4 border ${isLocal ? 'border-primary/30 bg-primary/5' : 'border-gray-100 shadow-sm'} flex-row items-center`}
                                    >
                                        <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${isLocal ? 'bg-primary/20' : 'bg-gray-50'}`}>
                                            <MaterialIcons name="storefront" size={24} color={isLocal ? '#102216' : '#94a3b8'} />
                                        </View>

                                        <View className="flex-1">
                                            <Text className="text-gray-900 font-black text-base">{price.stores?.name}</Text>
                                            <Text className="text-gray-400 text-xs font-medium" numberOfLines={1}>
                                                {price.stores?.location || 'Dirección no disponible'}
                                            </Text>
                                            {isLocal && (
                                                <View className="flex-row items-center mt-1">
                                                    <View className="w-2 h-2 rounded-full bg-primary mr-1" />
                                                    <Text className="text-primary text-[10px] font-black uppercase">Cerca de ti</Text>
                                                </View>
                                            )}
                                        </View>

                                        <View className="items-end">
                                            <Text className="text-[#102216] text-xl font-black">${price.price_usd.toFixed(2)}</Text>
                                            <Text className="text-gray-400 text-[10px] font-bold">ACTUALIZADO HOY</Text>
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Action Bar */}
            <View
                style={{ paddingBottom: Math.max(insets.bottom, 20) }}
                className="bg-white px-6 pt-4 border-t border-gray-100 flex-row space-x-4 shadow-2xl"
            >
                <TouchableOpacity
                    className="flex-1 bg-[#102216] py-5 rounded-2xl items-center justify-center"
                    onPress={() => {
                        // Navigate to Report Price (Step 2 of Next Steps)
                        router.push({
                            pathname: '/(tabs)/admin',
                            params: { productId: product.id }
                        });
                    }}
                >
                    <Text className="text-primary font-black text-lg">REPORTAR PRECIO</Text>
                </TouchableOpacity>
                <TouchableOpacity className="bg-gray-100 p-5 rounded-2xl items-center justify-center">
                    <MaterialIcons name="share" size={24} color="#64748b" />
                </TouchableOpacity>
            </View>
        </View>
    );
}
