-- Create power outage reports table
CREATE TABLE IF NOT EXISTS public.power_outage_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
    outage_type TEXT NOT NULL CHECK (outage_type IN ('total', 'voltage_fluctuation', 'fallen_lines')),
    description TEXT,
    reported_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create waste/debris reports table
CREATE TABLE IF NOT EXISTS public.waste_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'clearing', 'resolved')),
    waste_type TEXT NOT NULL CHECK (waste_type IN ('clogged_drain', 'debris', 'trash_pile')),
    description TEXT,
    image_url TEXT,
    reported_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.power_outage_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_reports ENABLE ROW LEVEL SECURITY;

-- Allow public read access to anyone
CREATE POLICY "Allow public read access on power_outage_reports" ON public.power_outage_reports FOR SELECT USING (true);
CREATE POLICY "Allow public read access on waste_reports" ON public.waste_reports FOR SELECT USING (true);

-- Allow inserting and updating reports (for both anonymous and logged in users through client/API)
CREATE POLICY "Allow insert access on power_outage_reports" ON public.power_outage_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access on power_outage_reports" ON public.power_outage_reports FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow insert access on waste_reports" ON public.waste_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access on waste_reports" ON public.waste_reports FOR UPDATE USING (true) WITH CHECK (true);

-- Attach updated_at timestamp triggers
CREATE TRIGGER set_power_outages_updated_at
    BEFORE UPDATE ON public.power_outage_reports
    FOR EACH ROW EXECUTE FUNCTION internal.update_updated_at_column();

CREATE TRIGGER set_waste_reports_updated_at
    BEFORE UPDATE ON public.waste_reports
    FOR EACH ROW EXECUTE FUNCTION internal.update_updated_at_column();
