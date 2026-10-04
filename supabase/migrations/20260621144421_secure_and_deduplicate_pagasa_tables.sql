-- 1. Hardcode search_path for internal trigger functions to prevent search path hijacking
ALTER FUNCTION internal.prevent_user_role_update() SET search_path = pg_catalog, public, internal;
ALTER FUNCTION internal.update_updated_at_column() SET search_path = pg_catalog, public, internal;
ALTER FUNCTION internal.handle_new_user() SET search_path = pg_catalog, public, internal;

-- 2. Clean duplicates and apply unique constraint on public.pagasa_daily_weather
DELETE FROM public.pagasa_daily_weather
WHERE id NOT IN (
    SELECT DISTINCT ON (issued_at) id
    FROM public.pagasa_daily_weather
    ORDER BY issued_at, created_at DESC
);

ALTER TABLE public.pagasa_daily_weather 
ADD CONSTRAINT pagasa_daily_weather_issued_at_key UNIQUE (issued_at);

-- 3. Clean duplicates and apply unique constraint on public.pagasa_regional_forecasts
DELETE FROM public.pagasa_regional_forecasts
WHERE id NOT IN (
    SELECT DISTINCT ON (region, issued_at) id
    FROM public.pagasa_regional_forecasts
    ORDER BY region, issued_at, created_at DESC
);

ALTER TABLE public.pagasa_regional_forecasts
ADD CONSTRAINT pagasa_regional_forecasts_region_issued_at_key UNIQUE (region, issued_at);

-- 4. Clean duplicates and apply unique constraint on public.pagasa_temperatures
DELETE FROM public.pagasa_temperatures
WHERE id NOT IN (
    SELECT DISTINCT ON (lowest_as_of, highest_as_of) id
    FROM public.pagasa_temperatures
    ORDER BY lowest_as_of, highest_as_of, created_at DESC
);

ALTER TABLE public.pagasa_temperatures
ADD CONSTRAINT pagasa_temperatures_dates_key UNIQUE (lowest_as_of, highest_as_of);

-- 5. Clean duplicates and apply unique constraint on public.pagasa_weekly_outlook
DELETE FROM public.pagasa_weekly_outlook
WHERE id NOT IN (
    SELECT DISTINCT ON (issued_at, valid_until) id
    FROM public.pagasa_weekly_outlook
    ORDER BY issued_at, valid_until, created_at DESC
);

ALTER TABLE public.pagasa_weekly_outlook
ADD CONSTRAINT pagasa_weekly_outlook_dates_key UNIQUE (issued_at, valid_until);

-- 6. Clean duplicates and apply partial unique index on public.pagasa_typhoon_bulletin (where active = true)
DELETE FROM public.pagasa_typhoon_bulletin
WHERE active = true 
AND id NOT IN (
    SELECT DISTINCT ON (title, issued_at) id
    FROM public.pagasa_typhoon_bulletin
    WHERE active = true
    ORDER BY title, issued_at, created_at DESC
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pagasa_typhoon_bulletin_active_unique 
ON public.pagasa_typhoon_bulletin (title, issued_at) 
WHERE (active = true);
