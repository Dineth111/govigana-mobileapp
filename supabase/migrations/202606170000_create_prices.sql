-- Create Extension for UUID generation if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create the `prices` table
CREATE TABLE IF NOT EXISTS public.prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market TEXT NOT NULL,         -- e.g. 'Colombo', 'Dambulla', 'Narahenpita', 'Mannar'
    category TEXT NOT NULL,       -- 'එළවළු' (vegetables) or 'පලතුරු' (fruits)
    crop TEXT NOT NULL,           -- e.g. 'ලොකු ලූණු', 'අන්නාසි'
    price INT NOT NULL,           -- LKR per unit
    unit TEXT NOT NULL DEFAULT 'Kg',
    date DATE NOT NULL,
    change INT,                   -- vs previous available date for same market+crop, in LKR
    source TEXT NOT NULL,         -- 'HARTI' or 'DCS'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Unique constraint on (market, crop, date) for conflict resolution on upsert
    CONSTRAINT unique_market_crop_date UNIQUE (market, crop, date)
);

-- 2. Create the `scraper_runs` table
CREATE TABLE IF NOT EXISTS public.scraper_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    source_used TEXT NOT NULL,    -- 'HARTI', 'DCS', or 'BOTH'
    success BOOLEAN NOT NULL,
    rows_written INT NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_prices_market_date ON public.prices(market, date);
CREATE INDEX IF NOT EXISTS idx_prices_crop_date ON public.prices(crop, date);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraper_runs ENABLE ROW LEVEL SECURITY;

-- 5. Define RLS Policies for `prices`
-- Allow read-only (SELECT) access for public (anon)
CREATE POLICY "Allow public read access to prices" 
ON public.prices 
FOR SELECT 
USING (true);

-- Allow full write (INSERT, UPDATE, DELETE) access for service_role only
CREATE POLICY "Allow service_role full access to prices" 
ON public.prices 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- 6. Define RLS Policies for `scraper_runs`
-- Allow read-only (SELECT) access for public (anon)
CREATE POLICY "Allow public read access to scraper_runs" 
ON public.scraper_runs 
FOR SELECT 
USING (true);

-- Allow full write (INSERT, UPDATE, DELETE) access for service_role only
CREATE POLICY "Allow service_role full access to scraper_runs" 
ON public.scraper_runs 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);
