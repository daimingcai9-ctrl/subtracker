-- SubTracker 数据库 Schema
-- 在 Supabase SQL Editor 中执行此脚本

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'package',
  icon_color TEXT,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CNY',
  billing_day INTEGER NOT NULL CHECK (billing_day >= 1 AND billing_day <= 31),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly', 'quarterly')),
  yearly_month_day TEXT,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('telecom', 'entertainment', 'tool', 'cloud', 'other')),
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 按创建时间排序的索引
CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at ON subscriptions (created_at DESC);

-- 启用 Row Level Security（个人使用可选）
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 允许匿名访问（个人工具，不需要认证）
CREATE POLICY "Allow all access" ON subscriptions FOR ALL USING (true) WITH CHECK (true);
