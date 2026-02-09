const fs = require('fs');
const path = require('path');

// 1. Simular la carga de EAS JSON
const easJson = require('./eas.json');

console.log('🔍 Verificando configuración para Producción...\n');

const prodConfig = easJson.build.production;
const env = prodConfig.env;

// 2. Checklist
const checks = [
    { name: 'Supabase URL', val: env.EXPO_PUBLIC_SUPABASE_URL, expected: 'hrtbykizmvjuxcyfwkqp' },
    { name: 'Supabase Key', val: env.EXPO_PUBLIC_SUPABASE_ANON_KEY, expected: 'sb_publishable' },
    { name: 'Google Client ID', val: env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, expected: 'apps.googleusercontent.com' }
];

let errors = 0;

checks.forEach(check => {
    if (!check.val) {
        console.error(`❌ Faltante: ${check.name}`);
        errors++;
    } else if (!check.val.includes(check.expected)) {
        console.error(`⚠️ Advertencia: ${check.name} parece incorrecto (${check.val})`);
        errors++;
    } else {
        console.log(`✅ ${check.name}: OK`);
    }
});

// 3. Verificar Package Name
const appJson = require('./app.json');
const pkgName = appJson.expo.android.package;

if (pkgName !== 'com.sincrovzla.jooz') {
    console.error(`❌ Package Name incorrecto: ${pkgName} (Debe ser com.sincrovzla.jooz)`);
    errors++;
} else {
    console.log(`✅ Android Package Name: ${pkgName}`);
}

console.log('\n-----------------------------------');
if (errors === 0) {
    console.log('🎉 Configuración lista para Build de Producción');
} else {
    console.error(`🔥 Se encontraron ${errors} errores. NO construyas todavía.`);
}
