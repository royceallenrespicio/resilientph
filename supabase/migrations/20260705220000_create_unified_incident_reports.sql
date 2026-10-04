-- Create unified incident_reports table
CREATE TABLE IF NOT EXISTS public.incident_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('power_outage','waste','flood','landslide','fire','road_hazard','gas_leak')),
    sub_type TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'monitoring', 'resolved')),
    severity TEXT NOT NULL DEFAULT 'moderate' CHECK (severity IN ('low','moderate','high','critical')),
    reported_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on incident_reports" ON public.incident_reports FOR SELECT USING (true);

-- Allow insert access
CREATE POLICY "Allow insert access on incident_reports" ON public.incident_reports FOR INSERT WITH CHECK (true);

-- Allow update access
CREATE POLICY "Allow update access on incident_reports" ON public.incident_reports FOR UPDATE USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_incident_reports_category ON public.incident_reports(category);
CREATE INDEX IF NOT EXISTS idx_incident_reports_reported_at ON public.incident_reports(reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_incident_reports_location ON public.incident_reports(latitude, longitude);

-- Trigger for updated_at
CREATE TRIGGER set_incident_reports_updated_at
    BEFORE UPDATE ON public.incident_reports
    FOR EACH ROW EXECUTE FUNCTION internal.update_updated_at_column();

-- Migrate existing data from power_outage_reports
INSERT INTO public.incident_reports (id, user_id, category, sub_type, description, latitude, longitude, status, severity, reported_at, updated_at)
SELECT 
    id, 
    user_id, 
    'power_outage', 
    outage_type, 
    description, 
    latitude, 
    longitude, 
    CASE WHEN status = 'active' THEN 'active' ELSE 'resolved' END, 
    'moderate', 
    reported_at, 
    updated_at
FROM public.power_outage_reports
ON CONFLICT (id) DO NOTHING;

-- Migrate existing data from waste_reports
INSERT INTO public.incident_reports (id, user_id, category, sub_type, description, image_url, latitude, longitude, status, severity, reported_at, updated_at)
SELECT 
    id, 
    user_id, 
    'waste', 
    waste_type, 
    description, 
    image_url, 
    latitude, 
    longitude, 
    CASE WHEN status = 'reported' THEN 'active' WHEN status = 'clearing' THEN 'monitoring' ELSE 'resolved' END, 
    'low', 
    reported_at, 
    updated_at
FROM public.waste_reports
ON CONFLICT (id) DO NOTHING;
