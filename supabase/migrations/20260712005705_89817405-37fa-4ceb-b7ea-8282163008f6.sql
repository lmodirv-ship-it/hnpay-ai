
REVOKE ALL ON FUNCTION private.is_group_owner(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.is_hn_pay_admin(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.has_site_role(uuid, uuid, public.app_role[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.site_can_read(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.site_can_write(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.site_can_manage(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.site_can_read_financial(uuid, uuid) FROM PUBLIC, anon, authenticated;
