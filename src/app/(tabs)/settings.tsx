import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocationSelector, LocationSelectorHandle } from '../../components/LocationSelector';
import { useLocation } from '../../context/LocationContext';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { location } = useLocation();
    const locationRef = useRef<LocationSelectorHandle>(null);

    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [useBsAsDefault, setUseBsAsDefault] = useState(false);

    useEffect(() => {
        fetchUserData();
    }, []);

    async function fetchUserData() {
        setLoading(true);
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            setUser(authUser);

            if (authUser) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*, states(name), municipalities(name)')
                    .eq('id', authUser.id)
                    .single();
                setProfile(profileData);
            }
        } catch (e) {
            console.error('Error fetching profile:', e);
        } finally {
            setLoading(false);
        }
    }

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            Alert.alert('Error', error.message);
        } else {
            router.replace('/(auth)/login');
        }
    };

    if (loading) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator color="#13ec5b" />
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-[#f8fafc]" showsVerticalScrollIndicator={false}>
            <LocationSelector ref={locationRef} />

            {/* Header / User Info */}
            <View
                style={{ paddingTop: insets.top + 40 }}
                className="bg-[#102216] px-8 pb-12 rounded-b-[60px] shadow-2xl"
            >
                <View className="flex-row items-center">
                    <View className="w-20 h-20 bg-primary/20 rounded-[30px] items-center justify-center border border-primary/30">
                        <MaterialIcons name="person" size={40} color="#13ec5b" />
                    </View>
                    <View className="ml-6 flex-1">
                        <Text className="text-white text-2xl font-black mb-1" numberOfLines={1}>
                            {profile?.full_name || user?.email?.split('@')[0] || 'Usuario'}
                        </Text>
                        <View className="flex-row items-center">
                            <View className="bg-primary px-3 py-1 rounded-full mr-2">
                                <Text className="text-[#102216] text-[10px] font-black uppercase">
                                    {profile?.role || 'User'}
                                </Text>
                            </View>
                            <Text className="text-gray-400 text-xs font-medium">{user?.email}</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View className="px-6 -mt-8">
                {/* Account Settings */}
                <View className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 mb-6">
                    <Text className="text-gray-400 text-xs font-black uppercase tracking-widest mb-6">Cuenta y Preferencias</Text>

                    {/* Location Setting */}
                    <TouchableOpacity
                        className="flex-row items-center justify-between py-4 border-b border-gray-50"
                        onPress={() => locationRef.current?.open()}
                    >
                        <View className="flex-row items-center">
                            <View className="bg-blue-50 p-3 rounded-2xl mr-4">
                                <MaterialIcons name="location-on" size={24} color="#3b82f6" />
                            </View>
                            <View>
                                <Text className="text-gray-900 font-bold text-base">Ubicación Predeterminada</Text>
                                <Text className="text-gray-400 text-sm">
                                    {location.municipality_name ? `${location.municipality_name}, ${location.state_name}` : 'No establecida'}
                                </Text>
                            </View>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#cbd5e1" />
                    </TouchableOpacity>

                    {/* Currency Setting */}
                    <View className="flex-row items-center justify-between py-4 border-b border-gray-50">
                        <View className="flex-row items-center">
                            <View className="bg-emerald-50 p-3 rounded-2xl mr-4">
                                <MaterialIcons name="payments" size={24} color="#10b981" />
                            </View>
                            <View>
                                <Text className="text-gray-900 font-bold text-base">Ver precios en Bolívares</Text>
                                <Text className="text-gray-400 text-sm">Cambio automático vía BCV</Text>
                            </View>
                        </View>
                        <Switch
                            value={useBsAsDefault}
                            onValueChange={setUseBsAsDefault}
                            trackColor={{ false: '#f1f5f9', true: '#13ec5b' }}
                            thumbColor="#fff"
                        />
                    </View>

                    {/* Premium Setting */}
                    <TouchableOpacity
                        className="flex-row items-center justify-between py-4"
                        onPress={() => Alert.alert('Premium', 'Próximamente: Navegación sin anuncios.')}
                    >
                        <View className="flex-row items-center">
                            <View className="bg-amber-50 p-3 rounded-2xl mr-4">
                                <MaterialIcons name="workspace-premium" size={24} color="#f59e0b" />
                            </View>
                            <View>
                                <Text className="text-gray-900 font-bold text-base">Eliminar Anuncios</Text>
                                <Text className="text-gray-400 text-sm">Membresía Premium</Text>
                            </View>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#cbd5e1" />
                    </TouchableOpacity>
                </View>

                {/* Support & Legal */}
                <View className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 mb-12">
                    <Text className="text-gray-400 text-xs font-black uppercase tracking-widest mb-6">Ayuda y Legal</Text>

                    <TouchableOpacity className="flex-row items-center justify-between py-4 border-b border-gray-50">
                        <View className="flex-row items-center">
                            <View className="bg-gray-50 p-3 rounded-2xl mr-4">
                                <MaterialIcons name="help-outline" size={24} color="#64748b" />
                            </View>
                            <Text className="text-gray-900 font-bold text-base">Soporte Técnico</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="flex-row items-center justify-between py-4"
                        onPress={handleLogout}
                    >
                        <View className="flex-row items-center">
                            <View className="bg-rose-50 p-3 rounded-2xl mr-4">
                                <MaterialIcons name="logout" size={24} color="#f43f5e" />
                            </View>
                            <Text className="text-rose-600 font-bold text-base">Cerrar Sesión</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <Text className="text-center text-gray-300 font-bold text-[10px] tracking-[5px] uppercase mb-10">Jooz v1.2.0 MVP</Text>
            </View>
        </ScrollView>
    );
}
