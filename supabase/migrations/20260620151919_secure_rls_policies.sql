-- Revoke broad public write access policies to secure user and database data
-- 1. Drop the write policies on public.scrape_status
DROP POLICY IF EXISTS "Allow write access on scrape_status" ON public.scrape_status;

-- 2. Drop the write policies on public.pagasa_daily_weather
DROP POLICY IF EXISTS "Allow write access on pagasa_daily_weather" ON public.pagasa_daily_weather;

-- 3. Drop the write policies on public.pagasa_regional_forecasts
DROP POLICY IF EXISTS "Allow write access on pagasa_regional_forecasts" ON public.pagasa_regional_forecasts;

-- 4. Drop the write policies on public.pagasa_temperatures
DROP POLICY IF EXISTS "Allow write access on pagasa_temperatures" ON public.pagasa_temperatures;

-- 5. Drop the write policies on public.pagasa_weekly_outlook
DROP POLICY IF EXISTS "Allow write access on pagasa_weekly_outlook" ON public.pagasa_weekly_outlook;

-- 6. Drop the write policies on public.phivolcs_earthquakes
DROP POLICY IF EXISTS "Allow write access on phivolcs_earthquakes" ON public.phivolcs_earthquakes;
