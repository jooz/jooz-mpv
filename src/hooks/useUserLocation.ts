import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { useLocation } from '../context/LocationContext';
import { supabase } from '../lib/supabase';

// Helper to find closest municipality from DB based on lat/lon is complex without PostGIS
// For MVP we might stick to Manual or simple Reverse Geocoding matches if text matches
// But `expo-location` reverseGeocodeAsync returns address components.
// We can try to fuzzy match state/city name.

export function useUserLocationLogic() {
    const { location, setLocation } = useLocation();
    const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
    const [isDetecting, setIsDetecting] = useState(false);

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setPermissionStatus(status);
        })();
    }, []);

    const detectLocation = async () => {
        if (permissionStatus !== Location.PermissionStatus.GRANTED) {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setPermissionStatus(status);
            if (status !== Location.PermissionStatus.GRANTED) return;
        }

        setIsDetecting(true);
        try {
            const loc = await Location.getCurrentPositionAsync({});
            const [address] = await Location.reverseGeocodeAsync({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
            });

            if (address) {
                console.log('Detected Address:', address);
                // address.region = State (e.g., "Miranda")
                // address.subRegion / city = Municipality/City (e.g. "Chacao")

                // Try to match in DB
                // 1. Match State
                const { data: stateData } = await supabase
                    .from('states')
                    .select('*')
                    .ilike('name', `%${address.region}%`) // Fuzzy match
                    .single();

                if (stateData) {
                    // 2. Match Municipality
                    // address.city or address.subRegion might have it
                    const possibleNames = [address.city, address.subRegion, address.district].filter(Boolean);

                    let municipalityData = null;
                    for (const name of possibleNames) {
                        const { data } = await supabase.from('municipalities')
                            .select('*')
                            .eq('state_id', stateData.id)
                            .ilike('name', `%${name}%`)
                            .single();
                        if (data) {
                            municipalityData = data;
                            break;
                        }
                    }

                    if (municipalityData) {
                        setLocation({
                            state_id: stateData.id,
                            municipality_id: municipalityData.id,
                            state_name: stateData.name,
                            municipality_name: municipalityData.name,
                            isManual: false
                        });
                    } else {
                        // Determine only State found
                        setLocation({
                            state_id: stateData.id,
                            municipality_id: null,
                            state_name: stateData.name,
                            municipality_name: undefined,
                            isManual: false
                        });
                    }
                }
            }
        } catch (e) {
            console.error('Error detecting location', e);
        } finally {
            setIsDetecting(false);
        }
    };

    return {
        location,
        permissionStatus,
        isDetecting,
        detectLocation
    };
}
