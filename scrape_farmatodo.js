require('dotenv').config();
const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

// --- CONFIGURACIÓN ---
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STORAGE_BUCKET = 'product-images';
const FARMATODO_STORE_ID = 'fe1e307f-aa6e-4af3-944f-1b7fb37299b8';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Error: Faltan variables de entorno.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

// --- UTILS ---
function sanitizeFilename(name) {
    return (name || 'unk').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

// Normaliza texto para comparaciones (quita acentos y mayúsculas)
function normalizeText(text) {
    return (text || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

async function uploadImageToSupabase(remoteUrl, productName) {
    if (!remoteUrl) return null;

    // Validar que sea una URL completa
    let finalUrl = remoteUrl;
    if (remoteUrl.startsWith('/')) {
        finalUrl = `https://www.farmatodo.com.ve${remoteUrl}`;
    }

    try {
        const response = await fetch(finalUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.farmatodo.com.ve/'
            }
        });

        if (!response.ok) return null;

        const contentType = response.headers.get('content-type') || 'image/jpeg';
        // Ignorar si es un SVG o algo que no sea imagen
        if (contentType.includes('svg')) return null;

        const buffer = Buffer.from(await response.arrayBuffer());
        // Determinar extensión
        const extension = contentType.includes('png') ? 'png' : 'jpg';

        const fileName = `${sanitizeFilename(productName)}-${Date.now()}.${extension}`;

        // Subir a Supabase
        const { error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(fileName, buffer, { contentType, upsert: true });

        if (error) throw error;

        const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
        return data.publicUrl;

    } catch (e) {
        console.warn(`⚠️ Error subiendo imagen: ${e.message}`);
        return null;
    }
}

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                // Scroll hasta el final o máximo 20 seg
                if (totalHeight >= scrollHeight - window.innerHeight || totalHeight > 20000) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
            setTimeout(() => { clearInterval(timer); resolve(); }, 20000);
        });
    });
}

/**
 * Parsea el precio venezolano de Farmatodo.
 * Formato: "Bs.727.50" o "Bs.1.150.60"
 * El ÚLTIMO punto es el decimal, los anteriores son separadores de miles.
 */
function calculateUsdPrice(priceString, exchangeRate) {
    if (!priceString) return 0;

    // 1. Limpiar: Quitar "Bs" y espacios, dejar solo números y puntos
    // "Bs.727.50" -> "727.50"
    // " Bs.1.150.60 " -> "1.150.60"
    let clean = priceString.replace(/[^0-9.]/g, '');

    // 2. Identificar el último punto como decimal
    // Si hay múltiples puntos, los primeros son separadores de miles
    const lastDotIndex = clean.lastIndexOf('.');

    let priceBs;
    if (lastDotIndex === -1) {
        // No hay punto, es un número entero
        priceBs = parseFloat(clean);
    } else {
        // Separar parte entera y decimal
        const integerPart = clean.substring(0, lastDotIndex).replace(/\./g, ''); // Quitar puntos de miles
        const decimalPart = clean.substring(lastDotIndex + 1);

        // Combinar con punto decimal estándar
        priceBs = parseFloat(`${integerPart}.${decimalPart}`);
    }

    if (isNaN(priceBs)) return 0;

    // 3. Dividir entre la tasa
    let priceUsd = priceBs / exchangeRate;

    return priceUsd.toFixed(2); // Retorna string con 2 decimales
}

/**
 * Determina la categoría del producto basado en su nombre y término de búsqueda
 */
