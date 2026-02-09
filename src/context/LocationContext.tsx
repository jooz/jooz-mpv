import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type UserLocation = {
    state_id: string | null;
    municipality_id: string | null;
    state_name?: string;
    municipality_name?: string;
    isManual?: boolean;
    coordinates?: { latitude: number; longitude: number };
};

type LocationContextType = {
    location: UserLocation;
    setLocation: (loc: UserLocation) => void;
    loading: boolean;
    detectLocation: () => Promise<void>;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

// Venezuelan state boundaries (approximate center coordinates)
const STATE_COORDINATES: Record<string, { lat: number; lng: number; name: string }> = {
    'Distrito Capital': { lat: 10.4806, lng: -66.9036, name: 'Distrito Capital' },
    'Miranda': { lat: 10.3, lng: -66.6, name: 'Miranda' },
    'Zulia': { lat: 10.15, lng: -72.25, name: 'Zulia' },
    'Carabobo': { lat: 10.18, lng: -68.0, name: 'Carabobo' },
    'Lara': { lat: 10.07, lng: -69.33, name: 'Lara' },
    'Aragua': { lat: 10.24, lng: -67.59, name: 'Aragua' },
    'Anzoátegui': { lat: 9.05, lng: -64.7, name: 'Anzoátegui' },
    'Táchira': { lat: 7.92, lng: -72.25, name: 'Táchira' },
    'Mérida': { lat: 8.59, lng: -71.15, name: 'Mérida' },
    'Bolívar': { lat: 6.0, lng: -63.5, name: 'Bolívar' },
    'Falcón': { lat: 11.411, lng: -69.673, name: 'Falcón' },
    'Falcón (Punto Fijo)': { lat: 11.7, lng: -70.2, name: 'Falcón' },
    'Barinas': { lat: 8.622, lng: -70.233, name: 'Barinas' },
    'Portuguesa': { lat: 9.052, lng: -69.255, name: 'Portuguesa' },
    'Monagas': { lat: 9.743, lng: -63.178, name: 'Monagas' },
    'Sucre': { lat: 10.453, lng: -64.182, name: 'Sucre' },
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function findNearestState(latitude: number, longitude: number): string | null {
    let nearestState: string | null = null;
    let minDistance = Infinity;

    for (const [state, coords] of Object.entries(STATE_COORDINATES)) {
        const distance = calculateDistance(latitude, longitude, coords.lat, coords.lng);
        if (distance < minDistance) {
            minDistance = distance;
            nearestState = state;
        }
    }

    return nearestState;
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
    const [location, setLocationState] = useState<UserLocation>({
        state_id: null,
        municipality_id: null,
    });
    const [loading, setLoading] = useState(true);

    // detectLocation using GPS and Geocoding
    const detectLocation = async () => {
        try {
            // Request permissions
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Location permission denied');
                return;
            }

            // Get current position with a timeout and fallback
            let position = null;
            try {
                // Try last known position first (very fast)
                position = await Location.getLastKnownPositionAsync({});

                // If no last known or it's old, get fresh one
                if (!position) {
                    position = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced,
                    });
                }
            } catch (posError) {
                console.error('Error getting position:', posError);
                return;
            }

            if (!position) {
                console.log('Could not obtain any position');
                return;
            }

            const { latitude, longitude } = position.coords;

            // Use Reverse Geocoding with error handling
            let address = null;
            try {
                const results = await Location.reverseGeocodeAsync({
                    latitude,
                    longitude,
                });
                if (results && results.length > 0) {
                    address = results[0];
                }
            } catch (geoError) {
                console.error('Reverse Geocode failed:', geoError);
            }

            let stateNameDetected = address?.region || null;
            let municipalityDetected = address?.city || address?.subregion || address?.district || null;

            // Log detected info for debugging
            console.log('Address detected:', { state: stateNameDetected, city: municipalityDetected });

            // Fallback to nearest state if geocoding fails to give a region
            if (!stateNameDetected) {
                console.log('Reverse geocoding did not return a region, finding nearest state by coordinates...');
                stateNameDetected = findNearestState(latitude, longitude);
            }

            if (!stateNameDetected) {
                console.warn('Could not determine state even with nearest state fallback');
                return;
            }

            // Match State in DB (Resilient search)
            // We search with and without accents
            const searchName = stateNameDetected.replace(/[áéíóú]/gi, (match) => {
                const map: Record<string, string> = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' };
                return map[match.toLowerCase()] || match;
            });

            console.log('Searching for state:', stateNameDetected, 'Search pattern:', searchName);

            // Fetch state from database
            // Try exact match first, then fuzzy
            let { data: stateData } = await supabase
                .from('states')
                .select('id, name')
                .ilike('name', `%${stateNameDetected}%`)
                .maybeSingle();

            if (!stateData) {
                // Try without accents if possible or just the first 4 chars
                const { data: fallbackState } = await supabase
                    .from('states')
                    .select('id, name')
                    .ilike('name', `%${stateNameDetected.substring(0, 4)}%`)
                    .maybeSingle();
                stateData = fallbackState;
            }

            if (!stateData) {
                console.warn('State not found in database:', stateNameDetected);
                return;
            }

            // Fetch municipality
            let municipalityData = null;
            if (municipalityDetected) {
                // Alias mapping for common names that differ from DB
                const aliases: Record<string, string> = {
                    'Punto Fijo': 'Carirubana',
                    'Caracas': 'Libertador',
                };
                const searchMuni = aliases[municipalityDetected] || municipalityDetected;

                const { data: muniMatch } = await supabase
                    .from('municipalities')
                    .select('id, name')
                    .eq('state_id', stateData.id)
                    .ilike('name', `%${searchMuni}%`)
                    .maybeSingle();
                municipalityData = muniMatch;
            }

            // Default to first municipality if none detected/matched
            if (!municipalityData) {
                const { data: defaultMuni } = await supabase
                    .from('municipalities')
                    .select('id, name')
                    .eq('state_id', stateData.id)
                    .limit(1)
                    .maybeSingle();
                municipalityData = defaultMuni;
            }

            const newLocation: UserLocation = {
                state_id: stateData.id,
                municipality_id: municipalityData?.id || null,
                state_name: stateData.name,
                municipality_name: municipalityData?.name,
                isManual: false,
                coordinates: { latitude, longitude },
            };

            await setLocation(newLocation);
            console.log('Location detected successfully:', newLocation);
        } catch (error) {
            console.error('Error detecting location:', error);
        }
    };

    // Load from persistence on mount
    useEffect(() => {
        async function loadLocation() {
            try {
                const stored = await AsyncStorage.getItem('user_location');
                if (stored) {
                    setLocationState(JSON.parse(stored));
                } else {
                    // Auto-detect location if no stored location
                    await detectLocation();
                }
            } catch (e) {
                console.error('Failed to load location', e);
            } finally {
                setLoading(false);
            }
        }
        loadLocation();
    }, []);

    const setLocation = async (loc: UserLocation) => {
        setLocationState(loc);
        try {
            await AsyncStorage.setItem('user_location', JSON.stringify(loc));

            // Update profile if user is logged in
            const { data, error: userError } = await supabase.auth.getUser();
            const user = data?.user;

            if (user && !userError) {
                await supabase.from('profiles').update({
                    home_state_id: loc.state_id,
                    home_municipality_id: loc.municipality_id,
                }).eq('id', user.id);
            }
        } catch (e) {
            console.error('Failed to save location', e);
        }
    };

    return (
        <LocationContext.Provider value={{ location, setLocation, loading, detectLocation }}>
            {children}
        </LocationContext.Provider>
    );
}

export function useLocation() {
    const context = useContext(LocationContext);
    if (context === undefined) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
}
