-- SincroVzla Complete Database Setup Script
-- Run this ENTIRE script in your Supabase SQL Editor
-- Part 1: Core Tables and Exchange Rates

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- EXCHANGE RATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  rate_bcv numeric NOT NULL,
  rate_parallel numeric NOT NULL,
  date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'exchange_rates' AND policyname = 'Exchange rates are viewable by everyone.'
  ) THEN
    CREATE POLICY "Exchange rates are viewable by everyone." ON public.exchange_rates FOR SELECT USING (true);
  END IF;
END $$;

-- Insert initial exchange rate
INSERT INTO public.exchange_rates (rate_bcv, rate_parallel, date)
VALUES (45.50, 48.00, NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- STATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.states (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  code text UNIQUE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'states' AND policyname = 'States are viewable by everyone.'
  ) THEN
    CREATE POLICY "States are viewable by everyone." ON public.states FOR SELECT USING (true);
  END IF;
END $$;

-- ============================================
-- MUNICIPALITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.municipalities (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  state_id uuid REFERENCES public.states(id) NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(state_id, name)
);

ALTER TABLE public.municipalities ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'municipalities' AND policyname = 'Municipalities are viewable by everyone.'
  ) THEN
    CREATE POLICY "Municipalities are viewable by everyone." ON public.municipalities FOR SELECT USING (true);
  END IF;
END $$;

-- ============================================
-- VENEZUELA STATES (23 Estados + Distrito Capital)
-- ============================================
INSERT INTO public.states (name, code) VALUES
  ('Amazonas', 'AMA'),
  ('Anzoátegui', 'ANZ'),
  ('Apure', 'APU'),
  ('Aragua', 'ARA'),
  ('Barinas', 'BAR'),
  ('Bolívar', 'BOL'),
  ('Carabobo', 'CAR'),
  ('Cojedes', 'COJ'),
  ('Delta Amacuro', 'DAM'),
  ('Distrito Capital', 'DC'),
  ('Falcón', 'FAL'),
  ('Guárico', 'GUA'),
  ('Lara', 'LAR'),
  ('Mérida', 'MER'),
  ('Miranda', 'MIR'),
  ('Monagas', 'MON'),
  ('Nueva Esparta', 'NE'),
  ('Portuguesa', 'POR'),
  ('Sucre', 'SUC'),
  ('Táchira', 'TAC'),
  ('Trujillo', 'TRU'),
  ('Vargas', 'VAR'),
  ('Yaracuy', 'YAR'),
  ('Zulia', 'ZUL')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- VENEZUELA MUNICIPALITIES (Main ones per state)
-- ============================================

-- Distrito Capital
INSERT INTO public.municipalities (state_id, name)
SELECT id, municipality FROM public.states, (VALUES
  ('Libertador')
) AS m(municipality)
WHERE states.name = 'Distrito Capital'
ON CONFLICT DO NOTHING;

-- Miranda (principales)
INSERT INTO public.municipalities (state_id, name)
SELECT id, municipality FROM public.states, (VALUES
  ('Baruta'),
  ('Carrizal'),
  ('Chacao'),
  ('El Hatillo'),
  ('Guaicaipuro'),
  ('Los Salias'),
  ('Paz Castillo'),
  ('Plaza'),
  ('Sucre'),
  ('Zamora')
) AS m(municipality)
WHERE states.name = 'Miranda'
ON CONFLICT DO NOTHING;

-- Zulia (principales)
INSERT INTO public.municipalities (state_id, name)
SELECT id, municipality FROM public.states, (VALUES
  ('Maracaibo'),
  ('San Francisco'),
  ('Jesús Enrique Lossada'),
  ('Cabimas'),
  ('Lagunillas'),
  ('Mara'),
  ('Santa Rita'),
  ('Almirante Padilla'),
  ('Baralt'),
  ('Catatumbo')
) AS m(municipality)
WHERE states.name = 'Zulia'
ON CONFLICT DO NOTHING;

-- Carabobo (principales)
INSERT INTO public.municipalities (state_id, name)
SELECT id, municipality FROM public.states, (VALUES
  ('Valencia'),
  ('Naguanagua'),
  ('San Diego'),
  ('Los Guayos'),
  ('Libertador'),
  ('Carlos Arvelo'),
  ('Diego Ibarra'),
  ('Guacara'),
  ('Puerto Cabello'),
  ('San Joaquín')
) AS m(municipality)
WHERE states.name = 'Carabobo'
ON CONFLICT DO NOTHING;

-- Lara (principales)
INSERT INTO public.municipalities (state_id, name)
SELECT id, municipality FROM public.states, (VALUES
  ('Iribarren'),
  ('Palavecino'),
  ('Torres'),
  ('Jiménez'),
  ('Crespo'),
  ('Morán'),
  ('Andrés Eloy Blanco'),
  ('Simón Planas'),
  ('Urdaneta')
) AS m(municipality)
WHERE states.name = 'Lara'
ON CONFLICT DO NOTHING;

-- Aragua (principales)
INSERT INTO public.municipalities (state_id, name)
SELECT id, municipality FROM public.states, (VALUES
  ('Girardot'),
  ('Mario Briceño Iragorry'),
  ('Santiago Mariño'),
  ('José Ángel Lamas'),
  ('José Félix Ribas'),
  ('José Rafael Revenga'),
  ('Libertador'),
  ('San Casimiro'),
  ('San Sebastián'),
  ('Sucre')
) AS m(municipality)
WHERE states.name = 'Aragua'
ON CONFLICT DO NOTHING;

-- Verificación
SELECT 'States Created' as status, COUNT(*) as count FROM public.states
UNION ALL
SELECT 'Municipalities Created' as status, COUNT(*) as count FROM public.municipalities
UNION ALL
SELECT 'Exchange Rates Created' as status, COUNT(*) as count FROM public.exchange_rates;
