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

## 9. Siguientes pasos
1. **Desarrollar UI de Inventario (Búsqueda):** Pantalla de listado de productos con precios reales convertidos a BS.
2. **Formulario de Supervisor:** Flujo para reportar nuevos precios desde la calle.
3. **Perfil de Usuario:** Gestión de moneda favorita y municipio predeterminado.