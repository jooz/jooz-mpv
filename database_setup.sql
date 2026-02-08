-- Create Exchange Rates Table
create table if not exists public.exchange_rates (
  id uuid default uuid_generate_v4() primary key,
  rate_bcv numeric not null,
  rate_parallel numeric not null,
  date date default current_date unique
);

-- Enable RLS
alter table public.exchange_rates enable row level security;

-- Create Policy for reading
create policy "Public rates are viewable by everyone." on public.exchange_rates for select using (true);

-- Insert dummy data for today if not exists (optional, for testing)
insert into public.exchange_rates (rate_bcv, rate_parallel, date)
values (36.45, 45.00, current_date)
on conflict (date) do nothing;
