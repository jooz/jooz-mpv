require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function fixCategories() {
    const idsToFix = [
        'cbf53abf-dbb1-42cf-90be-fb2785c6b96e', // Snack Cheese Tris
        'deb09390-b7da-4a95-8d29-fd913783857e', // Coca-cola 1L
        '3c6c1d2f-2362-4cd6-b319-7e4401f6bd33', // Coca-cola 1.5L
        'd203ed4e-5e89-4fd7-88e6-43d60ae97e97', // Galleta Samba
        '40aafd93-8595-4f2d-8402-bf5e7ad999be', // Doritos
        '8798be00-ff82-4768-a211-a981213f9bc2'  // Pepito
    ];

    console.log('Reclasificando productos de Farmacia → Alimentos...\n');

    for (const id of idsToFix) {
        const { data, error } = await supabase
            .from('products')
            .update({ category: 'Alimentos' })
            .eq('id', id)
            .select();

        if (error) {
            console.error(`❌ Error con ID ${id}:`, error.message);
        } else {
            console.log(`✅ ${data[0].name} → Alimentos`);
        }
    }

    console.log('\n🎉 Reclasificación completada!');
}

fixCategories();
