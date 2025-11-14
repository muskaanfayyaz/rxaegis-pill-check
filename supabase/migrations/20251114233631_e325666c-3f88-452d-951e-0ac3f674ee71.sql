-- Add INSERT policy for medicines table to allow authenticated users to import data
CREATE POLICY "Authenticated users can insert medicines"
ON public.medicines
FOR INSERT
TO authenticated
WITH CHECK (true);