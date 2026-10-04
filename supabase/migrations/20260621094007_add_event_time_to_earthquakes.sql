-- Add event_time column to phivolcs_earthquakes
ALTER TABLE public.phivolcs_earthquakes ADD COLUMN IF NOT EXISTS event_time TIMESTAMPTZ;

-- Backfill event_time for existing rows
-- Input string e.g. '20 June 2026 - 10:05 PM' in Manila time
UPDATE public.phivolcs_earthquakes
SET event_time = to_timestamp(datetime, 'DD Month YYYY - HH:MI PM') AT TIME ZONE 'Asia/Manila'
WHERE event_time IS NULL;

-- Create index on event_time DESC for fast sorting
CREATE INDEX IF NOT EXISTS idx_phivolcs_earthquakes_event_time 
ON public.phivolcs_earthquakes(event_time DESC);
