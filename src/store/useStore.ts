import { create } from 'zustand';
import type { Subscription } from '../types';
import { mockSubscriptions } from './mockData';
import { supabase } from '../lib/supabase';

const isSupabaseConfigured = !!import.meta.env.VITE_SUPABASE_URL;

interface StoreState {
  subscriptions: Subscription[];
  loading: boolean;
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

function subToRow(sub: Partial<Subscription>) {
  const row: Record<string, any> = {};
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
function loadLocal(): Subscription[] {
  try {
    const saved = localStorage.getItem('subtracker-subscriptions');
    return saved ? JSON.parse(saved) : mockSubscriptions;
  } catch {
    return mockSubscriptions;
  }
}

function saveLocal(subs: Subscription[]) {
  localStorage.setItem('subtracker-subscriptions', JSON.stringify(subs));
}

export const useStore = create<StoreState>((set, get) => ({
  subscriptions: isSupabaseConfigured ? [] : loadLocal(),
  loading: isSupabaseConfigured,

  fetchSubscriptions: async () => {
    if (!isSupabaseConfigured) return;
    set({ loading: true });
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Fetch error:', error);
      set({ loading: false });
      return;
    }
    set({ subscriptions: data.map(rowToSub), loading: false });
  },

  addSubscription: async (sub) => {
    const newSub = { ...sub, id: crypto.randomUUID(), createdAt: new Date().toISOString() };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert(subToRow(newSub))
        .select()
        .single();
      if (error) { console.error('Insert error:', error); return; }
      set((s) => ({ subscriptions: [rowToSub(data), ...s.subscriptions] }));
    } else {
      set((s) => {
        const next = [newSub, ...s.subscriptions];
        saveLocal(next);
        return { subscriptions: next };
      });
    }
  },

  updateSubscription: async (id, data) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('subscriptions')
        .update(subToRow(data))
        .eq('id', id);
      if (error) { console.error('Update error:', error); return; }
    }
    set((s) => {
      const next = s.subscriptions.map((sub) => (sub.id === id ? { ...sub, ...data } : sub));
      if (!isSupabaseConfigured) saveLocal(next);
      return { subscriptions: next };
    });
  },

  deleteSubscription: async (id) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('subscriptions').delete().eq('id', id);
      if (error) { console.error('Delete error:', error); return; }
    }
    set((s) => {
      const next = s.subscriptions.filter((sub) => sub.id !== id);
      if (!isSupabaseConfigured) saveLocal(next);
      return { subscriptions: next };
    });
  },

  toggleActive: async (id) => {
    const sub = get().subscriptions.find((s) => s.id === id);
    if (!sub) return;
    await get().updateSubscription(id, { isActive: !sub.isActive });
  },
}));
