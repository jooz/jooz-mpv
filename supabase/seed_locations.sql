-- Insert States
INSERT INTO public.states (name) VALUES 
('Distrito Capital'),
('Miranda'),
('Zulia'),
('Carabobo'),
('Lara'),
('Aragua'),
('Anzoátegui'),
('Bolívar'),
('Táchira'),
('Falcón')
ON CONFLICT (name) DO NOTHING;

-- Function to get state_id by name (temporary help for seeding)
-- We'll just do nested inserts or CTEs if supported, or straightforward lookups in a real script. 
-- For this SQL file, we assume the IDs are generated. 
-- A more robust way in pure SQL without hardcoding IDs:

DO $$
DECLARE
  dc_id uuid;
  mir_id uuid;
  zul_id uuid;
  car_id uuid;
BEGIN
  SELECT id INTO dc_id FROM public.states WHERE name = 'Distrito Capital';
  SELECT id INTO mir_id FROM public.states WHERE name = 'Miranda';
  SELECT id INTO zul_id FROM public.states WHERE name = 'Zulia';
  SELECT id INTO car_id FROM public.states WHERE name = 'Carabobo';

  -- Distrito Capital
  INSERT INTO public.municipalities (state_id, name) VALUES 
  (dc_id, 'Libertador');

  -- Miranda
  INSERT INTO public.municipalities (state_id, name) VALUES 
  (mir_id, 'Chacao'),
  (mir_id, 'Baruta'),
  (mir_id, 'Sucre'),
  (mir_id, 'El Hatillo');

  -- Zulia
  INSERT INTO public.municipalities (state_id, name) VALUES 
  (zul_id, 'Maracaibo'),
  (zul_id, 'San Francisco');

  -- Carabobo
  INSERT INTO public.municipalities (state_id, name) VALUES 
  (car_id, 'Valencia'),
  (car_id, 'Naguanagua'),
  (car_id, 'San Diego');

END $$;
