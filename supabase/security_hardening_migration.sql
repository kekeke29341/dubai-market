-- ============================================================
-- Security hardening: privilege guards, ban enforcement, audit log
-- Run after schema.sql, admin_patch.sql, and prohibited_words_migration.sql
-- ============================================================

-- Prevent regular users from granting themselves admin / clearing a ban
CREATE OR REPLACE FUNCTION public.protect_privileged_profile_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    NEW.is_admin := OLD.is_admin;
    NEW.is_banned := OLD.is_banned;
    NEW.ban_reason := OLD.ban_reason;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_privileged_profile_columns ON public.profiles;
CREATE TRIGGER protect_privileged_profile_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_privileged_profile_columns();

-- Sellers must not overwrite moderation fields on their own listings
CREATE OR REPLACE FUNCTION public.protect_admin_item_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    NEW.is_flagged := OLD.is_flagged;
    NEW.admin_note := OLD.admin_note;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_admin_item_columns ON public.items;
CREATE TRIGGER protect_admin_item_columns
  BEFORE UPDATE ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_admin_item_columns();

-- Banned accounts cannot create listings or send messages
CREATE OR REPLACE FUNCTION public.reject_banned_writer()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_banned = true
  ) THEN
    RAISE EXCEPTION 'Your account is suspended.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reject_banned_item_insert ON public.items;
CREATE TRIGGER reject_banned_item_insert
  BEFORE INSERT ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_banned_writer();

DROP TRIGGER IF EXISTS reject_banned_message_insert ON public.messages;
CREATE TRIGGER reject_banned_message_insert
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_banned_writer();

-- Admin action audit trail
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action      text NOT NULL,
  target_type text,
  target_id   text,
  details     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_logs_created_at_idx
  ON public.admin_audit_logs (created_at DESC);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_logs FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can insert audit logs"
  ON public.admin_audit_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() AND admin_id = auth.uid());

-- Callable by the service-role admin client (auth.uid() is null) or an admin session
CREATE OR REPLACE FUNCTION public.security_check_status()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN jsonb_build_object(
    'profile_privilege_trigger', EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'protect_privileged_profile_columns' AND NOT tgisinternal
    ),
    'item_admin_column_trigger', EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'protect_admin_item_columns' AND NOT tgisinternal
    ),
    'banned_item_trigger', EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'reject_banned_item_insert' AND NOT tgisinternal
    ),
    'prohibited_words_trigger', EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'item_prohibited_words_check' AND NOT tgisinternal
    ),
    'audit_log_table', EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'admin_audit_logs'
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.security_check_status() TO authenticated, service_role;
