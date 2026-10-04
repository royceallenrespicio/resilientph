-- 1. Scrape Status table to track caching, hashes and rate-limits
CREATE TABLE IF NOT EXISTS public.scrape_status (
    id TEXT PRIMARY KEY, -- e.g., 'pagasa_daily_weather', 'phivolcs_earthquakes'
    url TEXT NOT NULL,
    last_scraped_at TIMESTAMPTZ NOT NULL,
    html_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PAGASA Daily Weather Table
CREATE TABLE IF NOT EXISTS public.pagasa_daily_weather (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issued_at TEXT NOT NULL,
    synopsis TEXT,
    tc_info JSONB DEFAULT '{}'::jsonb,
    forecasts JSONB DEFAULT '[]'::jsonb,
    wind_coastal JSONB DEFAULT '[]'::jsonb,
    temp_humidity JSONB DEFAULT '{}'::jsonb,
    astronomy_tides JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PAGASA Regional Forecasts Table
CREATE TABLE IF NOT EXISTS public.pagasa_regional_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region TEXT NOT NULL, -- e.g., 'nlprsd', 'ncrprsd', 'slprsd', 'visprsd', 'minprsd'
    issued_at TEXT NOT NULL,
    day_forecast JSONB DEFAULT '{}'::jsonb,
    night_forecast JSONB DEFAULT '{}'::jsonb,
    extended_outlook JSONB DEFAULT '[]'::jsonb,
    warnings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PAGASA Low/High Temperatures Table
CREATE TABLE IF NOT EXISTS public.pagasa_temperatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lowest_as_of TEXT NOT NULL,
    lowest JSONB DEFAULT '[]'::jsonb,
    highest_as_of TEXT NOT NULL,
    highest JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PAGASA Weekly Outlook Table
CREATE TABLE IF NOT EXISTS public.pagasa_weekly_outlook (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issued_at TEXT NOT NULL,
    valid_until TEXT NOT NULL,
    outlook JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PHIVOLCS Earthquakes Table
CREATE TABLE IF NOT EXISTS public.phivolcs_earthquakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    datetime TEXT NOT NULL,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    depth_km INTEGER NOT NULL,
    magnitude NUMERIC NOT NULL,
    location TEXT NOT NULL,
    info_url TEXT,
    hash TEXT UNIQUE NOT NULL, -- computed to avoid duplicates on consecutive scrapes
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.scrape_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagasa_daily_weather ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagasa_regional_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagasa_temperatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagasa_weekly_outlook ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phivolcs_earthquakes ENABLE ROW LEVEL SECURITY;

-- Allow public reading (anon and authenticated) of all data
CREATE POLICY "Allow public read access on scrape_status" ON public.scrape_status FOR SELECT USING (true);
CREATE POLICY "Allow public read access on pagasa_daily_weather" ON public.pagasa_daily_weather FOR SELECT USING (true);
CREATE POLICY "Allow public read access on pagasa_regional_forecasts" ON public.pagasa_regional_forecasts FOR SELECT USING (true);
CREATE POLICY "Allow public read access on pagasa_temperatures" ON public.pagasa_temperatures FOR SELECT USING (true);
CREATE POLICY "Allow public read access on pagasa_weekly_outlook" ON public.pagasa_weekly_outlook FOR SELECT USING (true);
CREATE POLICY "Allow public read access on phivolcs_earthquakes" ON public.phivolcs_earthquakes FOR SELECT USING (true);

-- Allow public write/modify access (since we only have publishable key and must modify via Server routes)
CREATE POLICY "Allow write access on scrape_status" ON public.scrape_status FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow write access on pagasa_daily_weather" ON public.pagasa_daily_weather FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow write access on pagasa_regional_forecasts" ON public.pagasa_regional_forecasts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow write access on pagasa_temperatures" ON public.pagasa_temperatures FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow write access on pagasa_weekly_outlook" ON public.pagasa_weekly_outlook FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow write access on phivolcs_earthquakes" ON public.phivolcs_earthquakes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