function determineCategory(productName, searchTerm) {
    const name = productName.toLowerCase();
    const search = searchTerm.toLowerCase();

    // Keywords para Alimentos
    const alimentosKeywords = [
        'harina', 'pan', 'arroz', 'pasta', 'aceite', 'azucar', 'sal',
        'leche', 'cafe', 'chocolate', 'galleta', 'cereal', 'avena',
        'mantequilla', 'margarina', 'mayonesa', 'salsa', 'condimento',
        'sopa', 'atun', 'sardina', 'conserva', 'bebida', 'refresco',
        'jugo', 'agua', 'te', 'infusion', 'snack', 'dulce', 'caramelo',
        'chicle', 'golosina'
    ];

    // Keywords para Farmacia
    const farmaciaKeywords = [
        'acetaminofen', 'paracetamol', 'ibuprofeno', 'aspirina',
        'medicamento', 'tableta', 'capsula', 'jarabe', 'suspension',
        'crema', 'pomada', 'gel', 'unguento', 'vitamina', 'suplemento',
        'antibiotico', 'analgesico', 'antialergico', 'antigripal',
        'gasa', 'venda', 'alcohol', 'algodon', 'curitas', 'termometro',
        'jeringa', 'diclofenac', 'loratadina', 'omeprazol'
    ];

    // Verificar si el nombre o término de búsqueda contiene keywords
    const isAlimento = alimentosKeywords.some(keyword =>
        name.includes(keyword) || search.includes(keyword)
    );

    const isFarmacia = farmaciaKeywords.some(keyword =>
        name.includes(keyword) || search.includes(keyword)
    );

    // Priorizar Farmacia sobre Alimentos si ambos coinciden
    if (isFarmacia) return 'Farmacia';
    if (isAlimento) return 'Alimentos';

    // Por defecto, usar el contexto del search term
    return 'Farmacia'; // Farmatodo es principalmente farmacia
}

// --- SCRAPER PRINCIPAL ---

