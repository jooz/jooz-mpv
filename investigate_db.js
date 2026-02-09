require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function investigateData() {
    try {
        // 1. Productos sin imagen
        const { data: sinImagen, error: err1 } = await supabase
            .from('products')
            .select('id, name, image_url, category')
            .is('image_url', null)
            .limit(10);

        if (err1) throw err1;

        console.log('=== PRODUCTOS SIN IMAGEN (primeros 10) ===');
        sinImagen.forEach(p => console.log(`- ${p.name} (${p.category})`));

        // 2. Total de productos
        const { count: totalConImagen } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .not('image_url', 'is', null);

        const { count: totalSinImagen } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .is('image_url', null);

        console.log('\n=== ESTADÍSTICAS DE IMÁGENES ===');
        console.log(`✅ Con imagen: ${totalConImagen}`);
        console.log(`❌ Sin imagen: ${totalSinImagen}`);

        // 3. Productos mal categorizados
        const { data: farmacia, error: err2 } = await supabase
            .from('products')
            .select('id, name, category')
            .eq('category', 'Farmacia')
            .limit(50);

        if (err2) throw err2;

        const keywords = ['snack', 'refresco', 'galleta', 'bebida', 'coca', 'pepsi', 'dorito', 'choco'];
        const malCategorizados = farmacia.filter(p =>
            keywords.some(k => p.name.toLowerCase().includes(k))
        );

        console.log('\n=== PRODUCTOS MAL CATEGORIZADOS (en Farmacia) ===');
        malCategorizados.forEach(p => console.log(`- ${p.name} [ID: ${p.id}]`));

    } catch (error) {
        console.error('Error:', error.message);
    }
}

investigateData();
