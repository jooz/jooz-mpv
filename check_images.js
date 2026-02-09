require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function checkImages() {
    // 1. Ver productos con imagen
    const { data: withImages } = await supabase
        .from('products')
        .select('id, name, image_url')
        .not('image_url', 'is', null)
        .limit(10);

    console.log('=== PRODUCTOS CON IMAGEN (muestra) ===');
    withImages.forEach(p => {
        console.log(`${p.name}`);
        console.log(`  URL: ${p.image_url}`);
        console.log('');
    });

    // 2. Listar archivos en el bucket
    const { data: files, error } = await supabase
        .storage
        .from('product-images')
        .list('', { limit: 100 });

    if (error) {
        console.error('Error al listar bucket:', error);
    } else {
        console.log(`\n=== ARCHIVOS EN BUCKET ===`);
        console.log(`Total: ${files.length} archivos`);
        files.slice(0, 10).forEach(f => console.log(`  - ${f.name}`));
    }

    // 3. Verificar URLs rotas
    console.log('\n=== VERIFICANDO FORMATO DE URLs ===');
    const urlsSupabase = withImages.filter(p => p.image_url?.includes('supabase.co')).length;
    const urlsExternas = withImages.filter(p => p.image_url && !p.image_url.includes('supabase.co')).length;

    console.log(`URLs de Supabase: ${urlsSupabase}`);
    console.log(`URLs externas: ${urlsExternas}`);
}

checkImages().then(() => process.exit(0)).catch(console.error);
