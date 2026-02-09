#!/usr/bin/env node
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function fix() {
    const ids = [
        'cbf53abf-dbb1-42cf-90be-fb2785c6b96e',
        'deb09390-b7da-4a95-8d29-fd913783857e',
        '3c6c1d2f-2362-4cd6-b319-7e4401f6bd33',
        'd203ed4e-5e89-4fd7-88e6-43d60ae97e97',
        '40aafd93-8595-4f2d-8402-bf5e7ad999be',
        '8798be00-ff82-4768-a211-a981213f9bc2'
    ];

    const { data, error } = await supabase
        .from('products')
        .update({ category: 'Alimentos' })
        .in('id', ids)
        .select('name');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('✅ Corregidos:', data.length, 'productos');
    data.forEach(p => console.log('  -', p.name));
}

fix().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
});
