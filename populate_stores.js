require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// IDs de municipios
const CARIRUBANA_ID = 'da661bdc-913c-4f0e-8c2e-638b50b133b4'; // Punto Fijo (Falcón)
const VALENCIA_ID = 'fb9616ba-de50-4d0d-b8a1-65e63b41d75d';    // Valencia (Carabobo)

const stores = [
    // === PUNTO FIJO (FALCÓN - CARIRUBANA) ===
    {
        name: 'Farmatodo Punto Fijo',
        municipality_id: CARIRUBANA_ID
    },
    {
        name: 'Farmasi Punto Fijo',
        municipality_id: CARIRUBANA_ID
    },
    {
        name: 'Locatel Punto Fijo',
        municipality_id: CARIRUBANA_ID
    },
    {
        name: 'Central Madeirense Punto Fijo',
        municipality_id: CARIRUBANA_ID
    },
    {
        name: 'Excelsior Gama Punto Fijo',
        municipality_id: CARIRUBANA_ID
    },

    // === VALENCIA (CARABOBO) ===
    {
        name: 'Farmatodo Valencia Centro',
        municipality_id: VALENCIA_ID
    },
    {
        name: 'Farmatodo Las Américas Valencia',
        municipality_id: VALENCIA_ID
    },
    {
        name: 'Locatel Valencia',
        municipality_id: VALENCIA_ID
    },
    {
        name: 'Automercado Valencia',
        municipality_id: VALENCIA_ID
    },
    {
        name: 'Excelsior Gama Valencia',
        municipality_id: VALENCIA_ID
    }
];

async function populateStores() {
    console.log('🏪 Poblando tiendas en Punto Fijo y Valencia...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const store of stores) {
        const { data, error } = await supabase
            .from('stores')
            .insert(store)
            .select()
            .single();

        if (error) {
            console.error(`❌ Error: ${store.name}`);
            console.error(`   ${error.message}`);
            errorCount++;
        } else {
            console.log(`✅ ${data.name}`);
            successCount++;
        }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`  ✅ Exitosas: ${successCount}`);
    console.log(`  ❌ Errores: ${errorCount}`);

    // Mostrar total
    const { data: allStores } = await supabase
        .from('stores')
        .select('*');

    console.log(`\n🏪 Total de tiendas en BD: ${allStores.length}`);
}

populateStores().then(() => process.exit(0)).catch(console.error);
