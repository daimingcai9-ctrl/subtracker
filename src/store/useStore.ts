import { create } from 'zustand';
import type { Subscription } from '../types';
import { mockSubscriptions } from './mockData';
import { supabase } from '../lib/supabase';

const isSupabaseConfigured = !!import.meta.env.VITE_SUPABASE_URL;

// User code management
function getUserCode(): string | null {
  return localStorage.getItem('subtracker-user-code');
}

export function setUserCode(code: string) {
  localStorage.setItem('subtracker-user-code', code);
}

export function generateUserCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

interface StoreState {
  userCode: string | null;
  subscriptions: Subscription[];
  loading: boolean;
  init: () => void;
  fetchSubscriptions: () => Promise<void>;
  addSubscription: (sub: Omit<Subscription, 'id' | 'createdAt'>) => Promise<void>;
  updateSubscription: (id: string, data: Partial<Subscription>) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
  toggleActive: (id: string) => Promise<void>;
}

// Supabase row <-> App type mapping
function rowToSub(row: any): Subscription {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    iconColor: row.icon_color,
    amount: Number(row.amount),
    currency: row.currency,
    billingDay: row.billing_day,
    billingCycle: row.billing_cycle,
    yearlyMonthDay: row.yearly_month_day,
    category: row.category,
    autoRenew: row.auto_renew,
    isActive: row.is_active,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function subToRow(sub: Partial<Subscription>, userCode: string) {
  const row: Record<string, any> = { user_code: userCode };
  if (sub.name !== undefined) row.name = sub.name;
  if (sub.icon !== undefined) row.icon = sub.icon;
  if (sub.iconColor !== undefined) row.icon_color = sub.iconColor;
  if (sub.amount !== undefined) row.amount = sub.amount;
  if (sub.currency !== undefined) row.currency = sub.currency;
  if (sub.billingDay !== undefined) row.billing_day = sub.billingDay;
  if (sub.billingCycle !== undefined) row.billing_cycle = sub.billingCycle;
  if (sub.yearlyMonthDay !== undefined) row.yearly_month_day = sub.yearlyMonthDay;
  if (sub.category !== undefined) row.category = sub.category;
  if (sub.autoRenew !== undefined) row.auto_renew = sub.autoRenew;
  if (sub.isActive !== undefined) row.is_active = sub.isActive;
  if (sub.notes !== undefined) row.notes = sub.notes;
  return row;
}

// LocalStorage fallback
function loadLocal(code: string): Subscription[] {
  try {
    const saved = localStorage.getItem(`subtracker-subs-${code}`);
    return saved ? JSON.parse(saved) : mockSubscriptions;
  } catch {
    return mockSubscriptions;
  }
}

function saveLocal(code: string, subs: Subscription[]) {
  localStorage.setItem(`subtracker-subs-${code}`, JSON.stringify(subs));
}

export const useStore = create<StoreState>((set, get) => ({
  userCode: getUserCode(),
  subscriptions: [],
  loading: false,

  init: () => {
    const code = getUserCode();
    if (!code) {
      set({ userCode: null, subscriptions: [], loading: false });
      return;
    }
    set({ userCode: code });
    get().fetchSubscriptions();
  },

  fetchSubscriptions: async () => {
    const code = get().userCode;
    if (!code) return;

    if (isSupabaseConfigured) {
      set({ loading: true });
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_code', code)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Fetch error:', error);
        set({ loading: false });
        return;
      }
      set({ subscriptions: data.map(rowToSub), loading: false });
    } else {
      set({ subscriptions: loadLocal(code) });
    }
  },

  addSubscription: async (sub) => {
    const code = get().userCode;
    if (!code) return;
    const newSub = { ...sub, id: crypto.randomUUID(), createdAt: new Date().toISOString() };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert(subToRow(newSub, code))
        .select()
        .single();
      if (error) { console.error('Insert error:', error); return; }
      set((s) => ({ subscriptions: [rowToSub(data), ...s.subscriptions] }));
    } else {
      set((s) => {
        const next = [newSub, ...s.subscriptions];
        saveLocal(code, next);
        return { subscriptions: next };
      });
    }
  },

  updateSubscription: async (id, data) => {
    const code = get().userCode;
    if (!code) return;

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('subscriptions')
        .update(subToRow(data, code))
        .eq('id', id)
        .eq('user_code', code);
      if (error) { console.error('Update error:', error); return; }
    }
    set((s) => {
      const next = s.subscriptions.map((sub) => (sub.id === id ? { ...sub, ...data } : sub));
      if (!isSupabaseConfigured) saveLocal(code, next);
      return { subscriptions: next };
    });
  },

  deleteSubscription: async (id) => {
    const code = get().userCode;
    if (!code) return;

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id)
        .eq('user_code', code);
      if (error) { console.error('Delete error:', error); return; }
    }
    set((s) => {
      const next = s.subscriptions.filter((sub) => sub.id !== id);
      if (!isSupabaseConfigured) saveLocal(code, next);
      return { subscriptions: next };
    });
  },

  toggleActive: async (id) => {
    const sub = get().subscriptions.find((s) => s.id === id);
    if (!sub) return;
    await get().updateSubscription(id, { isActive: !sub.isActive });
  },
}));
