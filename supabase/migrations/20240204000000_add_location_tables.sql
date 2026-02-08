-- Create States Table
CREATE TABLE public.states (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL UNIQUE
);
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "States are viewable by everyone." ON public.states FOR SELECT USING (true);

-- Create Municipalities Table
CREATE TABLE public.municipalities (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  state_id uuid REFERENCES public.states NOT NULL,
  name text NOT NULL
);
ALTER TABLE public.municipalities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Municipalities are viewable by everyone." ON public.municipalities FOR SELECT USING (true);

-- Update Profiles Table
ALTER TABLE public.profiles 
ADD COLUMN home_state_id uuid REFERENCES public.states(id),
ADD COLUMN home_municipality_id uuid REFERENCES public.municipalities(id);

-- Update Stores Table
ALTER TABLE public.stores
ADD COLUMN municipality_id uuid REFERENCES public.municipalities(id);
-- Ideally we make this NOT NULL later, but for migration safety on existing data we keep it nullable or would need a default.
-- For now, nullable, but app logic should enforce it for new stores.

-- Index for performance
CREATE INDEX idx_municipalities_state_id ON public.municipalities(state_id);
CREATE INDEX idx_stores_municipality_id ON public.stores(municipality_id);
