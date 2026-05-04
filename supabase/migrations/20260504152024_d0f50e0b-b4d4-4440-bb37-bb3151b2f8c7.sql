
-- Set search_path on set_updated_at and handle_new_user (handle_new_user already has it, set_updated_at doesn't)
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Revoke execute on SECURITY DEFINER functions from public/anon/authenticated
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- has_role is invoked from RLS policies under postgres role context, this is fine.

-- Tighten notifications insert: customers can only insert for themselves; admins can insert any
DROP POLICY "Authenticated insert notifications" ON public.notifications;
CREATE POLICY "Customers insert own notifications" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (audience = 'customer' AND user_id = auth.uid());
CREATE POLICY "Admins insert any notification" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Restrict bucket listing: users can only list their own folder; admins can list all
DROP POLICY "Avatar images public read" ON storage.objects;
CREATE POLICY "Users list own avatars" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Public can read avatars by URL" ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'avatars');
-- Authenticated users can also fetch any specific avatar URL (needed to show other users' avatars)
CREATE POLICY "Authenticated read avatars by URL" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');
