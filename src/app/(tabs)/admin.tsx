import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocation } from '../../context/LocationContext';
import { supabase } from '../../lib/supabase';

export default function AdminScreen() {
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();
    const { location } = useLocation();

    // Data states
    const [products, setProducts] = useState<any[]>([]);
    const [stores, setStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Form states
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [selectedStore, setSelectedStore] = useState<any>(null);
    const [price, setPrice] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Modal states
    const [productModalVisible, setProductModalVisible] = useState(false);
    const [storeModalVisible, setStoreModalVisible] = useState(false);
    const [addStoreModalVisible, setAddStoreModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // New Store Form states
    const [newStoreName, setNewStoreName] = useState('');
    const [newStoreLocation, setNewStoreLocation] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, [location.municipality_id]);

    useEffect(() => {
        if (params.productId && products.length > 0) {
            const prod = products.find(p => p.id === params.productId);
            if (prod) setSelectedProduct(prod);
        }
    }, [params.productId, products]);

    async function fetchInitialData() {
        setLoading(true);
        try {
            // Fetch products for selection
            const { data: prodData } = await supabase.from('products').select('*').limit(50);
            if (prodData) setProducts(prodData);

            // Fetch stores in current municipality
            if (location.municipality_id) {
                const { data: storeData } = await supabase
                    .from('stores')
                    .select('*')
                    .eq('municipality_id', location.municipality_id);
                if (storeData) setStores(storeData);
            }
        } catch (e) {
            console.error('Error fetching admin data:', e);
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = async () => {
        if (!selectedProduct || !selectedStore || !price) {
            Alert.alert('Error', 'Por favor completa todos los campos.');
            return;
        }

        const priceNum = parseFloat(price.replace(',', '.'));
        if (isNaN(priceNum) || priceNum <= 0) {
            Alert.alert('Error', 'Precio inválido.');
            return;
        }

        setSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase
                .from('prices')
                .insert([
                    {
                        product_id: selectedProduct.id,
                        store_id: selectedStore.id,
                        price_usd: priceNum,
                        updated_by: user?.id
                    }
                ]);

            if (error) throw error;

            Alert.alert('¡Éxito!', 'Precio actualizado correctamente.');
            setPrice('');
            // Optional: reset selections?
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateStore = async () => {
        if (!newStoreName || !location.municipality_id) {
            Alert.alert('Error', 'El nombre de la tienda es obligatorio.');
            return;
        }

        setSubmitting(true);
        try {
            const { data: newStore, error } = await supabase
                .from('stores')
                .insert([
                    {
                        name: newStoreName,
                        location: newStoreLocation,
                        municipality_id: location.municipality_id
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            Alert.alert('¡Éxito!', 'Tienda registrada correctamente.');

            // Refresh stores list
            const { data: storeData } = await supabase
                .from('stores')
                .select('*')
                .eq('municipality_id', location.municipality_id);
            if (storeData) setStores(storeData);

            // Select the new store
            setSelectedStore(newStore);

            // Close modals and reset form
            setAddStoreModalVisible(false);
            setStoreModalVisible(false);
            setNewStoreName('');
            setNewStoreLocation('');
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-[#f8fafc]"
        >
            <ScrollView
                contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 24, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="mb-8">
                    <Text className="text-4xl font-black text-gray-900 tracking-tighter">Panel de Supervisor</Text>
                    <Text className="text-gray-500 mt-2 text-lg">Reporta precios reales para la comunidad.</Text>
                </View>

                {loading && (
                    <View className="flex-row items-center bg-blue-50 p-4 rounded-2xl mb-8 border border-blue-100">
                        <ActivityIndicator color="#3b82f6" />
                        <Text className="ml-3 text-blue-600 font-bold">Actualizando base de datos...</Text>
                    </View>
                )}

                {/* Info Card */}
                <View className="bg-[#102216] p-6 rounded-[32px] mb-8 shadow-xl shadow-black/10">
                    <View className="flex-row items-center mb-4">
                        <View className="bg-primary/20 p-2 rounded-full mr-3">
                            <MaterialIcons name="location-on" size={20} color="#13ec5b" />
                        </View>
                        <Text className="text-white font-bold text-base">Zona de Trabajo</Text>
                    </View>
                    <Text className="text-primary text-2xl font-black">
                        {location.municipality_name || 'Sin Ubicación'}
                    </Text>
                    <Text className="text-gray-400 mt-1">{location.state_name}</Text>
                </View>

                {/* Form */}
                <View className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">

                    {/* Product Selection */}
                    <Text className="text-gray-400 text-xs font-black uppercase tracking-widest mb-3">1. Seleccionar Producto</Text>
                    <TouchableOpacity
                        className="bg-gray-50 border border-gray-100 p-5 rounded-2xl flex-row items-center justify-between mb-8"
                        onPress={() => setProductModalVisible(true)}
                    >
                        <View className="flex-row items-center flex-1">
                            <MaterialIcons name="inventory" size={24} color={selectedProduct ? "#102216" : "#cbd5e1"} />
                            <Text className={`ml-4 text-base font-bold ${selectedProduct ? 'text-gray-900' : 'text-gray-400'}`}>
                                {selectedProduct ? `${selectedProduct.brand} - ${selectedProduct.name}` : 'Toca para buscar producto'}
                            </Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#64748b" />
                    </TouchableOpacity>

                    {/* Store Selection */}
                    <Text className="text-gray-400 text-xs font-black uppercase tracking-widest mb-3">2. Seleccionar Comercio</Text>
                    <TouchableOpacity
                        className="bg-gray-50 border border-gray-100 p-5 rounded-2xl flex-row items-center justify-between mb-8"
                        onPress={() => setStoreModalVisible(true)}
                    >
                        <View className="flex-row items-center flex-1">
                            <MaterialIcons name="storefront" size={24} color={selectedStore ? "#102216" : "#cbd5e1"} />
                            <Text className={`ml-4 text-base font-bold ${selectedStore ? 'text-gray-900' : 'text-gray-400'}`}>
                                {selectedStore ? selectedStore.name : '¿En qué tienda estás?'}
                            </Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#64748b" />
                    </TouchableOpacity>

                    {/* Price Input */}
                    <Text className="text-gray-400 text-xs font-black uppercase tracking-widest mb-3">3. Precio en Dólares ($)</Text>
                    <View className="bg-gray-50 border border-gray-100 p-5 rounded-2xl flex-row items-center mb-10">
                        <Text className="text-gray-400 text-2xl font-black">$</Text>
                        <TextInput
                            className="flex-1 ml-4 text-2xl font-black text-gray-900"
                            placeholder="0.00"
                            placeholderTextColor="#cbd5e1"
                            keyboardType="decimal-pad"
                            value={price}
                            onChangeText={setPrice}
                        />
                    </View>

                    {/* Submit */}
                    <TouchableOpacity
                        className={`py-6 rounded-3xl items-center shadow-lg ${submitting ? 'bg-gray-400' : 'bg-[#102216] shadow-emerald-900/20'}`}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#13ec5b" />
                        ) : (
                            <Text className="text-primary font-black text-xl tracking-tighter">GUARDAR PRECIO</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Product Modal */}
            <Modal visible={productModalVisible} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1 bg-black/50 justify-end"
                >
                    <View className="bg-white h-[80%] rounded-t-[48px] p-6">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-2xl font-black text-gray-900">Buscar Producto</Text>
                            <TouchableOpacity onPress={() => setProductModalVisible(false)} className="bg-gray-100 p-2 rounded-full">
                                <MaterialIcons name="close" size={24} color="black" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            className="bg-gray-100 p-5 rounded-2xl mb-6 font-bold text-gray-900"
                            placeholder="Ej. Harina Pan..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />

                        <FlatList
                            data={filteredProducts}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    className="p-5 border-b border-gray-50 flex-row items-center"
                                    onPress={() => {
                                        setSelectedProduct(item);
                                        setProductModalVisible(false);
                                        setSearchQuery('');
                                    }}
                                >
                                    <View className="bg-gray-50 p-3 rounded-xl mr-4">
                                        <MaterialIcons name="inventory" size={24} color="#cbd5e1" />
                                    </View>
                                    <View>
                                        <Text className="text-gray-400 text-[10px] font-bold uppercase">{item.brand}</Text>
                                        <Text className="text-gray-900 font-bold text-base">{item.name}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Store Modal */}
            <Modal visible={storeModalVisible} animationType="slide" transparent>
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white h-[60%] rounded-t-[48px] p-6">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-2xl font-black text-gray-900">Seleccionar Tienda</Text>
                            <TouchableOpacity onPress={() => setStoreModalVisible(false)} className="bg-gray-100 p-2 rounded-full">
                                <MaterialIcons name="close" size={24} color="black" />
                            </TouchableOpacity>
                        </View>

                        {stores.length === 0 ? (
                            <View className="flex-1 items-center justify-center p-10">
                                <MaterialIcons name="store" size={64} color="#f1f5f9" />
                                <Text className="text-gray-500 font-bold text-center mt-4">No hay tiendas en tu ubicación actual.</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={stores}
                                keyExtractor={item => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        className="p-5 border-b border-gray-50 flex-row items-center"
                                        onPress={() => {
                                            setSelectedStore(item);
                                            setStoreModalVisible(false);
                                        }}
                                    >
                                        <View className="bg-primary/10 p-3 rounded-xl mr-4">
                                            <MaterialIcons name="storefront" size={24} color="#102216" />
                                        </View>
                                        <View>
                                            <Text className="text-gray-900 font-bold text-base">{item.name}</Text>
                                            <Text className="text-gray-400 text-xs">{item.location}</Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                            />
                        )}

                        <TouchableOpacity
                            className="bg-primary py-4 rounded-2xl flex-row items-center justify-center mt-4 border border-[#102216]/10"
                            onPress={() => {
                                setStoreModalVisible(false);
                                setTimeout(() => setAddStoreModalVisible(true), 300);
                            }}
                        >
                            <MaterialIcons name="add-business" size={24} color="#102216" />
                            <Text className="ml-2 text-[#102216] font-black text-sm uppercase">Registrar Tienda Nueva</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Add Store Modal */}
            <Modal visible={addStoreModalVisible} animationType="fade" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1 bg-black/60 justify-center p-6"
                >
                    <View className="bg-white rounded-[40px] p-8">
                        <View className="flex-row justify-between items-center mb-8">
                            <Text className="text-2xl font-black text-gray-900">Nueva Tienda</Text>
                            <TouchableOpacity onPress={() => setAddStoreModalVisible(false)} className="bg-gray-100 p-2 rounded-full">
                                <MaterialIcons name="close" size={24} color="black" />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Nombre del Comercio</Text>
                        <TextInput
                            className="bg-gray-50 border border-gray-100 p-5 rounded-2xl mb-6 font-bold text-gray-900"
                            placeholder="Ej. Bodegón El Chamo"
                            value={newStoreName}
                            onChangeText={setNewStoreName}
                        />

                        <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Referencia / Dirección</Text>
                        <TextInput
                            className="bg-gray-50 border border-gray-100 p-5 rounded-2xl mb-8 font-bold text-gray-900"
                            placeholder="Ej. Av. Principal, frente a la plaza"
                            value={newStoreLocation}
                            onChangeText={setNewStoreLocation}
                        />

                        <TouchableOpacity
                            className={`py-5 rounded-3xl items-center shadow-lg ${submitting ? 'bg-gray-400' : 'bg-[#102216] shadow-emerald-900/20'}`}
                            onPress={handleCreateStore}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#13ec5b" />
                            ) : (
                                <Text className="text-primary font-black text-lg tracking-tighter">CONFIRMAR REGISTRO</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </KeyboardAvoidingView>
    );
}
