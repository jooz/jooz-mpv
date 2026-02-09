# Documento de Requerimientos del Producto (PRD): Jooz (SincroVzla)

**Versión:** 1.2  
**Estado:** Activo  
**Fecha:** 7 de febrero de 2026  
**Stack Tecnológico:** Expo (React Native) + Supabase + Google AdMob

---

## 1. Resumen Ejecutivo
Jooz (SincroVzla) es una aplicación móvil diseñada para mitigar el impacto de la dispersión de precios y la volatilidad cambiaria en Venezuela. Permite a los usuarios comparar precios de productos básicos en comercios cercanos, mostrando valores en USD ($) con conversión automática a Bolívares (Bs) según la tasa oficial de DolarApi (BCV).

## 2. Definición del Problema y Objetivos
### 2.1 Problema
- **Dispersión Regional:** Precios varían según la logística de cada estado/municipio.
- **Dualidad Monetaria:** Necesidad constante de calcular la tasa de cambio.
- **Opacidad de Datos:** Falta de centralización de precios locales.

### 2.2 Objetivos
- Comparador de precios en tiempo real segmentado por Municipio/Estado.
- Interfaz ligera para dispositivos de gama media/baja.
- Monetización vía banners e intersticiales con AdMob.

## 3. Público Objetivo
- **Consumidor (Ahorrador):** Busca optimizar su presupuesto.
- **Supervisor (Crowdsourcer):** Encargado de verificar y actualizar precios.
- **Administrador:** Gestión de roles y configuración de la plataforma.

## 4. Requerimientos Funcionales (FR)
- **FR1: Gestión de Ubicación Regional** (GPS via `expo-location` o selección manual). [IMPLEMETADO]
- **FR2: Comparador de Precios y Moneda Dual** (Tasa automatizada vía Edge Functions). [IMPLEMENTADO]
- **FR3: Gestión de Roles (RBAC)** (Admin, Supervisor, User).
- **FR4: Monetización (AdMob)** (Banners y anuncios transicionales). [IMPLEMENTADO]
- **FR5: Autenticación con Google** (Implementado vía `@react-native-google-signin/google-signin`). [IMPLEMENTADO]

## 5. Requerimientos No Funcionales (NFR)
- **NFR1: Seguridad** (RLS en Supabase para proteger tablas sensibles).
- **NFR2: Legalidad** (Identificación de tiendas por texto plano, sin logos protegidos).
- **NFR3: Rendimiento** (Caché eficiente para ahorro de datos móviles).

## 6. Arquitectura del Sistema
- **Frontend:** Expo / React Native (Expo Router).
- **Backend:** Supabase (PostgreSQL).
- **Automatización:** 
    - **Edge Function:** `update-exchange-rate-daily` (Consumiendo DolarApi).
    - **Cron Job:** `update-daily-exchange-rate` (Ejecución diaria 00:05 UTC).

## 7. Modelo de Datos
- `profiles`: id, email, role, home_municipality_id.
- `states`: id, name.
- `municipalities`: id, state_id, name.
- `stores`: id, name, location, municipality_id.
- `products`: id, name, brand, category, image_url.
- `prices`: product_id, store_id, price_usd, updated_at, updated_by.
- `exchange_rates`: id, rate_bcv, rate_parallel, date.

## 8. Estado del Proyecto (Logros)
- [x] Configuración inicial Expo + Supabase.
- [x] Implementación de Google Auth nativo (con blindaje para Expo Go/Web).
- [x] Automatización de Tasa de Cambio (DolarApi + Cron Job).
- [x] Carga inicial de catálogo de productos (Harina Pan, Kaly, Juana, etc.).
- [x] Creación de estructura de tablas regionales.
- [x] **Selector de Ubicación Premium:** Implementado con Modal y soporte GPS.
- [x] **Rediseño de Pantalla de Login:** Enfoque 100% OAuth con estética moderna.

---

## 9. Funcionalidades Implementadas (Estado Actual)

### 9.1 Autenticación y Seguridad
- [x] **Google Sign-In Unificado:** Implementación robusta en `src/lib/googleAuth.ts` con soporte offline y detección inteligente de entorno (Expo Go vs Nativo).
- [x] **Gestión de Sesiones:** Persistencia segura con Supabase Auth.

### 9.2 Geolocalización Inteligente
- [x] **Contexto de Ubicación (`LocationContext`):** Detección automática de Estado y Municipio con `expo-location`.
- [x] **Fallback y Selección Manual:** Estrategia de "Última Ubicación Conocida" para rapidez y selector manual premium para precisión.

### 9.3 Inventario y Precios
- [x] **Catálogo Visual:** Interfaz de Home con categorías coloridas y buscador dedicado.
- [x] **Comparador de Precios:** Detalle de producto con lista de precios por tienda, ordenados por cercanía (municipio) y costo.
- [x] **Conversión en Tiempo Real:** Contexto global `ExchangeRateContext` que convierte todos los precios a Bolívares (BCV) automáticamente.
- [x] **Scraping de Datos:** Scripts automatizados para extracción de precios de Farmatodo y población de base de datos.

### 9.4 Monetización
- [x] **AdMob Integrado:** Banners configurados en Home/Búsqueda e Intersticiales en navegación de categorías.
- [x] **Gestión de IDs:** Componente `AdBanner` que maneja IDs de prueba y producción según el entorno.

## 10. Siguientes Pasos (Roadmap Inmediato)

1.  **Gamificación y Crowdsourcing:**
    *   Diseñar sistema de puntos por "Reportar Precio".
    *   Implementar flujo de carga de precios para usuarios (foto de factura o selección rápida).

2.  **Optimización de Scraping:**
    *   Ampliar scripts para cubrir más cadenas de supermercados y farmacias.
    *   Implementar sistema de validación de precios scrapeados vs reportados por usuarios.

3.  **Refinamiento de UI/UX:**
    *   Mejorar la velocidad de carga de imágenes (optimización y caché).
    *   Afinar micro-interacciones y animaciones de carga.