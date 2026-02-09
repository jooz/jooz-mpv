require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateCategories() {
    console.log('🔄 Actualizando categorías de productos existentes...\n');

    // Alimentos
    const alimentosKeywords = [
        'Harina', 'Pan', 'Arroz', 'Pasta', 'Aceite', 'Azucar', 'Azúcar',
        'Leche', 'Cafe', 'Café', 'Chocolate', 'Galleta', 'Cereal',
        'Mantequilla', 'Margarina', 'Mayonesa', 'Salsa',
        'Sopa', 'Atun', 'Atún', 'Bebida', 'Refresco', 'Snack'
    ];

    // Farmacia
    const farmaciaKeywords = [
        'Acetaminofen', 'Acetaminofén', 'Paracetamol', 'Ibuprofeno',
        'Tableta', 'Capsula', 'Cápsula', 'Jarabe', 'Analper',
        'Gasa', 'Venda', 'Alcohol', 'Vitamina', 'Diclofenac'
    ];

    // Obtener todos los productos
    const { data: products } = await supabase
        .from('products')
        .select('id, name, category');

    console.log(`📦 ${products.length} productos encontrados\n`);

    let alimentosCount = 0;
    let farmaciaCount = 0;

    for (const product of products) {
        const name = product.name;

        // Determinar categoría
        const isAlimento = alimentosKeywords.some(kw => name.includes(kw));
        const isFarmacia = farmaciaKeywords.some(kw => name.includes(kw));

        let newCategory = product.category;

        if (isFarmacia) {
            newCategory = 'Farmacia';
            farmaciaCount++;
        } else if (isAlimento) {
            newCategory = 'Alimentos';
            alimentosCount++;
        }

        if (newCategory !== product.category) {
            await supabase
                .from('products')
                .update({ category: newCategory })
                .eq('id', product.id);

            console.log(`✅ ${name} → ${newCategory}`);
        }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`  Alimentos: ${alimentosCount}`);
    console.log(`  Farmacia: ${farmaciaCount}`);
    console.log(`\n🎉 Categorización completada!`);
}

updateCategories().then(() => process.exit(0)).catch(console.error);
