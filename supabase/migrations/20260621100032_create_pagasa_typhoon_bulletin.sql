-- Create table for PAGASA Typhoon Bulletins
CREATE TABLE IF NOT EXISTS public.pagasa_typhoon_bulletin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    active BOOLEAN NOT NULL DEFAULT false,
    message TEXT,
    title TEXT,
    issued_at TEXT,
    validity TEXT,
    pdf_url TEXT,
    details JSONB DEFAULT '[]'::jsonb,
    track_image TEXT,
    location TEXT,
    movement TEXT,
    strength TEXT,
    forecast_positions JSONB DEFAULT '[]'::jsonb,
    wind_signal TEXT,
    archive JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pagasa_typhoon_bulletin ENABLE ROW LEVEL SECURITY;

-- Grant select policy for public reading
CREATE POLICY "Allow public read access on pagasa_typhoon_bulletin" 
ON public.pagasa_typhoon_bulletin FOR SELECT USING (true);

-- Index on created_at DESC for fast sorting
CREATE INDEX IF NOT EXISTS idx_pagasa_typhoon_bulletin_created_at
ON public.pagasa_typhoon_bulletin(created_at DESC);
