# Documento de Requerimientos del Producto (PRD): Jooz (SincroVzla)

**Versión:** 1.3  
**Estado:** Activo  
**Fecha:** 10 de febrero de 2026  
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
- Monetización vía banners, intersticiales y membresías B2B.

## 3. Público Objetivo
- **Consumidor (Ahorrador):** Busca optimizar su presupuesto.
- **Comerciante (B2B):** Gestiona su inventario y visibilidad en la app.
- **Administrador:** Gestión de solicitudes comerciales y moderación.

## 4. Requerimientos Funcionales (FR)
- **FR1: Gestión de Ubicación Regional** (GPS via `expo-location` o selección manual). [IMPLEMETADO]
- **FR2: Comparador de Precios y Moneda Dual** (Tasa automatizada vía Edge Functions). [IMPLEMENTADO]
- **FR3: Gamificación y Validación Crowdsourced** (Puntos, niveles y validación rápida). [IMPLEMENTADO]
- **FR4: Dashboard Comercial** (Carga masiva CSV, verificación y analíticas). [IMPLEMENTADO]
- **FR5: Monetización (AdMob & Membresías)** (Banners y suscripciones premium). [IMPLEMENTADO]

## 5. Requerimientos No Funcionales (NFR)
- **NFR1: Seguridad** (RLS en Supabase para proteger tablas sensibles).
- **NFR2: Legalidad** (Identificación de tiendas por texto plano, sin logos protegidos).
- **NFR3: Rendimiento** (Caché eficiente para ahorro de datos móviles).

## 6. Arquitectura del Sistema
- **Frontend:** Expo / React Native (Expo Router).
- **Backend:** Supabase (PostgreSQL).
- **Suscripciones:** Gestión de tier `free` y `premium` con periodos de gracia.

## 7. Modelo de Datos
- `profiles`: id, email, role, home_municipality_id, points, level, is_admin.
- `stores`: id, name, location, municipality_id, is_verified, merchant_id, subscription_tier, subscription_active, subscription_expires_at.
- `products`: id, name, brand, category, image_url.
- `prices`: product_id, store_id, price_usd, updated_at, updated_by.
- `exchange_rates`: id, rate_bcv, rate_parallel, date.
- `merchant_requests`: id, user_id, store_name, rif, status.

## 8. Estado del Proyecto (Logros)
- [x] Configuración inicial Expo + Supabase.
- [x] Implementación de Google Auth nativo (con blindaje para Expo Go/Web).
- [x] Automatización de Tasa de Cambio (DolarApi + Cron Job).
- [x] Carga inicial de catálogo de productos (Harina Pan, Kaly, Juana, etc.).
- [x] Creación de estructura de tablas regionales.
- [x] Selector de Ubicación Premium: Implementado con Modal y soporte GPS.
- [x] Rediseño de Pantalla de Login: Enfoque 100% OAuth con estética moderna.
- [x] **Fase 1: Gamificación:** Sistema de puntos, niveles y validación "un solo tap".
- [x] **Fase 2: Merchant Phase:** Dashboard, Carga masiva CSV y Sello de Verificación.
- [x] **Administración:** Panel central para aprobación de comercios y gestión de membresías.

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

### 9.5 Gamificación y Crowdsourcing (Fase 1)
- [x] **Puntos y Niveles:** Perfil de usuario dinámico que muestra progreso y recompensas.
- [x] **Validación Rápida:** Botón en detalle de producto para confirmar precios con un toque.

### 9.6 Alianza con Comercios y B2B (Fase 2)
- [x] **Registro de Comerciantes:** Flujo para solicitar verificación de tienda con RIF.
- [x] **Merchant Dashboard:** Gestión de inventario propio y botón de "Vigencia Total" de precios.
- [x] **Batch Update:** Sistema de importación vía CSV para carga masiva de catálogos.
- [x] **Ordenamiento Híbrido:** Algoritmo que prioriza tiendas locales verificadas manteniendo el enfoque en el ahorro.

### 9.7 Administración y Monetización
- [x] **Panel Administrativo:** Interfaz exclusiva para moderadores para aprobar o rechazar comercios.
- [x] **Membresías Premium:** Estructura para activar suscripciones (inicialmente de cortesía por 6 meses).

## 10. Próximas Fases

### Fase 3: Automatización con IA/OCR (Esfuerzo Alto)
Eliminar la necesidad de escribir manualmente mediante el procesamiento de fotos de facturas o habladores de precios.

#### 3.1 Edge Function: `process-invoice-ocr`
Esta función recibirá una imagen en Base64 desde la App (Expo), la enviará a una API de IA (Google Vision o GPT-4o-mini) y devolverá los datos estructurados.

*   **Input:** Imagen + `store_id`.
*   **Procesamiento:** La IA identifica pares de "Nombre de Producto" y "Precio".
*   **Matching:** La función busca en tu tabla `products` los nombres más similares.
*   **Output:** Devuelve una lista para que el usuario confirme antes de guardar.

#### 3.2 Snippet Conceptual de la Edge Function (Node.js)

```javascript
// supabase/functions/process-invoice/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { image, store_id, user_id } = await req.json()
  
  // 1. Llamada a Vision API (Ejemplo conceptual)
  const visionData = await callVisionAPI(image); 
  
  // 2. Lógica de limpieza y mapeo con la base de datos de Jooz
  // ...
  
  return new Response(JSON.stringify({ detected_prices: visionData }), {
    headers: { "Content-Type": "application/json" },
  })
})
```

### Resumen de Requerimientos de Base de Datos Totales
Para soportar todo lo anterior, tu esquema final debería incluir estas relaciones:

| Tabla | Campos Clave a Añadir/Asegurar | Propósito |
| :--- | :--- | :--- |
| `profiles` | `points`, `role`, `reputation_score` | Gamificación y Seguridad RLS. |
| `prices` | `source` (enum: 'manual', 'ocr', 'merchant') | Trazabilidad de la data. |
| `gamification_logs` | `action_type`, `points_earned`, `created_at` | Auditoría de puntos. |
| `merchant_requests` | `store_id`, `rif_photo_url`, `status` | Control de ingreso de comercios. |

### Recomendación de Marketing Local
Para el lanzamiento en **Punto Fijo**, podrías crear un evento de "Inauguración Digital":
*   **Acción:** Los primeros 50 usuarios que lleguen a Nivel 2 (Explorador) participan en un sorteo de una Gift Card de 20 USDT.
*   **Canal:** Grupos de Telegram de "Ofertas Paraguaná".
