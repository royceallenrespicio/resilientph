-- Create public storage bucket for report images
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-images', 'report-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable SELECT access for everyone so the map client can view the images
CREATE POLICY "Allow public select access on report-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'report-images');

-- Enable INSERT access for authenticated users to upload files
CREATE POLICY "Allow authenticated insert access on report-images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'report-images' AND auth.role() = 'authenticated');
