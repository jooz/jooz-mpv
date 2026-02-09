import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AdBanner from '../../components/AdBanner';
import { LocationSelector, LocationSelectorHandle } from '../../components/LocationSelector';
import { useExchangeRates } from '../../context/ExchangeRateContext';
import { useLocation } from '../../context/LocationContext';
import { useInterstitialAd } from '../../hooks/useInterstitialAd';

const CATEGORIES = [
  { id: 'Alimentos', name: 'Alimentos', icon: 'lunch-dining', color: 'bg-emerald-500', textColor: 'text-white' },
  { id: 'Farmacia', name: 'Farmacia', icon: 'local-pharmacy', color: 'bg-blue-500', textColor: 'text-white' },
  { id: 'Cuidado Personal', name: 'Cuidado Personal', icon: 'soap', color: 'bg-rose-500', textColor: 'text-white' },
  { id: 'Licores', name: 'Licores', icon: 'liquor', color: 'bg-amber-600', textColor: 'text-white' },
  { id: 'Limpieza', name: 'Limpieza', icon: 'cleaning-services', color: 'bg-cyan-500', textColor: 'text-white' },
  { id: 'Carniceria', name: 'Carnicería', icon: 'kebab-dining', color: 'bg-red-600', textColor: 'text-white' },
];

export default function HomeScreen() {
  const { location } = useLocation();
  const { rates, refreshRates } = useExchangeRates();
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAd } = useInterstitialAd();
  const locationRef = useRef<LocationSelectorHandle>(null);

  const handleCategoryPress = (categoryId: string) => {
    showAd();
    router.push({
      pathname: '/(tabs)/search',
      params: { category: categoryId }
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshRates();
    setRefreshing(false);
  };

  return (
    <View className="flex-1 bg-[#f8fafc]">
      <LocationSelector ref={locationRef} />

      {/* Header Section */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-white border-b border-gray-100 shadow-sm"
      >
        <View className="px-6 pt-4 pb-6">
          {/* Location Selector */}
          <View className="mb-4">
            <Text className="text-[10px] text-gray-400 mb-1 font-black uppercase tracking-[2px]">Tu Ubicación Actual</Text>
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => locationRef.current?.open()}
            >
              <View className="bg-primary/20 p-1.5 rounded-full mr-2">
                <MaterialIcons name="location-on" size={18} color="#102216" />
              </View>
              <Text className="text-xl font-black text-gray-900">
                {(location.municipality_name && location.state_name)
                  ? `${location.municipality_name}, ${location.state_name}`
                  : location.state_name || 'Seleccionar Ubicación'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={24} color="#cbd5e1" className="ml-1" />
            </TouchableOpacity>
          </View>

          {/* Exchange Rate Display */}
          {rates?.rate_bcv && (
            <View className="flex-row items-center justify-between bg-[#102216] px-5 py-4 rounded-3xl">
              <View className="flex-row items-center">
                <MaterialIcons name="trending-up" size={18} color="#13ec5b" />
                <Text className="text-xs font-bold text-gray-300 ml-2 uppercase tracking-widest">
                  Tasa BCV
                </Text>
              </View>
              <Text className="text-xl font-black text-primary">
                Bs. {rates.rate_bcv.toFixed(2)}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#13ec5b']} />
        }
      >
        {/* Categories Grid */}
        <View className="px-6 pb-8 mt-4">
          <Text className="text-2xl font-black text-gray-900 tracking-tighter mb-6">Categorías Populares</Text>

          <View className="flex-row flex-wrap -mx-2">
            {CATEGORIES.map((category) => (
              <View key={category.id} className="w-1/2 px-2 mb-4">
                <TouchableOpacity
                  activeOpacity={0.8}
                  className={`${category.color} rounded-[40px] p-6 shadow-xl shadow-black/5 border border-white/10`}
                  onPress={() => handleCategoryPress(category.id)}
                >
                  <View className="items-center">
                    <View className="bg-white/20 rounded-2xl p-4 mb-3">
                      <MaterialIcons name={category.icon as any} size={32} color="white" />
                    </View>
                    <Text className={`${category.textColor} font-black text-center text-xs uppercase tracking-tighter`}>
                      {category.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Promo Section */}
        <View className="px-6">
          <TouchableOpacity
            activeOpacity={0.95}
            className="bg-[#102216] rounded-[48px] p-10 relative overflow-hidden border border-primary/20"
          >
            <View className="z-10">
              <View className="bg-primary/20 self-start px-3 py-1 rounded-full mb-4">
                <Text className="text-primary font-black text-[10px] uppercase">TIP DE AHORRO</Text>
              </View>
              <Text className="text-white text-3xl font-black leading-[1.1] mb-4">
                Compara y ahorra en segundos
              </Text>
              <Text className="text-gray-400 text-sm font-medium leading-relaxed">
                Nuestros supervisores actualizan los precios diariamente para que encuentres la mejor opción en tu municipio.
              </Text>
            </View>
            <View className="absolute -bottom-10 -right-10 opacity-20">
              <MaterialIcons name="auto-graph" size={180} color="#13ec5b" />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Ad Banner at the bottom */}
      <View className="bg-white border-t border-gray-100">
        <AdBanner />
      </View>
    </View>
  );
}
