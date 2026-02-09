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
 * Parsea el precio venezolano "Bs. 1.200,50" a Float y lo divide entre la tasa.
 */
function calculateUsdPrice(priceString, exchangeRate) {
    if (!priceString) return 0;

    // 1. Limpieza: Dejar solo números y coma decimal
    // "Bs. 1.573,95" -> "1573,95" (quitamos el punto de miles)
    let clean = priceString.replace(/[^0-9,]/g, '');

    // 2. Convertir coma decimal a punto
    // "1573,95" -> "1573.95"
    let validFloatStr = clean.replace(',', '.');

    let priceBs = parseFloat(validFloatStr);

    if (isNaN(priceBs)) return 0;

    // 3. Dividir entre la tasa
    let priceUsd = priceBs / exchangeRate;

    return priceUsd.toFixed(2); // Retorna string con 2 decimales
}

// --- SCRAPER PRINCIPAL ---

async function scrapeFarmatodo(searchTerm) {
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
        const exchangeRate = rateData ? rateData.rate_bcv : 65.00;
        console.log(`💵 Tasa de cambio aplicada: ${exchangeRate} Bs/$`);

        // 2. Navegar
        await page.goto('https://www.farmatodo.com.ve/', { waitUntil: 'domcontentloaded', timeout: 60000 });

        // 3. Buscar
        const searchSelector = '#nav-bar-algolia-search-box';
        await page.waitForSelector(searchSelector, { timeout: 20000 });

        // Limpiar y escribir
        await page.click(searchSelector, { clickCount: 3 });
        await page.type(searchSelector, searchTerm, { delay: 50 });
        await page.keyboard.press('Enter');

        // Esperar resultados
        try {
            await page.waitForSelector('div.product-card', { timeout: 15000 });
        } catch (e) {
            console.log("⚠️ No se detectaron tarjetas inmediatamente, esperando un poco más...");
        }

        await autoScroll(page);

        // 4. EXTRAER DATOS (Usando tus selectores exactos)
        const products = await page.evaluate(() => {
            // Seleccionamos todas las tarjetas
            const cards = Array.from(document.querySelectorAll('div.product-card'));

            return cards.map(card => {
                // A. Imagen: class="product-image__image lozad"
                // A veces Puppeteer no ve 'lozad' si ya cargó, probamos con y sin ella, pero priorizamos tu selector.
                const imgEl = card.querySelector('.product-image__image.lozad') || card.querySelector('.product-image__image');

                // B. Nombre: class="product-card__title"
                const titleEl = card.querySelector('.product-card__title');

                // C. Precio: class="product-card__price-value"
                const priceEl = card.querySelector('.product-card__price-value');

                // Extraemos atributos
                const src = imgEl ? imgEl.src : null;
                const alt = imgEl ? imgEl.getAttribute('alt') : null; // Para la validación
                const name = titleEl ? titleEl.innerText.trim() : null;
                const priceRaw = priceEl ? priceEl.innerText.trim() : null;

                return {
                    name: name,
                    price_raw: priceRaw,
                    image_url: src,
                    image_alt: alt // Importante para tu filtro
                };
            });
        });

        console.log(`📦 Se encontraron ${products.length} tarjetas en total.`);

        let savedCount = 0;

        for (const p of products) {
            // Validaciones básicas
            if (!p.name || !p.price_raw) continue;

            // 5. TU VALIDACIÓN: Chequear si el ALT contiene la palabra buscada
            // Usamos normalización para que "Arroz" coincida con "arroz"
            const altText = normalizeText(p.image_alt);
            const searchNormalized = normalizeText(searchTerm);

            if (!altText.includes(searchNormalized)) {
                // Opcional: Descomenta para ver qué se está filtrando
                // console.log(`⏩ Saltando: ${p.name} (El ALT "${p.image_alt}" no contiene "${searchTerm}")`);
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
                const uploadedUrl = await uploadImageToSupabase(p.image_url, p.name);
                if (uploadedUrl) finalImgUrl = uploadedUrl;
            }

            // 8. GUARDAR EN BD (Upsert Producto)
            const { data: prodData, error: prodErr } = await supabase
                .from('products')
                .upsert({
                    name: p.name,
                    brand: 'Genérico', // Farmatodo a veces no muestra la marca en una clase fácil
                    image_url: finalImgUrl,
                    category: 'Farmacia/Varios'
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
scrapeFarmatodo(term);