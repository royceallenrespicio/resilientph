-- Migration: Add provinces column to pagasa_regional_forecasts
ALTER TABLE public.pagasa_regional_forecasts
ADD COLUMN IF NOT EXISTS provinces JSONB DEFAULT '{}'::jsonb;
