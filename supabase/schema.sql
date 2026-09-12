-- ==============================================================================
-- SaleTrack Complete Supabase Database Migration & Row Level Security (RLS)
-- ==============================================================================
-- Compatible with:
-- 1. Supabase Auth (Email + Password & Google Sign-In)
-- 2. Multi-tenant business data isolation (Each store only sees its own data)
-- 3. SaleTrack client-side SDK & server administrative console
-- ==============================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. BUSINESSES TABLE (Primary store tenant table)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.businesses (
    id TEXT PRIMARY KEY,
    owner_user_id TEXT NOT NULL,
    user_id TEXT,
    business_name TEXT NOT NULL,
    name TEXT,
    owner_name TEXT NOT NULL,
    country TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    currency_symbol TEXT NOT NULL DEFAULT '$',
    phone_country_code TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    phone_e164 TEXT NOT NULL,
    address TEXT,
    business_email TEXT,
    owner_email TEXT,
    logo_url TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    plan TEXT NOT NULL DEFAULT 'SaleTrack Pro — $4/month',
    subscription_status TEXT NOT NULL DEFAULT 'trial',
    trial_start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    trial_end_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now() + interval '14 days'),
    subscription_start_date TIMESTAMP WITH TIME ZONE,
    next_billing_date TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_test BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all columns exist for existing tables
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS owner_email TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'SaleTrack Pro — $4/month';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now() + interval '14 days');
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

