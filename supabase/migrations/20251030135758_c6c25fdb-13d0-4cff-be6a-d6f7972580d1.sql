-- Add UPDATE policy to verification_history table
-- Users can only update their own verification history records
CREATE POLICY "Users can update their own verification history"
ON public.verification_history
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add DELETE policy to verification_history table
-- Users can only delete their own verification history records
CREATE POLICY "Users can delete their own verification history"
ON public.verification_history
FOR DELETE
USING (auth.uid() = user_id);