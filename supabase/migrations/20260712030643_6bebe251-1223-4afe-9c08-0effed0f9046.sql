
-- Drop duplicate/permissive public read policies
DROP POLICY IF EXISTS catalog_prices_public_read ON public.catalog_prices;
DROP POLICY IF EXISTS catalog_items_public_read ON public.catalog_items;
DROP POLICY IF EXISTS catalog_features_public_read ON public.catalog_features;

-- Revoke direct EXECUTE on internal SECURITY DEFINER functions from public roles.
-- These functions are triggers or internal helpers and must not be callable via the API.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_role_self_escalation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_owner_profiles() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_owner_roles() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_catalog_items_block_delete_when_used() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_catalog_items_lock_site() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_protected_owner(uuid) FROM PUBLIC, anon, authenticated;