async function scrapeFarmatodo(searchTerm, categoryOverride = null) {
    console.log(`🚀 Iniciando scraping específico para: "${searchTerm}"`);

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1366,768']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1366, height: 768 });

    try {
        // 1. Obtener Tasa BCV
        let { data: rateData } = await supabase
            .from('exchange_rates')
            .select('rate_bcv')
            .order('date', { ascending: false })
            .limit(1)
            .single();
        const exchangeRate = rateData ? rateData.rate_bcv : 382.63;
        console.log(`💵 Tasa de cambio aplicada: ${exchangeRate} Bs/$`);

        // 2. Navegar
        await page.goto('https://www.farmatodo.com.ve/', { waitUntil: 'domcontentloaded', timeout: 60000 });

        // 3. Buscar - Estrategia: navegar directamente a la URL de búsqueda
        // Farmatodo usa Algolia que actualiza dinámicamente, mejor navegar directamente
        const searchUrl = `https://www.farmatodo.com.ve/buscar?product=${encodeURIComponent(searchTerm)}&departamento=Todos&filtros=`;
        console.log(`🔍 Navegando a: ${searchUrl}`);

        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Esperar un poco para que se rendericen los resultados
        await new Promise(r => setTimeout(r, 5000));

        // Esperar resultados
        try {
            await page.waitForSelector('div.product-card', { timeout: 15000 });
            console.log('✅ Tarjetas de productos detectadas');
        } catch (e) {
            console.log("⚠️ No se detectaron tarjetas de productos");
        }

        await autoScroll(page);

        // 4. EXTRAER DATOS (Usando tus selectores exactos)
        const products = await page.evaluate(() => {
            // Seleccionamos todas las tarjetas
            const cards = Array.from(document.querySelectorAll('div.product-card'));

            return cards.map(card => {
                // A. Imagen: La clase correcta verificada es "cont-img__image"
                const imgEl = card.querySelector('.cont-img__image');

                // B. Nombre: class="product-card__title"
                const titleEl = card.querySelector('.product-card__title');

                // C. Precio: class="product-card__price-value"
                const priceEl = card.querySelector('.product-card__price-value');

                // Extraemos atributos
                // NOTA: lozad ya procesó las imágenes cuando Puppeteer llega aquí,
                // así que data-src ya fue movido a src
                const src = imgEl ? imgEl.src : null;

                const alt = imgEl ? imgEl.getAttribute('alt') : null;
                const name = titleEl ? titleEl.innerText.trim() : null;
                const priceRaw = priceEl ? priceEl.innerText.trim() : null;

                return {
                    name: name,
                    price_raw: priceRaw,
                    image_url: src,
                    image_alt: alt
                };
            });
        });

        console.log(`📦 Se encontraron ${products.length} tarjetas en total.`);

        let savedCount = 0;

        for (const p of products) {
            // Validaciones básicas
            if (!p.name || !p.price_raw) continue;

            // 5. VALIDACIÓN: Chequear si el nombre del producto contiene la palabra buscada
            const nameNormalized = normalizeText(p.name);
            const searchNormalized = normalizeText(searchTerm);

            if (!nameNormalized.includes(searchNormalized)) {
                console.log(`⏩ Saltando: "${p.name}" (no coincide con búsqueda "${searchTerm}")`);
                continue;
            }

            console.log(`✅ Procesando: ${p.name}`);

            // 6. CÁLCULO DE PRECIO
            const priceUsd = calculateUsdPrice(p.price_raw, exchangeRate);

            // 7. GESTIÓN DE IMAGEN
            const { data: existingProd } = await supabase
                .from('products')
                .select('id, image_url')
                .eq('name', p.name)
                .maybeSingle();

            let finalImgUrl = existingProd?.image_url;

            // Si no tenemos imagen en Supabase, la subimos
            const isHosted = finalImgUrl && finalImgUrl.includes('supabase.co');
            if (!isHosted && p.image_url) {
                console.log(`   📸 Subiendo imagen: ${p.image_url.substring(0, 60)}...`);
                const uploadedUrl = await uploadImageToSupabase(p.image_url, p.name);
                if (uploadedUrl) {
                    finalImgUrl = uploadedUrl;
                    console.log(`   ✅ Imagen subida exitosamente`);
                } else {
                    console.log(`   ⚠️ Fallo al subir imagen`);
                }
            } else if (!p.image_url) {
                console.log(`   ⚠️ No se encontró URL de imagen en el scraping`);
            }

            // 8. DETERMINAR CATEGORÍA
            const category = categoryOverride || determineCategory(p.name, searchTerm);

            // 9. GUARDAR EN BD (Upsert Producto)
            const { data: prodData, error: prodErr } = await supabase
                .from('products')
                .upsert({
                    name: p.name,
                    brand: 'Genérico', // Farmatodo a veces no muestra la marca en una clase fácil
                    image_url: finalImgUrl,
                    category: category
                }, { onConflict: 'name' })
                .select('id')
                .single();

            if (prodErr) {
                console.error(`Error guardando producto: ${prodErr.message}`);
                continue;
            }

            // 9. GUARDAR PRECIO
            const { error: priceErr } = await supabase
                .from('prices')
                .insert({
                    product_id: prodData.id,
                    store_id: FARMATODO_STORE_ID,
                    price_usd: priceUsd
                });

            if (!priceErr) {
                savedCount++;
                console.log(`   💰 Precio guardado: $${priceUsd} (Tasa: ${exchangeRate})`);
            }
        }

        console.log(`\n🎉 Proceso finalizado. ${savedCount} productos guardados exitosamente.`);

    } catch (error) {
        console.error('🔥 Error crítico en el scraper:', error);
    } finally {
        await browser.close();
    }
}

// Ejecución
const term = process.argv[2] || 'Arroz';
const category = process.argv[3]; // Opcional: "Alimentos" o "Farmacia"

// Validar categoría si se proporciona
const validCategories = ['Alimentos', 'Farmacia'];
if (category && !validCategories.includes(category)) {
    console.error(`❌ Categoría inválida: "${category}"`);
    console.error(`   Categorías válidas: ${validCategories.join(', ')}`);
    console.error(`\n📝 Uso correcto:`);
    console.error(`   node scrape_farmatodo.js "término de búsqueda"`);
    console.error(`   node scrape_farmatodo.js "término de búsqueda" "Categoría"`);
    console.error(`\n   Ejemplos:`);
    console.error(`   node scrape_farmatodo.js "Harina" "Alimentos"`);
    console.error(`   node scrape_farmatodo.js "Acetaminofen" "Farmacia"`);
    process.exit(1);
}

if (category) {
    console.log(`📂 Categoría especificada: ${category}`);
}

scrapeFarmatodo(term, category);