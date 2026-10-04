-- Drop old loose policies if they exist
DROP POLICY IF EXISTS "Allow insert access on incident_reports" ON public.incident_reports;
DROP POLICY IF EXISTS "Allow update access on incident_reports" ON public.incident_reports;
DROP POLICY IF EXISTS "Allow delete access on incident_reports" ON public.incident_reports;

-- Set default user_id to auth.uid() so clients don't need to specify it explicitly
ALTER TABLE public.incident_reports ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Allow INSERT for authenticated users, verifying they insert their own uid or NULL (anonymous)
CREATE POLICY "Allow insert access on incident_reports"
    ON public.incident_reports
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Allow UPDATE for the owner of the report OR users with the admin role
CREATE POLICY "Allow update access on incident_reports"
    ON public.incident_reports
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    ))
    WITH CHECK (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    ));

-- Allow DELETE for the owner of the report OR users with the admin role
CREATE POLICY "Allow delete access on incident_reports"
    ON public.incident_reports
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    ));
