-- Add foreign key reference to public.profiles from incident_reports.user_id
-- This allows PostgREST to automatically resolve joins across schemas.

-- 1. Drop the existing foreign key constraint that references auth.users
ALTER TABLE public.incident_reports
DROP CONSTRAINT IF EXISTS incident_reports_user_id_fkey;

-- 2. Add the new constraint referencing public.profiles(id)
ALTER TABLE public.incident_reports
ADD CONSTRAINT incident_reports_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
