import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AdBanner from '../../components/AdBanner';
import { useExchangeRates } from '../../context/ExchangeRateContext';
import { useLocation } from '../../context/LocationContext';
import { supabase } from '../../lib/supabase';

const CATEGORIES = [
    { id: 'Alimentos', name: 'Alimentos', icon: 'lunch-dining' },
    { id: 'Farmacia', name: 'Farmacia', icon: 'local-pharmacy' },
    { id: 'Cuidado Personal', name: 'Cuidado Personal', icon: 'soap' },
    { id: 'Licores', name: 'Licores', icon: 'liquor' },
    { id: 'Limpieza', name: 'Limpieza', icon: 'cleaning-services' },
    { id: 'Carniceria', name: 'Carnicería', icon: 'kebab-dining' },
];

export default function SearchScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const params = useLocalSearchParams();
    const { rates } = useExchangeRates();
    const { location } = useLocation();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>((params.category as string) || null);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, [searchQuery, selectedCategory, location.municipality_id]);

    async function fetchProducts() {
        setLoading(true);
        try {
            let query = supabase
                .from('products')
                .select(`
                    *,
                    prices (
                        price_usd,
                        stores (
                            name,
                            municipality_id
                        )
                    )
                `);

            if (searchQuery) {
                query = query.ilike('name', `%${searchQuery}%`);
            }
            if (selectedCategory) {
                query = query.eq('category', selectedCategory);
            }

            const { data, error } = await query.limit(50);

            if (error) throw error;

            const formatted = (data || []).map(p => {
                const localPrices = p.prices?.filter((pr: any) =>
                    !location.municipality_id || pr.stores?.municipality_id === location.municipality_id
                ) || [];

                const minPrice = localPrices.length > 0
                    ? Math.min(...localPrices.map((pr: any) => pr.price_usd))
                    : 0;

                return { ...p, minPrice };
            });

            setProducts(formatted);
        } catch (e) {
            console.error('Error fetching products:', e);
        } finally {
            setLoading(false);
        }
    }

    const renderProduct = ({ item }: { item: any }) => {
        const priceBs = rates?.rate_bcv ? (item.minPrice * rates.rate_bcv).toFixed(2) : '0.00';

        return (
            <TouchableOpacity
                className="bg-white rounded-[32px] p-5 mb-4 flex-row items-center border border-gray-100 shadow-sm"
                activeOpacity={0.7}
                onPress={() => router.push(`/product/${item.id}`)}
            >
                {/* Product Image */}
                <View className="w-20 h-20 bg-gray-50 rounded-2xl items-center justify-center mr-4 border border-gray-100 overflow-hidden">
                    {item.image_url ? (
                        <Image
                            source={{ uri: item.image_url }}
                            className="w-full h-full"
                            resizeMode="contain"
                        />
                    ) : (
                        <MaterialIcons name="inventory" size={32} color="#cbd5e1" />
                    )}
                </View>

                {/* Info */}
                <View className="flex-1">
                    <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{item.brand || 'Marca Blanca'}</Text>
                    <Text className="text-gray-900 text-lg font-bold leading-tight mb-2" numberOfLines={2}>{item.name}</Text>

                    <View className="flex-row items-baseline">
                        <Text className="text-[#102216] text-xl font-black">${item.minPrice.toFixed(2)}</Text>
                        <Text className="text-gray-400 text-xs ml-2 font-medium">≈ Bs. {priceBs}</Text>
                    </View>
                </View>

                <View className="bg-primary/10 p-2 rounded-full">
                    <MaterialIcons name="chevron-right" size={24} color="#102216" />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-1 bg-[#f8fafc]">
            {/* Header */}
            <View
                style={{ paddingTop: insets.top }}
                className="bg-white px-6 pb-6 shadow-sm z-10"
            >
                <View className="flex-row justify-between items-center mb-6 mt-4">
                    <Text className="text-3xl font-black text-gray-900 tracking-tighter">Artículos</Text>
                    {loading && <ActivityIndicator color="#13ec5b" />}
                </View>

                {/* Search Input */}
                <View className="flex-row items-center bg-gray-50 rounded-[20px] px-5 py-4 border border-gray-100">
                    <MaterialIcons name="search" size={24} color="#64748b" />
                    <TextInput
                        placeholder="Harina, Arroz, Pasta..."
                        placeholderTextColor="#94a3b8"
                        className="flex-1 ml-4 text-lg text-gray-900 font-bold"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <MaterialIcons name="cancel" size={20} color="#cbd5e1" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mt-6 -mx-6 px-6"
                >
                    <TouchableOpacity
                        className={`mr-3 px-6 py-3 rounded-full border ${selectedCategory === null ? 'bg-[#102216] border-[#102216]' : 'bg-white border-gray-200'}`}
                        onPress={() => setSelectedCategory(null)}
                    >
                        <Text className={`font-black uppercase text-[10px] tracking-widest ${selectedCategory === null ? 'text-primary' : 'text-gray-500'}`}>Todos</Text>
                    </TouchableOpacity>
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            className={`mr-3 px-6 py-3 rounded-full border ${selectedCategory === cat.id ? 'bg-[#102216] border-[#102216]' : 'bg-white border-gray-200'}`}
                            onPress={() => setSelectedCategory(cat.id)}
                        >
                            <Text className={`font-black uppercase text-[10px] tracking-widest ${selectedCategory === cat.id ? 'text-primary' : 'text-gray-500'}`}>{cat.name}</Text>
                        </TouchableOpacity>
                    ))}
                    <View className="w-10" />
                </ScrollView>
            </View>

            {/* Results List */}
            {products.length === 0 && !loading ? (
                <View className="flex-1 items-center justify-center px-10">
                    <View className="bg-white p-10 rounded-[60px] shadow-xl shadow-black/5 mb-8">
                        <MaterialIcons name="search-off" size={80} color="#f1f5f9" />
                    </View>
                    <Text className="text-2xl font-black text-gray-900 mb-2 text-center">Sin resultados</Text>
                    <Text className="text-gray-400 text-center font-medium leading-relaxed">
                        No encontramos artículos en esta zona para la categoría seleccionada.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={products}
                    renderItem={renderProduct}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    refreshing={loading}
                    onRefresh={fetchProducts}
                />
            )}

            {/* Ad Banner at the bottom */}
            <View className="bg-white border-t border-gray-100">
                <AdBanner />
            </View>
        </View>
    );
}
