import { LucideChevronDown, LucideNavigation, LucideX } from 'lucide-react-native';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useLocation } from '../context/LocationContext';
import { useUserLocationLogic } from '../hooks/useUserLocation';
import { supabase } from '../lib/supabase';

export interface LocationSelectorHandle {
    open: () => void;
}

export const LocationSelector = forwardRef<LocationSelectorHandle>((props, ref) => {
    const { location, setLocation } = useLocation();
    const { detectLocation, isDetecting } = useUserLocationLogic();
    const [modalVisible, setModalVisible] = useState(false);
    const [step, setStep] = useState<'state' | 'municipality'>('state');
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [selectedStateName, setSelectedStateName] = useState<string | null>(null);

    const [statesList, setStatesList] = useState<{ id: string, name: string }[]>([]);
    const [muniList, setMuniList] = useState<{ id: string, name: string }[]>([]);
    const [loadingConfig, setLoadingConfig] = useState(false);

    useImperativeHandle(ref, () => ({
        open: openModal
    }));

    const openModal = async () => {
        setModalVisible(true);
        setStep('state');
        setLoadingConfig(true);
        try {
            const { data } = await supabase.from('states').select('id, name').order('name');
            if (data) setStatesList(data);
        } catch (e) {
            console.warn('Error fetching states:', e);
        } finally {
            setLoadingConfig(false);
        }
    };

    const handleStateSelect = async (state: { id: string, name: string }) => {
        setSelectedState(state.id);
        setSelectedStateName(state.name);
        setStep('municipality');
        setLoadingConfig(true);
        try {
            const { data } = await supabase.from('municipalities').select('id, name').eq('state_id', state.id).order('name');
            if (data) setMuniList(data);
        } catch (e) {
            console.warn('Error fetching municipalities:', e);
        } finally {
            setLoadingConfig(false);
        }
    };

    const handleMuniSelect = (muni: { id: string, name: string }) => {
        if (selectedState && selectedStateName) {
            setLocation({
                state_id: selectedState,
                municipality_id: muni.id,
                state_name: selectedStateName,
                municipality_name: muni.name,
                isManual: true
            });
            setModalVisible(false);
        }
    };

    return (
        <Modal visible={modalVisible} animationType="slide" transparent>
            <View className="flex-1 bg-black/60 justify-end">
                <View className="bg-white rounded-t-[40px] h-[85%] p-8">
                    <View className="flex-row justify-between items-center mb-8">
                        <View>
                            <Text className="text-2xl font-black text-gray-900">
                                {step === 'state' ? 'Tu Estado' : 'Tu Municipio'}
                            </Text>
                            <Text className="text-gray-500 font-medium">
                                {step === 'state' ? 'Selecciona donde te encuentras' : `Municipios en ${selectedStateName}`}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setModalVisible(false)}
                            className="bg-gray-100 p-2 rounded-full"
                        >
                            <LucideX size={24} color="#102216" />
                        </TouchableOpacity>
                    </View>

                    {/* GPS Button */}
                    {step === 'state' && (
                        <TouchableOpacity
                            className="flex-row items-center bg-primary p-5 rounded-2xl mb-6 shadow-sm shadow-primary/30"
                            onPress={async () => {
                                await detectLocation();
                                setModalVisible(false);
                            }}
                            disabled={isDetecting}
                        >
                            <View className="bg-white/20 p-2 rounded-lg">
                                {isDetecting ? <ActivityIndicator color="white" /> : <LucideNavigation size={20} color="white" />}
                            </View>
                            <Text className="ml-4 text-white font-bold text-lg">Usar ubicación actual</Text>
                        </TouchableOpacity>
                    )}

                    {loadingConfig ? (
                        <View className="flex-1 items-center justify-center">
                            <ActivityIndicator size="large" color="#13ec5b" />
                        </View>
                    ) : (
                        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                            {step === 'state' ? (
                                statesList.map(item => (
                                    <TouchableOpacity
                                        key={item.id}
                                        className="py-5 border-b border-gray-50 flex-row justify-between items-center"
                                        onPress={() => handleStateSelect(item)}
                                    >
                                        <Text className="text-lg font-bold text-gray-700">{item.name}</Text>
                                        <LucideChevronDown size={20} color="#cbd5e1" style={{ transform: [{ rotate: '-90deg' }] }} />
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <>
                                    <TouchableOpacity
                                        onPress={() => setStep('state')}
                                        className="mb-4 bg-gray-50 p-3 rounded-xl flex-row items-center"
                                    >
                                        <Text className="text-[#13ec5b] font-bold">← Cambiar de Estado</Text>
                                    </TouchableOpacity>
                                    {muniList.map(item => (
                                        <TouchableOpacity
                                            key={item.id}
                                            className="py-5 border-b border-gray-50"
                                            onPress={() => handleMuniSelect(item)}
                                        >
                                            <Text className="text-lg font-bold text-gray-700">{item.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                    {muniList.length === 0 && (
                                        <View className="py-10 items-center">
                                            <Text className="text-gray-400 font-medium">No se encontraron municipios</Text>
                                        </View>
                                    )}
                                </>
                            )}
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );
});

