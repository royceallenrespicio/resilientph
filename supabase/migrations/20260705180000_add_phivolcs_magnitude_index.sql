-- Add composite index for PHIVOLCS earthquakes sorted by magnitude and event_time
CREATE INDEX IF NOT EXISTS idx_phivolcs_earthquakes_mag_time 
ON public.phivolcs_earthquakes(magnitude DESC, event_time DESC);
