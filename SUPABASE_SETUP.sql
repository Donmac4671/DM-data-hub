-- ==============================================================================
-- DONMAC DATA HUB GHANA - COMPLETE SUPABASE RESET & SCHEMA SCRIPT
-- Copy and paste this script into your Supabase SQL Editor (https://app.supabase.com)
-- and click 'RUN' to reset and initialize all tables, columns, and permissions.
-- ==============================================================================

-- 1. DROP EXISTING TABLES & RESET SCHEMA CLEANLY
DROP TABLE IF EXISTS public.sms_webhooks CASCADE;
DROP TABLE IF EXISTS public.payment_claims CASCADE;
DROP TABLE IF EXISTS public.complaints CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.wallet_transactions CASCADE;
DROP TABLE IF EXISTS public.pending_topups CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.data_packages CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. ENABLE UUID EXTENSION
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. CREATE PROFILES TABLE
CREATE TABLE public.profiles (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone_number TEXT NOT NULL DEFAULT '',
  password_hash TEXT DEFAULT '',
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  wallet_balance DECIMAL(12, 2) DEFAULT 0.00,
  momo_number TEXT DEFAULT '',
  total_spent DECIMAL(12, 2) DEFAULT 0.00,
  orders_count INT DEFAULT 0,
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATE DATA PACKAGES CATALOG TABLE
CREATE TABLE public.data_packages (
  id TEXT PRIMARY KEY,
  network TEXT NOT NULL,
  name TEXT NOT NULL,
  data_amount TEXT NOT NULL,
  validity TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'online',
  sort_order INT DEFAULT 0,
  popular BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CREATE PENDING TOP-UP REQUESTS TABLE
CREATE TABLE public.pending_topups (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT DEFAULT '',
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  reference_code TEXT UNIQUE NOT NULL, -- e.g. DMH-849201
  amount DECIMAL(10, 2) NOT NULL,
  momo_number_to_pay TEXT DEFAULT '0549358359', -- Merchant Number: Osei Michael
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CREATE WALLET TRANSACTIONS TABLE
CREATE TABLE public.wallet_transactions (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT DEFAULT '',
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  reference_code TEXT DEFAULT '',
  momo_txn_id TEXT DEFAULT '',
  balance_after DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CREATE ORDERS TABLE
CREATE TABLE public.orders (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  order_number TEXT UNIQUE NOT NULL,
  user_id TEXT DEFAULT '',
  user_email TEXT NOT NULL,
  user_name TEXT DEFAULT '',
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending',
  recipient_phone TEXT NOT NULL DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  failure_reason TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 8. CREATE SMS WEBHOOKS TABLE
CREATE TABLE public.sms_webhooks (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  momo_txn_id TEXT UNIQUE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  network TEXT NOT NULL,
  status TEXT DEFAULT 'unclaimed',
  claimed_by TEXT DEFAULT '-',
  reference_code TEXT DEFAULT '',
  raw_sms TEXT DEFAULT '',
  sender_phone TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CREATE PAYMENT CLAIMS TABLE
CREATE TABLE public.payment_claims (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT DEFAULT '',
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  momo_txn_id TEXT NOT NULL,
  momo_number TEXT NOT NULL,
  amount DECIMAL(10, 2) DEFAULT 0.00,
  screenshot_url TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  admin_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CREATE ANNOUNCEMENTS TABLE
CREATE TABLE public.announcements (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. CREATE COMPLAINTS TABLE
CREATE TABLE public.complaints (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT DEFAULT '',
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  order_number TEXT DEFAULT '',
  momo_txn_id TEXT DEFAULT '',
  status TEXT DEFAULT 'open',
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. GRANT ALL PERMISSIONS TO ANON AND AUTHENTICATED ROLES
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;

-- 12. DISABLE RLS FOR DIRECT API ACCESS (Prevents missing permission errors)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_topups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_webhooks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_claims DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints DISABLE ROW LEVEL SECURITY;

-- 13. SEED DEFAULT ADMIN USER
INSERT INTO public.profiles (id, full_name, email, phone_number, password_hash, role, wallet_balance, momo_number)
VALUES (
  'admin-default-001',
  'Donmac Data Hub Admin',
  'donmacdatahub@gmail.com',
  '0549358359',
  'admin123',
  'admin',
  1000.00,
  '0549358359'
) ON CONFLICT (email) DO UPDATE SET role = 'admin';

-- 14. SEED INITIAL DATA PACKAGES
INSERT INTO public.data_packages (id, network, name, data_amount, validity, price, status, sort_order, popular) VALUES
('mtn-1gb', 'mtn', 'MTN 1GB Data', '1 GB', '90 Days', 4.50, 'online', 1, true),
('mtn-2gb', 'mtn', 'MTN 2GB Data', '2 GB', '90 Days', 8.80, 'online', 2, false),
('mtn-3gb', 'mtn', 'MTN 3GB Data', '3 GB', '90 Days', 12.90, 'online', 3, false),
('mtn-5gb', 'mtn', 'MTN 5GB Data', '5 GB', '90 Days', 21.50, 'online', 5, true),
('mtn-10gb', 'mtn', 'MTN 10GB Data', '10 GB', '90 Days', 42.00, 'online', 9, true),
('tel-5gb', 'telecel', 'Telecel 5GB Data', '5 GB', '60 Days', 22.00, 'online', 1, true),
('tel-10gb', 'telecel', 'Telecel 10GB Data', '10 GB', '60 Days', 41.00, 'online', 2, true),
('at-ishare-1gb', 'airteltigo_ishare', 'AT iShare 1GB', '1 GB', '60 Days', 4.00, 'online', 1, true),
('at-ishare-5gb', 'airteltigo_ishare', 'AT iShare 5GB', '5 GB', '60 Days', 20.10, 'online', 5, true),
('at-bt-50gb', 'airteltigo_bigtime', 'AT Big Time 50GB', '5 GB', 'Non-Expiry', 94.00, 'online', 5, true)
ON CONFLICT (id) DO NOTHING;
