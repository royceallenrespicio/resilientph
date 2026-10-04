-- Add index for daily weather queries sorted by created_at desc
CREATE INDEX IF NOT EXISTS idx_pagasa_daily_weather_created_at 
ON public.pagasa_daily_weather(created_at DESC);

-- Add index for regional forecasts lookup by region and time
CREATE INDEX IF NOT EXISTS idx_pagasa_regional_forecasts_lookup 
ON public.pagasa_regional_forecasts(region, created_at DESC);

-- Add index for temperature logs sorted by created_at desc
CREATE INDEX IF NOT EXISTS idx_pagasa_temperatures_created_at 
ON public.pagasa_temperatures(created_at DESC);

-- Add index for weekly outlook sorted by created_at desc
CREATE INDEX IF NOT EXISTS idx_pagasa_weekly_outlook_created_at 
ON public.pagasa_weekly_outlook(created_at DESC);

-- Add index for PHIVOLCS earthquakes sorted by datetime desc
CREATE INDEX IF NOT EXISTS idx_phivolcs_earthquakes_datetime 
ON public.phivolcs_earthquakes(datetime DESC);