CREATE INDEX IF NOT EXISTS idx_businesses_owner_user_id ON public.businesses(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON public.businesses(user_id);

-- Auto-sync helper trigger for business column aliases
CREATE OR REPLACE FUNCTION public.sync_business_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.user_id IS NULL AND NEW.owner_user_id IS NOT NULL THEN
        NEW.user_id := NEW.owner_user_id;
    END IF;
    IF NEW.owner_user_id IS NULL AND NEW.user_id IS NOT NULL THEN
        NEW.owner_user_id := NEW.user_id;
    END IF;
    IF NEW.name IS NULL AND NEW.business_name IS NOT NULL THEN
        NEW.name := NEW.business_name;
    END IF;
    IF NEW.business_name IS NULL AND NEW.name IS NOT NULL THEN
        NEW.business_name := NEW.name;
    END IF;
    IF NEW.owner_email IS NULL AND NEW.business_email IS NOT NULL THEN
        NEW.owner_email := NEW.business_email;
    END IF;
    IF NEW.business_email IS NULL AND NEW.owner_email IS NOT NULL THEN
        NEW.business_email := NEW.owner_email;
    END IF;
    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_business_columns ON public.businesses;
CREATE TRIGGER trg_sync_business_columns
BEFORE INSERT OR UPDATE ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.sync_business_columns();

-- ------------------------------------------------------------------------------
-- 2. PRODUCTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id TEXT,
    name TEXT NOT NULL,
    sku TEXT NOT NULL DEFAULT '',
    purchase_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 5,
    max_stock INTEGER,
    category TEXT DEFAULT '',
    barcode TEXT,
    unit TEXT DEFAULT 'Piece',
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS barcode TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'Piece';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS max_stock INTEGER;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE INDEX IF NOT EXISTS idx_products_business_id ON public.products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(business_id, barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(business_id, category);

-- Sync quantity and stock
CREATE OR REPLACE FUNCTION public.sync_product_inventory()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF (NEW.stock IS NULL OR NEW.stock = 0) AND NEW.quantity IS NOT NULL THEN
        NEW.stock := NEW.quantity;
    ELSIF (NEW.quantity IS NULL OR NEW.quantity = 0) AND NEW.stock IS NOT NULL THEN
        NEW.quantity := NEW.stock;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_product_inventory ON public.products;
CREATE TRIGGER trg_sync_product_inventory
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.sync_product_inventory();

-- ------------------------------------------------------------------------------
-- 3. CUSTOMERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id TEXT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    total_credit NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
    remaining NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payments JSONB DEFAULT '[]'::jsonb,
    credit_limit NUMERIC(12, 2) DEFAULT 0,
    last_payment_date TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS last_payment_date TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS payments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(12, 2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_customers_business_id ON public.customers(business_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(business_id, phone);

-- ------------------------------------------------------------------------------
-- 4. SALES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sales (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id TEXT,
    invoice_number TEXT NOT NULL,
    date TEXT NOT NULL,
    customer_id TEXT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_email TEXT,
    payment_type TEXT NOT NULL DEFAULT 'cash',
    payment_method TEXT,
    status TEXT NOT NULL DEFAULT 'completed',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tax NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tax_rate NUMERIC(6, 2) NOT NULL DEFAULT 0,
    tax_name TEXT,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    profit NUMERIC(12, 2) NOT NULL DEFAULT 0,
    cogs NUMERIC(12, 2) NOT NULL DEFAULT 0,
    paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
    refunded_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS cogs NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS tax NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(6, 2) DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS tax_name TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC(12, 2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_sales_business_id ON public.sales(business_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales(business_id, date);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON public.sales(customer_id);

-- ------------------------------------------------------------------------------
-- 5. EXPENSES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id TEXT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    date TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_expenses_business_id ON public.expenses(business_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(business_id, date);

-- ------------------------------------------------------------------------------
-- 6. VENDORS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendors (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id TEXT,
    name TEXT NOT NULL,
    company_name TEXT DEFAULT '',
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    opening_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payment_terms TEXT,
    notes TEXT,
    total_purchased NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
    remaining_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    purchases JSONB DEFAULT '[]'::jsonb,
    payments JSONB DEFAULT '[]'::jsonb,
    last_payment_date TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS opening_balance NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS payment_terms TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS purchases JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS payments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS last_payment_date TEXT;

CREATE INDEX IF NOT EXISTS idx_vendors_business_id ON public.vendors(business_id);

-- ------------------------------------------------------------------------------
-- 7. VENDOR PURCHASES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendor_purchases (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id TEXT,
    vendor_id TEXT NOT NULL,
    vendor_name TEXT NOT NULL,
    company_name TEXT,
    date TEXT NOT NULL,
    invoice_number TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    remaining_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'unpaid',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vendor_purchases_business_id ON public.vendor_purchases(business_id);
CREATE INDEX IF NOT EXISTS idx_vendor_purchases_vendor_id ON public.vendor_purchases(vendor_id);

-- ------------------------------------------------------------------------------
-- 8. VENDOR PAYMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendor_payments (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id TEXT,
    vendor_id TEXT NOT NULL,
    vendor_name TEXT,
    purchase_id TEXT,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    date TEXT NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vendor_payments_business_id ON public.vendor_payments(business_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_vendor_id ON public.vendor_payments(vendor_id);

-- ------------------------------------------------------------------------------
-- 9. INVOICES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_id TEXT,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    date TEXT NOT NULL,
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invoices_business_id ON public.invoices(business_id);

-- ------------------------------------------------------------------------------
-- 10. SALE RETURNS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sale_returns (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id TEXT,
    sale_id TEXT,
    invoice_number TEXT NOT NULL,
    customer_id TEXT,
    customer_name TEXT NOT NULL,
    date TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    refund_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    refund_method TEXT NOT NULL DEFAULT 'cash',
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sale_returns_business_id ON public.sale_returns(business_id);
CREATE INDEX IF NOT EXISTS idx_sale_returns_sale_id ON public.sale_returns(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_returns_date ON public.sale_returns(business_id, date);

-- ------------------------------------------------------------------------------
-- 11. STOCK MOVEMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id TEXT,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    type TEXT NOT NULL,
    reason TEXT,
    date TEXT NOT NULL,
    related_invoice TEXT,
    related_purchase TEXT,
    stock_before INTEGER,
    stock_after INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_business_id ON public.stock_movements(business_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON public.stock_movements(business_id, date);

-- ------------------------------------------------------------------------------
-- 12. VENDOR RETURNS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendor_returns (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id TEXT,
    vendor_id TEXT NOT NULL,
    vendor_name TEXT NOT NULL,
    purchase_id TEXT,
    invoice_number TEXT,
    date TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vendor_returns_business_id ON public.vendor_returns(business_id);
CREATE INDEX IF NOT EXISTS idx_vendor_returns_vendor_id ON public.vendor_returns(vendor_id);

-- ------------------------------------------------------------------------------
-- 13. SETTINGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.settings (
    id SERIAL PRIMARY KEY,
    business_id TEXT REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id TEXT UNIQUE,
    shop_name TEXT NOT NULL DEFAULT 'SaleTrack Store',
    shop_phone TEXT,
    shop_address TEXT,
    currency TEXT NOT NULL DEFAULT '$',
    currency_code TEXT DEFAULT 'USD',
    currency_name TEXT DEFAULT 'US Dollar',
    allow_negative_stock BOOLEAN NOT NULL DEFAULT false,
    invoice_footer TEXT,
    auto_email_receipt BOOLEAN NOT NULL DEFAULT false,
    tax_enabled BOOLEAN DEFAULT false,
    tax_name TEXT DEFAULT 'Tax',
    tax_rate NUMERIC(6, 2) DEFAULT 0,
    receipt_type TEXT DEFAULT 'thermal',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS tax_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS tax_name TEXT DEFAULT 'Tax';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(6, 2) DEFAULT 0;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS receipt_type TEXT DEFAULT 'thermal';

CREATE INDEX IF NOT EXISTS idx_settings_business_id ON public.settings(business_id);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON public.settings(user_id);

-- ------------------------------------------------------------------------------
-- 11. ADMIN USERS TABLE (Role-Based Access for /admin Portal)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
    id SERIAL PRIMARY KEY,
    uid TEXT,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'super_admin',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed designated owner
INSERT INTO public.admin_users (email, name, role, is_active)
VALUES ('mudassirjee1000@gmail.com', 'SaleTrack Platform Owner', 'super_admin', true)
ON CONFLICT (email) DO UPDATE SET is_active = true, role = 'super_admin';

-- ------------------------------------------------------------------------------
-- 12. PROFILES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- ------------------------------------------------------------------------------
-- 13. SUBSCRIPTIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id TEXT PRIMARY KEY,
    business_id TEXT REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    business_name TEXT NOT NULL,
    owner_email TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'SaleTrack Pro — $4/month',
    amount NUMERIC(12, 2) NOT NULL DEFAULT 4.0,
    currency TEXT NOT NULL DEFAULT 'USD',
    interval TEXT NOT NULL DEFAULT 'month',
    status TEXT NOT NULL DEFAULT 'active',
    start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    current_period_end TIMESTAMP WITH TIME ZONE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    external_subscription_id TEXT,
    is_test BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_business_id ON public.subscriptions(business_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);

-- ------------------------------------------------------------------------------
-- 14. PAYMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY,
    business_id TEXT REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    business_name TEXT NOT NULL,
    owner_email TEXT NOT NULL,
    subscription_id TEXT,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 4.0,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'succeeded',
    provider TEXT NOT NULL DEFAULT 'Stripe',
    transaction_id TEXT NOT NULL,
    payment_method_type TEXT DEFAULT 'card',
    invoice_number TEXT,
    is_test BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_business_id ON public.payments(business_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);

-- ------------------------------------------------------------------------------
-- 15. LOGIN ACTIVITY TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.login_activity (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    business_name TEXT,
    status TEXT NOT NULL DEFAULT 'successful',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_login_activity_user_id ON public.login_activity(user_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) HELPER FUNCTIONS
-- ==============================================================================

-- Check if current authenticated user has administrative privileges
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  jwt_email TEXT;
  auth_uid TEXT;
BEGIN
  jwt_email := auth.jwt()->>'email';
  auth_uid := auth.uid()::text;

  IF jwt_email IS NULL AND auth_uid IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 1. Primary designated owner email check
  IF jwt_email IS NOT NULL AND lower(trim(jwt_email)) = 'mudassirjee1000@gmail.com' THEN
    RETURN TRUE;
  END IF;

  -- 2. Explicit admin_users table verification
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE is_active = true
      AND (
        (uid IS NOT NULL AND uid = auth_uid)
        OR (jwt_email IS NOT NULL AND lower(email) = lower(trim(jwt_email)))
      )
  );
END;
$$;

-- Check if current user is authorized to access a given business ID
CREATE OR REPLACE FUNCTION public.can_access_business(bid TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  current_user_id TEXT;
BEGIN
  -- Strict input validation: deny if null, empty, or unauthenticated
  IF bid IS NULL OR trim(bid) = '' THEN
    RETURN FALSE;
  END IF;

  current_user_id := auth.uid()::text;
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Admin bypass
  IF public.is_admin() THEN
    RETURN TRUE;
  END IF;

  -- Verify direct business ownership / membership
  RETURN EXISTS (
    SELECT 1 FROM public.businesses
    WHERE id = trim(bid)
      AND (
        owner_user_id = current_user_id
        OR (user_id IS NOT NULL AND user_id = current_user_id)
      )
  );
END;
$$;

-- ==============================================================================
-- MULTI-TENANT INTEGRITY & IMMUTABILITY TRIGGERS
-- ==============================================================================

-- Trigger Function: Prevent business_id changes (guarantees records can never be moved across tenants)
CREATE OR REPLACE FUNCTION public.prevent_business_id_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF OLD.business_id IS NOT NULL AND NEW.business_id IS DISTINCT FROM OLD.business_id THEN
        RAISE EXCEPTION 'Multi-tenant security violation: business_id is immutable and cannot be transferred to another business (old: %, new: %)', OLD.business_id, NEW.business_id;
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger Function: Prevent tampering with business ownership or primary key
CREATE OR REPLACE FUNCTION public.prevent_business_owner_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        IF OLD.id IS NOT NULL AND NEW.id IS DISTINCT FROM OLD.id THEN
            RAISE EXCEPTION 'Multi-tenant security violation: Business id is immutable.';
        END IF;
        IF OLD.owner_user_id IS NOT NULL AND NEW.owner_user_id IS DISTINCT FROM OLD.owner_user_id THEN
            RAISE EXCEPTION 'Multi-tenant security violation: Business ownership is immutable and cannot be transferred.';
        END IF;
        IF OLD.user_id IS NOT NULL AND NEW.user_id IS DISTINCT FROM OLD.user_id THEN
            RAISE EXCEPTION 'Multi-tenant security violation: Business user identity is immutable.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger Function: Validate cross-table relationships to ensure all related entities belong to the same business
CREATE OR REPLACE FUNCTION public.validate_tenant_references()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Validate customer_id belongs to the exact same business
    IF TG_TABLE_NAME IN ('sales', 'sale_returns', 'invoices') AND NEW.customer_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.customers
            WHERE id = NEW.customer_id AND business_id = NEW.business_id
        ) THEN
            RAISE EXCEPTION 'Multi-tenant integrity violation on %: Customer (%) does not belong to business (%)', TG_TABLE_NAME, NEW.customer_id, NEW.business_id;
        END IF;
    END IF;

    -- 2. Validate product_id belongs to the exact same business (stock_movements)
    IF TG_TABLE_NAME = 'stock_movements' AND NEW.product_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.products
            WHERE id = NEW.product_id AND business_id = NEW.business_id
        ) THEN
            RAISE EXCEPTION 'Multi-tenant integrity violation on stock_movements: Product (%) does not belong to business (%)', NEW.product_id, NEW.business_id;
        END IF;
    END IF;

    -- 3. Validate sale_id belongs to the exact same business (sale_returns)
    IF TG_TABLE_NAME = 'sale_returns' AND NEW.sale_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.sales
            WHERE id = NEW.sale_id AND business_id = NEW.business_id
        ) THEN
            RAISE EXCEPTION 'Multi-tenant integrity violation on sale_returns: Sale (%) does not belong to business (%)', NEW.sale_id, NEW.business_id;
        END IF;
    END IF;

    -- 4. Validate vendor_id belongs to the exact same business
    IF TG_TABLE_NAME IN ('vendor_purchases', 'vendor_payments', 'vendor_returns') AND NEW.vendor_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.vendors
            WHERE id = NEW.vendor_id AND business_id = NEW.business_id
        ) THEN
            RAISE EXCEPTION 'Multi-tenant integrity violation on %: Vendor (%) does not belong to business (%)', TG_TABLE_NAME, NEW.vendor_id, NEW.business_id;
        END IF;
    END IF;

    -- 5. Validate purchase_id belongs to the exact same business
    IF TG_TABLE_NAME IN ('vendor_payments', 'vendor_returns') AND NEW.purchase_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.vendor_purchases
            WHERE id = NEW.purchase_id AND business_id = NEW.business_id
        ) THEN
            RAISE EXCEPTION 'Multi-tenant integrity violation on %: Vendor Purchase (%) does not belong to business (%)', TG_TABLE_NAME, NEW.purchase_id, NEW.business_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Attach Immutability & Relational Triggers
DROP TRIGGER IF EXISTS trg_prevent_business_owner_tampering ON public.businesses;
CREATE TRIGGER trg_prevent_business_owner_tampering
BEFORE UPDATE ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.prevent_business_owner_tampering();

DROP TRIGGER IF EXISTS trg_prevent_business_id_products ON public.products;
CREATE TRIGGER trg_prevent_business_id_products
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.prevent_business_id_change();

DROP TRIGGER IF EXISTS trg_prevent_business_id_customers ON public.customers;
CREATE TRIGGER trg_prevent_business_id_customers
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.prevent_business_id_change();

DROP TRIGGER IF EXISTS trg_prevent_business_id_sales ON public.sales;
CREATE TRIGGER trg_prevent_business_id_sales
BEFORE UPDATE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.prevent_business_id_change();

DROP TRIGGER IF EXISTS trg_prevent_business_id_expenses ON public.expenses;
CREATE TRIGGER trg_prevent_business_id_expenses
BEFORE UPDATE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.prevent_business_id_change();

DROP TRIGGER IF EXISTS trg_prevent_business_id_vendors ON public.vendors;
CREATE TRIGGER trg_prevent_business_id_vendors
BEFORE UPDATE ON public.vendors
FOR EACH ROW
EXECUTE FUNCTION public.prevent_business_id_change();

DROP TRIGGER IF EXISTS trg_prevent_business_id_vendor_purchases ON public.vendor_purchases;
CREATE TRIGGER trg_prevent_business_id_vendor_purchases
BEFORE UPDATE ON public.vendor_purchases
FOR EACH ROW
EXECUTE FUNCTION public.prevent_business_id_change();

DROP TRIGGER IF EXISTS trg_prevent_business_id_vendor_payments ON public.vendor_payments;
CREATE TRIGGER trg_prevent_business_id_vendor_payments
BEFORE UPDATE ON public.vendor_payments
FOR EACH ROW
EXECUTE FUNCTION public.prevent_business_id_change();

DROP TRIGGER IF EXISTS trg_prevent_business_id_sale_returns ON public.sale_returns;
CREATE TRIGGER trg_prevent_business_id_sale_returns
BEFORE UPDATE ON public.sale_returns
FOR EACH ROW
EXECUTE FUNCTION public.prevent_business_id_change();

DROP TRIGGER IF EXISTS trg_prevent_business_id_stock_movements ON public.stock_movements;
CREATE TRIGGER trg_prevent_business_id_stock_movements
BEFORE UPDATE ON public.stock_movements
FOR EACH ROW
EXECUTE FUNCTION public.prevent_business_id_change();

DROP TRIGGER IF EXISTS trg_prevent_business_id_vendor_returns ON public.vendor_returns;
CREATE TRIGGER trg_prevent_business_id_vendor_returns
BEFORE UPDATE ON public.vendor_returns
FOR EACH ROW
EXECUTE FUNCTION public.prevent_business_id_change();

DROP TRIGGER IF EXISTS trg_prevent_business_id_invoices ON public.invoices;
CREATE TRIGGER trg_prevent_business_id_invoices
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.prevent_business_id_change();

DROP TRIGGER IF EXISTS trg_prevent_business_id_settings ON public.settings;
CREATE TRIGGER trg_prevent_business_id_settings
BEFORE UPDATE ON public.settings
FOR EACH ROW
EXECUTE FUNCTION public.prevent_business_id_change();

DROP TRIGGER IF EXISTS trg_prevent_business_id_subscriptions ON public.subscriptions;
CREATE TRIGGER trg_prevent_business_id_subscriptions
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.prevent_business_id_change();

DROP TRIGGER IF EXISTS trg_prevent_business_id_payments ON public.payments;
CREATE TRIGGER trg_prevent_business_id_payments
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.prevent_business_id_change();

-- Attach Cross-Table Relational Tenant Validation Triggers
DROP TRIGGER IF EXISTS trg_validate_tenant_sales ON public.sales;
CREATE TRIGGER trg_validate_tenant_sales
BEFORE INSERT OR UPDATE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.validate_tenant_references();

DROP TRIGGER IF EXISTS trg_validate_tenant_sale_returns ON public.sale_returns;
CREATE TRIGGER trg_validate_tenant_sale_returns
BEFORE INSERT OR UPDATE ON public.sale_returns
FOR EACH ROW
EXECUTE FUNCTION public.validate_tenant_references();

DROP TRIGGER IF EXISTS trg_validate_tenant_stock_movements ON public.stock_movements;
CREATE TRIGGER trg_validate_tenant_stock_movements
BEFORE INSERT OR UPDATE ON public.stock_movements
FOR EACH ROW
EXECUTE FUNCTION public.validate_tenant_references();

DROP TRIGGER IF EXISTS trg_validate_tenant_vendor_purchases ON public.vendor_purchases;
CREATE TRIGGER trg_validate_tenant_vendor_purchases
BEFORE INSERT OR UPDATE ON public.vendor_purchases
FOR EACH ROW
EXECUTE FUNCTION public.validate_tenant_references();

DROP TRIGGER IF EXISTS trg_validate_tenant_vendor_payments ON public.vendor_payments;
CREATE TRIGGER trg_validate_tenant_vendor_payments
BEFORE INSERT OR UPDATE ON public.vendor_payments
FOR EACH ROW
EXECUTE FUNCTION public.validate_tenant_references();

DROP TRIGGER IF EXISTS trg_validate_tenant_vendor_returns ON public.vendor_returns;
CREATE TRIGGER trg_validate_tenant_vendor_returns
BEFORE INSERT OR UPDATE ON public.vendor_returns
FOR EACH ROW
EXECUTE FUNCTION public.validate_tenant_references();

DROP TRIGGER IF EXISTS trg_validate_tenant_invoices ON public.invoices;
CREATE TRIGGER trg_validate_tenant_invoices
BEFORE INSERT OR UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.validate_tenant_references();

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ==============================================================================

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- EXPLICIT ROW LEVEL SECURITY POLICIES (SELECT, INSERT, UPDATE, DELETE)
-- ==============================================================================

-- 1. BUSINESSES POLICIES
DROP POLICY IF EXISTS "Users can read own business" ON public.businesses;
CREATE POLICY "Users can read own business"
    ON public.businesses FOR SELECT
    TO authenticated
    USING (
        owner_user_id = auth.uid()::text
        OR user_id = auth.uid()::text
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Users can create own business" ON public.businesses;
CREATE POLICY "Users can create own business"
    ON public.businesses FOR INSERT
    TO authenticated
    WITH CHECK (
        owner_user_id = auth.uid()::text
        OR user_id = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can update own business" ON public.businesses;
CREATE POLICY "Users can update own business"
    ON public.businesses FOR UPDATE
    TO authenticated
    USING (
        owner_user_id = auth.uid()::text
        OR user_id = auth.uid()::text
        OR public.is_admin()
    )
    WITH CHECK (
        owner_user_id = auth.uid()::text
        OR user_id = auth.uid()::text
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Users can delete own business" ON public.businesses;
CREATE POLICY "Users can delete own business"
    ON public.businesses FOR DELETE
    TO authenticated
    USING (
        owner_user_id = auth.uid()::text
        OR user_id = auth.uid()::text
        OR public.is_admin()
    );

-- 2. PRODUCTS POLICIES
DROP POLICY IF EXISTS "Users can access own products" ON public.products;
DROP POLICY IF EXISTS "Users can read own products" ON public.products;
DROP POLICY IF EXISTS "Users can insert own products" ON public.products;
DROP POLICY IF EXISTS "Users can update own products" ON public.products;
DROP POLICY IF EXISTS "Users can delete own products" ON public.products;

CREATE POLICY "Users can read own products"
    ON public.products FOR SELECT
    TO authenticated
    USING (public.can_access_business(business_id));

CREATE POLICY "Users can insert own products"
    ON public.products FOR INSERT
    TO authenticated
    WITH CHECK (public.can_access_business(business_id));

CREATE POLICY "Users can update own products"
    ON public.products FOR UPDATE
    TO authenticated
    USING (public.can_access_business(business_id))
    WITH CHECK (public.can_access_business(business_id));

CREATE POLICY "Users can delete own products"
    ON public.products FOR DELETE
    TO authenticated
    USING (public.can_access_business(business_id));

-- 3. CUSTOMERS POLICIES
DROP POLICY IF EXISTS "Users can access own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can read own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can insert own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can delete own customers" ON public.customers;

CREATE POLICY "Users can read own customers"
    ON public.customers FOR SELECT
    TO authenticated
    USING (public.can_access_business(business_id));

CREATE POLICY "Users can insert own customers"
    ON public.customers FOR INSERT
    TO authenticated
    WITH CHECK (public.can_access_business(business_id));

CREATE POLICY "Users can update own customers"
    ON public.customers FOR UPDATE
    TO authenticated
    USING (public.can_access_business(business_id))
    WITH CHECK (public.can_access_business(business_id));

CREATE POLICY "Users can delete own customers"
    ON public.customers FOR DELETE
    TO authenticated
    USING (public.can_access_business(business_id));

-- 4. SALES POLICIES
DROP POLICY IF EXISTS "Users can access own sales" ON public.sales;
DROP POLICY IF EXISTS "Users can read own sales" ON public.sales;
DROP POLICY IF EXISTS "Users can insert own sales" ON public.sales;
DROP POLICY IF EXISTS "Users can update own sales" ON public.sales;
DROP POLICY IF EXISTS "Users can delete own sales" ON public.sales;

CREATE POLICY "Users can read own sales"
    ON public.sales FOR SELECT
    TO authenticated
    USING (public.can_access_business(business_id));

CREATE POLICY "Users can insert own sales"
    ON public.sales FOR INSERT
    TO authenticated
    WITH CHECK (public.can_access_business(business_id));

CREATE POLICY "Users can update own sales"
    ON public.sales FOR UPDATE
    TO authenticated
    USING (public.can_access_business(business_id))
    WITH CHECK (public.can_access_business(business_id));

CREATE POLICY "Users can delete own sales"
    ON public.sales FOR DELETE
    TO authenticated
    USING (public.can_access_business(business_id));

-- 5. EXPENSES POLICIES
DROP POLICY IF EXISTS "Users can access own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can read own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;

CREATE POLICY "Users can read own expenses"
    ON public.expenses FOR SELECT
    TO authenticated
    USING (public.can_access_business(business_id));

CREATE POLICY "Users can insert own expenses"
    ON public.expenses FOR INSERT
    TO authenticated
    WITH CHECK (public.can_access_business(business_id));

CREATE POLICY "Users can update own expenses"
    ON public.expenses FOR UPDATE
    TO authenticated
    USING (public.can_access_business(business_id))
    WITH CHECK (public.can_access_business(business_id));

CREATE POLICY "Users can delete own expenses"
    ON public.expenses FOR DELETE
    TO authenticated
    USING (public.can_access_business(business_id));

-- 6. VENDORS POLICIES
DROP POLICY IF EXISTS "Users can access own vendors" ON public.vendors;
DROP POLICY IF EXISTS "Users can read own vendors" ON public.vendors;
DROP POLICY IF EXISTS "Users can insert own vendors" ON public.vendors;
DROP POLICY IF EXISTS "Users can update own vendors" ON public.vendors;
DROP POLICY IF EXISTS "Users can delete own vendors" ON public.vendors;

CREATE POLICY "Users can read own vendors"
    ON public.vendors FOR SELECT
    TO authenticated
    USING (public.can_access_business(business_id));

CREATE POLICY "Users can insert own vendors"
    ON public.vendors FOR INSERT
    TO authenticated
    WITH CHECK (public.can_access_business(business_id));

CREATE POLICY "Users can update own vendors"
    ON public.vendors FOR UPDATE
    TO authenticated
    USING (public.can_access_business(business_id))
    WITH CHECK (public.can_access_business(business_id));

CREATE POLICY "Users can delete own vendors"
    ON public.vendors FOR DELETE
    TO authenticated
    USING (public.can_access_business(business_id));

-- 7. VENDOR PURCHASES POLICIES
DROP POLICY IF EXISTS "Users can access own vendor purchases" ON public.vendor_purchases;
DROP POLICY IF EXISTS "Users can read own vendor purchases" ON public.vendor_purchases;
DROP POLICY IF EXISTS "Users can insert own vendor purchases" ON public.vendor_purchases;
DROP POLICY IF EXISTS "Users can update own vendor purchases" ON public.vendor_purchases;
DROP POLICY IF EXISTS "Users can delete own vendor purchases" ON public.vendor_purchases;

CREATE POLICY "Users can read own vendor purchases"
    ON public.vendor_purchases FOR SELECT
    TO authenticated
    USING (public.can_access_business(business_id));

CREATE POLICY "Users can insert own vendor purchases"
    ON public.vendor_purchases FOR INSERT
    TO authenticated
    WITH CHECK (public.can_access_business(business_id));

CREATE POLICY "Users can update own vendor purchases"
    ON public.vendor_purchases FOR UPDATE
    TO authenticated
    USING (public.can_access_business(business_id))
    WITH CHECK (public.can_access_business(business_id));

CREATE POLICY "Users can delete own vendor purchases"
    ON public.vendor_purchases FOR DELETE
    TO authenticated
    USING (public.can_access_business(business_id));

-- 8. VENDOR PAYMENTS POLICIES
DROP POLICY IF EXISTS "Users can access own vendor payments" ON public.vendor_payments;
DROP POLICY IF EXISTS "Users can read own vendor payments" ON public.vendor_payments;
DROP POLICY IF EXISTS "Users can insert own vendor payments" ON public.vendor_payments;
DROP POLICY IF EXISTS "Users can update own vendor payments" ON public.vendor_payments;
DROP POLICY IF EXISTS "Users can delete own vendor payments" ON public.vendor_payments;

CREATE POLICY "Users can read own vendor payments"
    ON public.vendor_payments FOR SELECT
    TO authenticated
    USING (public.can_access_business(business_id));

CREATE POLICY "Users can insert own vendor payments"
    ON public.vendor_payments FOR INSERT
    TO authenticated
    WITH CHECK (public.can_access_business(business_id));

CREATE POLICY "Users can update own vendor payments"
    ON public.vendor_payments FOR UPDATE
    TO authenticated
    USING (public.can_access_business(business_id))
    WITH CHECK (public.can_access_business(business_id));

CREATE POLICY "Users can delete own vendor payments"
    ON public.vendor_payments FOR DELETE
    TO authenticated
    USING (public.can_access_business(business_id));

-- 9. SALE RETURNS POLICIES
DROP POLICY IF EXISTS "Users can access own sale returns" ON public.sale_returns;
DROP POLICY IF EXISTS "Users can read own sale returns" ON public.sale_returns;
DROP POLICY IF EXISTS "Users can insert own sale returns" ON public.sale_returns;
DROP POLICY IF EXISTS "Users can update own sale returns" ON public.sale_returns;
DROP POLICY IF EXISTS "Users can delete own sale returns" ON public.sale_returns;

CREATE POLICY "Users can read own sale returns"
    ON public.sale_returns FOR SELECT
    TO authenticated
    USING (public.can_access_business(business_id));

CREATE POLICY "Users can insert own sale returns"
    ON public.sale_returns FOR INSERT
    TO authenticated
    WITH CHECK (public.can_access_business(business_id));

CREATE POLICY "Users can update own sale returns"
    ON public.sale_returns FOR UPDATE
    TO authenticated
    USING (public.can_access_business(business_id))
    WITH CHECK (public.can_access_business(business_id));

CREATE POLICY "Users can delete own sale returns"
    ON public.sale_returns FOR DELETE
    TO authenticated
    USING (public.can_access_business(business_id));

-- 10. STOCK MOVEMENTS POLICIES
DROP POLICY IF EXISTS "Users can access own stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Users can read own stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Users can insert own stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Users can update own stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Users can delete own stock movements" ON public.stock_movements;

CREATE POLICY "Users can read own stock movements"
    ON public.stock_movements FOR SELECT
    TO authenticated
    USING (public.can_access_business(business_id));

CREATE POLICY "Users can insert own stock movements"
    ON public.stock_movements FOR INSERT
    TO authenticated
    WITH CHECK (public.can_access_business(business_id));

CREATE POLICY "Users can update own stock movements"
    ON public.stock_movements FOR UPDATE
    TO authenticated
    USING (public.can_access_business(business_id))
    WITH CHECK (public.can_access_business(business_id));

CREATE POLICY "Users can delete own stock movements"
    ON public.stock_movements FOR DELETE
    TO authenticated
    USING (public.can_access_business(business_id));

-- 11. VENDOR RETURNS POLICIES
DROP POLICY IF EXISTS "Users can access own vendor returns" ON public.vendor_returns;
DROP POLICY IF EXISTS "Users can read own vendor returns" ON public.vendor_returns;
DROP POLICY IF EXISTS "Users can insert own vendor returns" ON public.vendor_returns;
DROP POLICY IF EXISTS "Users can update own vendor returns" ON public.vendor_returns;
DROP POLICY IF EXISTS "Users can delete own vendor returns" ON public.vendor_returns;

CREATE POLICY "Users can read own vendor returns"
    ON public.vendor_returns FOR SELECT
    TO authenticated
    USING (public.can_access_business(business_id));

CREATE POLICY "Users can insert own vendor returns"
    ON public.vendor_returns FOR INSERT
    TO authenticated
    WITH CHECK (public.can_access_business(business_id));

CREATE POLICY "Users can update own vendor returns"
    ON public.vendor_returns FOR UPDATE
    TO authenticated
    USING (public.can_access_business(business_id))
    WITH CHECK (public.can_access_business(business_id));

CREATE POLICY "Users can delete own vendor returns"
    ON public.vendor_returns FOR DELETE
    TO authenticated
    USING (public.can_access_business(business_id));

-- 12. INVOICES POLICIES
DROP POLICY IF EXISTS "Users can access own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can read own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can insert own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete own invoices" ON public.invoices;

CREATE POLICY "Users can read own invoices"
    ON public.invoices FOR SELECT
    TO authenticated
    USING (public.can_access_business(business_id));

CREATE POLICY "Users can insert own invoices"
    ON public.invoices FOR INSERT
    TO authenticated
    WITH CHECK (public.can_access_business(business_id));

CREATE POLICY "Users can update own invoices"
    ON public.invoices FOR UPDATE
    TO authenticated
    USING (public.can_access_business(business_id))
    WITH CHECK (public.can_access_business(business_id));

CREATE POLICY "Users can delete own invoices"
    ON public.invoices FOR DELETE
    TO authenticated
    USING (public.can_access_business(business_id));

-- 13. SETTINGS POLICIES (Strictly tenant isolated; no user_id bypass)
DROP POLICY IF EXISTS "Users can access own settings" ON public.settings;
DROP POLICY IF EXISTS "Users can read own settings" ON public.settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.settings;
DROP POLICY IF EXISTS "Users can delete own settings" ON public.settings;

CREATE POLICY "Users can read own settings"
    ON public.settings FOR SELECT
    TO authenticated
    USING (business_id IS NOT NULL AND public.can_access_business(business_id));

CREATE POLICY "Users can insert own settings"
    ON public.settings FOR INSERT
    TO authenticated
    WITH CHECK (business_id IS NOT NULL AND public.can_access_business(business_id));

CREATE POLICY "Users can update own settings"
    ON public.settings FOR UPDATE
    TO authenticated
    USING (business_id IS NOT NULL AND public.can_access_business(business_id))
    WITH CHECK (business_id IS NOT NULL AND public.can_access_business(business_id));

CREATE POLICY "Users can delete own settings"
    ON public.settings FOR DELETE
    TO authenticated
    USING (business_id IS NOT NULL AND public.can_access_business(business_id));

-- 14. ADMIN USERS POLICIES
DROP POLICY IF EXISTS "Admins can view and manage admin list" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can read admin list" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can insert admin list" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can update admin list" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can delete admin list" ON public.admin_users;

CREATE POLICY "Admins can read admin list"
    ON public.admin_users FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Admins can insert admin list"
    ON public.admin_users FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update admin list"
    ON public.admin_users FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete admin list"
    ON public.admin_users FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- 15. PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view and edit own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid()::text OR public.is_admin());

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid()::text OR public.is_admin());

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid()::text OR public.is_admin())
    WITH CHECK (user_id = auth.uid()::text OR public.is_admin());

CREATE POLICY "Users can delete own profile"
    ON public.profiles FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- 16. SUBSCRIPTIONS POLICIES
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can delete subscriptions" ON public.subscriptions;

CREATE POLICY "Users can view own subscriptions"
    ON public.subscriptions FOR SELECT
    TO authenticated
    USING (
        (business_id IS NOT NULL AND public.can_access_business(business_id))
        OR public.is_admin()
    );

CREATE POLICY "Users can insert subscriptions"
    ON public.subscriptions FOR INSERT
    TO authenticated
    WITH CHECK (
        (business_id IS NOT NULL AND public.can_access_business(business_id))
        OR public.is_admin()
    );

CREATE POLICY "Users can update subscriptions"
    ON public.subscriptions FOR UPDATE
    TO authenticated
    USING (
        (business_id IS NOT NULL AND public.can_access_business(business_id))
        OR public.is_admin()
    )
    WITH CHECK (
        (business_id IS NOT NULL AND public.can_access_business(business_id))
        OR public.is_admin()
    );

CREATE POLICY "Users can delete subscriptions"
    ON public.subscriptions FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- 17. PAYMENTS POLICIES
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update payments" ON public.payments;
DROP POLICY IF EXISTS "Users can delete payments" ON public.payments;

CREATE POLICY "Users can view own payments"
    ON public.payments FOR SELECT
    TO authenticated
    USING (
        (business_id IS NOT NULL AND public.can_access_business(business_id))
        OR public.is_admin()
    );

CREATE POLICY "Users can insert payments"
    ON public.payments FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "Users can update payments"
    ON public.payments FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Users can delete payments"
    ON public.payments FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- 18. LOGIN ACTIVITY POLICIES
DROP POLICY IF EXISTS "Users can view own login activity" ON public.login_activity;
DROP POLICY IF EXISTS "Allow logging login activity" ON public.login_activity;
DROP POLICY IF EXISTS "Users can update login activity" ON public.login_activity;
DROP POLICY IF EXISTS "Users can delete login activity" ON public.login_activity;

CREATE POLICY "Users can view own login activity"
    ON public.login_activity FOR SELECT
    TO authenticated
    USING (user_id = auth.uid()::text OR public.is_admin());

CREATE POLICY "Allow logging login activity"
    ON public.login_activity FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid()::text OR public.is_admin());

CREATE POLICY "Users can update login activity"
    ON public.login_activity FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Users can delete login activity"
    ON public.login_activity FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ==============================================================================
-- GRANTS & PERMISSIONS
-- ==============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated, service_role;

-- Notify PostgREST to immediately reload schema cache
NOTIFY pgrst, 'reload schema';
