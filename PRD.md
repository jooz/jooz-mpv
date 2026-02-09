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

1.  **Refinamiento de UI/UX:**
    *   Mejorar la velocidad de carga de imágenes (optimización y caché).
    *   Afinar micro-interacciones y animaciones de carga.

## 11. Estrategia de Crecimiento y Crowdsourcing (Próximas Fases)

### Fase 1: Gamificación Básica (Bajo Esfuerzo / Alto Impacto)
El objetivo es reducir la fricción. Validar un precio existente es más fácil que crear uno nuevo.

#### 1.1 Sistema de Validación "Un Solo Tap"
Permite que los usuarios confirmen si un precio sigue vigente.
*   **Mecánica:** En la vista de detalle del producto, añadir un botón: "¿Sigue este precio igual? [SÍ] [NO]".
*   **Incentivo:** 5 puntos por confirmación, 20 puntos por actualización.

#### 1.2 Niveles e Insignias
Implementación de un sistema de progresión para fomentar la retención.

| Nivel | Insignia | Puntos Necesarios | Beneficio en App |
| :--- | :--- | :--- | :--- |
| 1 | Novato del Ahorro | 0 - 500 | Acceso básico. |
| 2 | Explorador Local | 501 - 2,000 | Icono distintivo en perfil. |
| 3 | Cazador de Ofertas | 2,001 - 5,000 | 24h sin publicidad por cada 5 reportes. |
| 4 | Centinela | 5,001 - 15,000 | Capacidad de reportar errores en nombres de tiendas. |
| 5 | Leyenda de Jooz | 15,001+ | Moderador de comunidad / Sin anuncios permanente. |

#### 1.3 Base de Datos (Supabase)
Modificar la tabla `profiles` y crear `price_validations`:

```sql
-- Extensión de profiles
ALTER TABLE profiles ADD COLUMN points INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN level INTEGER DEFAULT 1;

-- Nueva tabla de Log de Validaciones
CREATE TABLE price_validations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    price_id UUID REFERENCES prices(id),
    user_id UUID REFERENCES profiles(id),
    is_correct BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Fase 2: Plan de Alianza con Comercios (Esfuerzo Medio)
Transformar a los dueños de bodegones y tiendas en tus principales aliados para que ellos mismos carguen sus inventarios.

#### 2.1 El "Sello de Verificación"
*   **Propuesta:** Los comercios que actualicen sus precios diariamente reciben un "Check Azul".
*   **Beneficio para el comercio:** Sus productos aparecen de primero en las búsquedas locales.
*   **Registro:** Crear un flujo de "Solicitud de Perfil Comercial" donde adjunten una foto del RIF.

#### 2.2 Pasos para la Opción de Comercios
1.  **Dashboard Simplificado:** Una vista en la App (protegida por el RLS de Supabase mediante el rol `merchant`) donde vean su lista de productos.
2.  **Actualización Masiva:** Función de "Marcar todos como vigentes hoy" para ahorrar tiempo.
3.  **Análisis de Competencia:** Mostrarles de forma anónima si sus precios están por encima o por debajo del promedio de su municipio.

#### 2.3 Base de Datos (Supabase)

```sql
-- Modificación de stores para verificación
ALTER TABLE stores ADD COLUMN is_verified BOOLEAN DEFAULT false;
ALTER TABLE stores ADD COLUMN merchant_id UUID REFERENCES profiles(id);

-- RLS para que el comerciante solo edite sus precios
CREATE POLICY "Comerciantes pueden actualizar sus propios precios"
ON prices FOR UPDATE
USING (store_id IN (SELECT id FROM stores WHERE merchant_id = auth.uid()));
```

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