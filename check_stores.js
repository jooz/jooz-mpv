require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function checkStoresAndLocations() {
    console.log('=== TIENDAS ACTUALES ===');
    const { data: stores } = await supabase
        .from('stores')
        .select('*');

    console.log(`Total: ${stores?.length || 0} tiendas`);
    stores?.forEach(s => console.log(`- ${s.name} (${s.id})`));

    console.log('\n=== ESTADOS Y MUNICIPIOS ===');

    // Falcón
    const { data: falcon } = await supabase
        .from('states')
        .select('id, name')
        .ilike('name', '%falc%')
        .single();

    if (falcon) {
        console.log(`\n📍 ${falcon.name} (ID: ${falcon.id})`);

        const { data: municipalities } = await supabase
            .from('municipalities')
            .select('id, name')
            .eq('state_id', falcon.id);

        municipalities?.forEach(m => console.log(`   - ${m.name} (${m.id})`));
    }

    // Carabobo
    const { data: carabobo } = await supabase
        .from('states')
        .select('id, name')
        .ilike('name', '%carabobo%')
        .single();

    if (carabobo) {
        console.log(`\n📍 ${carabobo.name} (ID: ${carabobo.id})`);

        const { data: municipalities } = await supabase
            .from('municipalities')
            .select('id, name')
            .eq('state_id', carabobo.id);

        municipalities?.forEach(m => console.log(`   - ${m.name} (${m.id})`));
    }
}

checkStoresAndLocations().then(() => process.exit(0)).catch(console.error);
