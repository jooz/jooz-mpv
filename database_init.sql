-- SincroVzla Database Setup Script
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Exchange Rates Table (CRITICAL for app to work)
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  rate_bcv numeric NOT NULL,
  rate_parallel numeric NOT NULL,
  date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Exchange rates are viewable by everyone." ON public.exchange_rates FOR SELECT USING (true);
CREATE POLICY "Only admins can insert exchange rates." ON public.exchange_rates FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Insert initial exchange rate (UPDATE WITH CURRENT VALUES)
INSERT INTO public.exchange_rates (rate_bcv, rate_parallel, date)
VALUES (45.50, 48.00, NOW())
ON CONFLICT DO NOTHING;

-- Verify table created successfully
SELECT * FROM public.exchange_rates LIMIT 5;
