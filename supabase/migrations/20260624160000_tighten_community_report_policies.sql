-- Tighten community report tables RLS policies (C1)
-- Enforce authenticated users only for insert/update and map user_id to auth.uid()

-- 1. Power Outages Policies
DROP POLICY IF EXISTS "Allow insert access on power_outage_reports" ON public.power_outage_reports;
CREATE POLICY "Allow insert access on power_outage_reports" 
  ON public.power_outage_reports 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow update access on power_outage_reports" ON public.power_outage_reports;
CREATE POLICY "Allow update access on power_outage_reports" 
  ON public.power_outage_reports 
  FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

-- Set DEFAULT user_id to auth.uid() so client doesn't need to pass it explicitly
ALTER TABLE public.power_outage_reports ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 2. Waste/Debris Reports Policies
DROP POLICY IF EXISTS "Allow insert access on waste_reports" ON public.waste_reports;
CREATE POLICY "Allow insert access on waste_reports" 
  ON public.waste_reports 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow update access on waste_reports" ON public.waste_reports;
CREATE POLICY "Allow update access on waste_reports" 
  ON public.waste_reports 
  FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

-- Set DEFAULT user_id to auth.uid()
ALTER TABLE public.waste_reports ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Add indexes to community report tables (DB2)
CREATE INDEX IF NOT EXISTS idx_power_outage_status ON public.power_outage_reports(status);
CREATE INDEX IF NOT EXISTS idx_power_outage_reported_at ON public.power_outage_reports(reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_power_outage_user_id ON public.power_outage_reports(user_id);

CREATE INDEX IF NOT EXISTS idx_waste_reports_status ON public.waste_reports(status);
CREATE INDEX IF NOT EXISTS idx_waste_reports_reported_at ON public.waste_reports(reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_waste_reports_user_id ON public.waste_reports(user_id);
