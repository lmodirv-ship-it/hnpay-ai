
-- ============================================================
-- Phase 2: Invoices, Refunds, Audit Logs
-- ============================================================

-- 1) billing_invoices
CREATE TABLE IF NOT EXISTS public.billing_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  public_id text NOT NULL UNIQUE DEFAULT ('inv_' || encode(gen_random_bytes(9),'hex')),
  project_id uuid REFERENCES public.hn_projects(id) ON DELETE SET NULL,
  site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  tax_amount numeric(14,2) NOT NULL DEFAULT 0,
  discount_amount numeric(14,2) NOT NULL DEFAULT 0,
  total_amount numeric(14,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'MAD',
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','open','paid','void','overdue','refunded','partially_refunded')),
  issued_at timestamptz NOT NULL DEFAULT now(),
  due_at timestamptz,
  paid_at timestamptz,
  pdf_url text,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_project  ON public.billing_invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_customer ON public.billing_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_status   ON public.billing_invoices(status);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_issued   ON public.billing_invoices(issued_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.billing_invoices TO authenticated;
GRANT ALL ON public.billing_invoices TO service_role;
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_read_authorized" ON public.billing_invoices
  FOR SELECT TO authenticated
  USING (public.user_can_access_project(project_id));

CREATE POLICY "invoices_write_managers" ON public.billing_invoices
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role::text IN ('owner','admin','finance_manager','accountant','hn_pay_admin','group_owner'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role::text IN ('owner','admin','finance_manager','accountant','hn_pay_admin','group_owner'))
  );

CREATE TRIGGER trg_billing_invoices_updated_at
  BEFORE UPDATE ON public.billing_invoices
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 2) invoice_items
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.billing_invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  catalog_item_id uuid REFERENCES public.catalog_items(id) ON DELETE SET NULL,
  catalog_price_id uuid REFERENCES public.catalog_prices(id) ON DELETE SET NULL,
  plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,
  quantity numeric(12,2) NOT NULL DEFAULT 1,
  unit_price numeric(14,2) NOT NULL DEFAULT 0,
  tax_amount numeric(14,2) NOT NULL DEFAULT 0,
  discount_amount numeric(14,2) NOT NULL DEFAULT 0,
  line_total numeric(14,2) NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON public.invoice_items(invoice_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_items TO authenticated;
GRANT ALL ON public.invoice_items TO service_role;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoice_items_via_invoice" ON public.invoice_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.billing_invoices bi WHERE bi.id = invoice_items.invoice_id AND public.user_can_access_project(bi.project_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.billing_invoices bi WHERE bi.id = invoice_items.invoice_id AND public.user_can_access_project(bi.project_id)));

-- 3) refunds
CREATE TABLE IF NOT EXISTS public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id text NOT NULL UNIQUE DEFAULT ('ref_' || encode(gen_random_bytes(9),'hex')),
  project_id uuid REFERENCES public.hn_projects(id) ON DELETE SET NULL,
  site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
  invoice_id uuid REFERENCES public.billing_invoices(id) ON DELETE SET NULL,
  amount numeric(14,2) NOT NULL,
  currency text NOT NULL DEFAULT 'MAD',
  reason text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','processing','succeeded','failed','canceled')),
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  provider text,
  provider_refund_id text,
  processed_at timestamptz,
  failure_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_refunds_project  ON public.refunds(project_id);
CREATE INDEX IF NOT EXISTS idx_refunds_payment  ON public.refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status   ON public.refunds(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.refunds TO authenticated;
GRANT ALL ON public.refunds TO service_role;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "refunds_read_authorized" ON public.refunds
  FOR SELECT TO authenticated
  USING (public.user_can_access_project(project_id));

CREATE POLICY "refunds_write_managers" ON public.refunds
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role::text IN ('owner','admin','finance_manager','hn_pay_admin','group_owner'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role::text IN ('owner','admin','finance_manager','hn_pay_admin','group_owner'))
  );

CREATE TRIGGER trg_refunds_updated_at
  BEFORE UPDATE ON public.refunds
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 4) audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.hn_projects(id) ON DELETE SET NULL,
  site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_table text,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  ip_address text,
  user_agent text,
  status text NOT NULL DEFAULT 'success'
    CHECK (status IN ('success','failure','denied')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user     ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_project  ON public.audit_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity   ON public.audit_logs(entity_table, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created  ON public.audit_logs(created_at DESC);

GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_read_auditors" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role::text IN ('owner','admin','security_auditor','hn_pay_admin','group_owner'))
  );

-- No INSERT/UPDATE/DELETE policies → only service_role writes.

-- 5) settlements (Phase 4 preview, but simple enough to include)
CREATE TABLE IF NOT EXISTS public.settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id text NOT NULL UNIQUE DEFAULT ('stl_' || encode(gen_random_bytes(9),'hex')),
  project_id uuid REFERENCES public.hn_projects(id) ON DELETE SET NULL,
  provider text NOT NULL,
  currency text NOT NULL DEFAULT 'MAD',
  gross_amount numeric(14,2) NOT NULL DEFAULT 0,
  fee_amount numeric(14,2) NOT NULL DEFAULT 0,
  tax_amount numeric(14,2) NOT NULL DEFAULT 0,
  refund_amount numeric(14,2) NOT NULL DEFAULT 0,
  net_amount numeric(14,2) NOT NULL DEFAULT 0,
  expected_payout numeric(14,2) NOT NULL DEFAULT 0,
  settlement_date date,
  bank_reference text,
  reconciliation_status text NOT NULL DEFAULT 'pending'
    CHECK (reconciliation_status IN ('pending','matched','mismatched','manual_review')),
  unmatched_count integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.settlements TO authenticated;
GRANT ALL ON public.settlements TO service_role;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settlements_managers" ON public.settlements
  FOR ALL TO authenticated
  USING (
    public.user_can_access_project(project_id)
    AND EXISTS (SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role::text IN ('owner','admin','finance_manager','accountant','hn_pay_admin','group_owner'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role::text IN ('owner','admin','finance_manager','accountant','hn_pay_admin','group_owner'))
  );

CREATE TRIGGER trg_settlements_updated_at
  BEFORE UPDATE ON public.settlements
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 6) Invoice number sequence + function
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START 1000;
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = public
AS $$
  SELECT 'INV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.invoice_number_seq')::text, 6, '0');
$$;
REVOKE EXECUTE ON FUNCTION public.generate_invoice_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_invoice_number() TO authenticated, service_role;
