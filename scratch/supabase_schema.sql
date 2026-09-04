-- ============================================================================
-- TURNING POINT RETAIL SOLUTIONS - SUPABASE POSTGRESQL DATABASE SCHEMAS
-- Execute this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  client_name TEXT,
  sector TEXT,
  project_owner TEXT,
  assigned_to TEXT,
  contract_value NUMERIC(12,2) DEFAULT 0.00,
  deposit_paid NUMERIC(12,2) DEFAULT 0.00,
  start_date DATE,
  completion_pct INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Pending CEO Approval',
  priority TEXT DEFAULT 'High',
  status_update TEXT,
  drive_link TEXT,
  next_action TEXT,
  next_action_due DATE,
  financials JSONB DEFAULT '{}'::jsonb,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Petty Cash Transactions Table
CREATE TABLE IF NOT EXISTS public.petty_cash_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month_tag TEXT NOT NULL, -- 'PETTY_CASH_JULY', 'PETTY_CASH_AUG', 'PETTY_CASH_SEPT'
  date DATE NOT NULL,
  description TEXT NOT NULL,
  invoice_number TEXT,
  category TEXT DEFAULT 'General',
  payment_method TEXT DEFAULT 'Card/Online',
  paid_by TEXT DEFAULT 'Admin Manager',
  cash_in NUMERIC(10,2) DEFAULT 0.00,
  cash_out NUMERIC(10,2) DEFAULT 0.00,
  card_spent NUMERIC(10,2) DEFAULT 0.00,
  is_deleted BOOLEAN DEFAULT false,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Friday Executive Weekly Reports Table
CREATE TABLE IF NOT EXISTS public.friday_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_name TEXT NOT NULL,
  role_designation TEXT NOT NULL,
  week_ending TEXT NOT NULL,
  user_email TEXT NOT NULL,
  department TEXT DEFAULT 'CEO Walter Dantis',
  key_achievements TEXT,
  top_priority_next_week TEXT,
  support_needed_from_ceo TEXT,
  blockers_or_risks TEXT,
  additional_notes TEXT,
  tasks JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'Submitted to CEO',
  ceo_verified BOOLEAN DEFAULT false,
  ceo_feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. CEO P&L Tracker Table
CREATE TABLE IF NOT EXISTS public.pnl_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month TEXT UNIQUE NOT NULL,
  revenue NUMERIC(12,2) DEFAULT 0.00,
  cost_of_sales NUMERIC(12,2) DEFAULT 0.00,
  operating_expenses NUMERIC(12,2) DEFAULT 0.00,
  net_profit NUMERIC(12,2) DEFAULT 0.00,
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Team Real-Time Chat Table
CREATE TABLE IF NOT EXISTS public.team_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  sender_role TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Enable Supabase Realtime WebSockets for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.petty_cash_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friday_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pnl_tracker;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_messages;

-- 8. Disable RLS or set permissive public access for instant operation
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.petty_cash_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.friday_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pnl_tracker DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_messages DISABLE ROW LEVEL SECURITY;

SELECT 'Turning Point Supabase Schema & Realtime Setup Successfully Executed!' AS result;
