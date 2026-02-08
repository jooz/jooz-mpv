-- Profiles Table
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text unique,
  role text check (role in ('admin', 'supervisor', 'user')) default 'user',
  home_state_id uuid references public.states(id),
  home_municipality_id uuid references public.municipalities(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);

-- States Table
create table public.states (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique
);
alter table public.states enable row level security;
create policy "States are viewable by everyone." on public.states for select using (true);

-- Municipalities Table
create table public.municipalities (
  id uuid default uuid_generate_v4() primary key,
  state_id uuid references public.states not null,
  name text not null
);
alter table public.municipalities enable row level security;
create policy "Municipalities are viewable by everyone." on public.municipalities for select using (true);
create index idx_municipalities_state_id on public.municipalities(state_id);

-- Stores Table
create table public.stores (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  location text,
  municipality_id uuid references public.municipalities(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.stores enable row level security;
create index idx_stores_municipality_id on public.stores(municipality_id);

-- Products Table
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  brand text,
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.products enable row level security;

-- Prices Table
create table public.prices (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products not null,
  store_id uuid references public.stores not null,
  price_usd numeric not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_by uuid references public.profiles(id)
);
alter table public.prices enable row level security;

-- Exchange Rates Table
create table public.exchange_rates (
  id uuid default uuid_generate_v4() primary key,
  rate_bcv numeric not null,
  rate_parallel numeric not null,
  date date default current_date unique
);
alter table public.exchange_rates enable row level security;
