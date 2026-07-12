
-- Extend app_role enum with financial roles (Postgres ALTER TYPE ADD VALUE cannot run in a txn block with other DDL; do these first)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'finance_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hn_pay_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'group_owner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'project_owner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'project_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support_agent';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'security_auditor';
