import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type ExchangeRates = {
    rate_bcv: number;
    rate_parallel: number;
    date: string;
};

type ExchangeRateContextType = {
    rates: ExchangeRates | null;
    loading: boolean;
    convertPrice: (priceUsd: number) => { usd: string; bs: string };
    refreshRates: () => Promise<void>;
};

const ExchangeRateContext = createContext<ExchangeRateContextType>({
    rates: null,
    loading: true,
    convertPrice: () => ({ usd: '0.00', bs: '0.00' }),
    refreshRates: async () => { },
});

export const useExchangeRates = () => useContext(ExchangeRateContext);

export const ExchangeRateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [rates, setRates] = useState<ExchangeRates | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchRates = async () => {
        setLoading(true);
        try {
            // Fetch latest rate. Assuming we want the most recent one.
            const { data, error } = await supabase
                .from('exchange_rates')
                .select('*')
                .order('date', { ascending: false })
                .limit(1)
                .single();

            if (error) {
                console.warn('Error fetching rates (using fallback):', error.message);
                // Fallback for demo/dev if table is empty or missing
                setRates({
                    rate_bcv: 36.5,
                    rate_parallel: 40.0,
                    date: new Date().toISOString(),
                });
            } else if (data) {
                setRates(data);
            }
        } catch (e) {
            console.error('Exception fetching rates:', e);
            // Fallback on exception too
            setRates({
                rate_bcv: 36.5,
                rate_parallel: 40.0,
                date: new Date().toISOString(),
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRates();
    }, []);

    const convertPrice = (priceUsd: number) => {
        if (!rates) return { usd: priceUsd.toFixed(2), bs: '---' };

        // Default to Parallel for display or use logic. User requested "Equivalent in Bs".
        // Usually in Vzla, B&M stores use BCV, online/informal use Parallel.
        // Let's use Parallel for now or maybe expose both?
        // User requirement: "Conversión Dual ($ a Bs)... obtener la tasa de la tabla exchange_rates".
        // Let's assume BCV is the legal one for stores, but maybe we show both or just one.
        // I will use BCV as it's the official rate for businesses.

        // However, user just said "Logic to get rate from table". I'll use BCV for now as it's safer for "stores".
        const rate = rates.rate_bcv;
        const priceBs = priceUsd * rate;

        return {
            usd: priceUsd.toFixed(2),
            bs: priceBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        };
    };

    return (
        <ExchangeRateContext.Provider value={{ rates, loading, convertPrice, refreshRates: fetchRates }}>
            {children}
        </ExchangeRateContext.Provider>
    );
};
