require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// IMPORTANTE: Necesita la SERVICE ROLE KEY para borrar
const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanDatabase() {
    console.log('⚠️  ADVERTENCIA: Este script va a borrar TODOS los datos\n');
    console.log('Esperando 5 segundos para cancelar (Ctrl+C)...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🧹 Iniciando limpieza...\n');

    try {
        // 1. Borrar PRECIOS primero (por foreign key)
        console.log('1️⃣ Limpiando tabla PRICES...');
        const { error: pricesErr, count: pricesCount } = await supabase
            .from('prices')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000')
            .select('*', { count: 'exact', head: true });

        if (pricesErr) throw pricesErr;
        console.log(`   ✅ ${pricesCount || 0} precios eliminados\n`);

        // 2. Borrar PRODUCTOS
        console.log('2️⃣ Limpiando tabla PRODUCTS...');
        const { error: productsErr, count: productsCount } = await supabase
            .from('products')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000')
            .select('*', { count: 'exact', head: true });

        if (productsErr) throw productsErr;
        console.log(`   ✅ ${productsCount || 0} productos eliminados\n`);

        // 3. Borrar IMÁGENES del bucket
        console.log('3️⃣ Limpiando bucket PRODUCT-IMAGES...');
        const { data: files, error: listErr } = await supabase
            .storage
            .from('product-images')
            .list('', { limit: 1000 });

        if (listErr) throw listErr;

        if (files.length > 0) {
            const fileNames = files.map(f => f.name);
            const { error: removeErr } = await supabase
                .storage
                .from('product-images')
                .remove(fileNames);

            if (removeErr) throw removeErr;
            console.log(`   ✅ ${files.length} imágenes eliminadas\n`);
        } else {
            console.log('   ℹ️  Bucket ya estaba vacío\n');
        }

        console.log('🎉 ¡Limpieza completada exitosamente!\n');
        console.log('📝 Ahora puedes ejecutar:');
        console.log('   node scrape_farmatodo.js "Arroz"');
        console.log('   node scrape_farmatodo.js "Harina"');
        console.log('   etc.\n');

    } catch (error) {
        console.error('\n❌ Error durante la limpieza:', error.message);
        process.exit(1);
    }
}

cleanDatabase().then(() => process.exit(0));
