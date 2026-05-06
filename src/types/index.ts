export interface Subscription {
  id: string;
  name: string;
  icon: string;
  iconColor?: string;
  amount: number;
  currency: string;
  billingDay: number;
  billingCycle: 'monthly' | 'yearly' | 'quarterly';
  yearlyMonthDay?: string;
  category: 'telecom' | 'entertainment' | 'tool' | 'cloud' | 'other';
  autoRenew: boolean;
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

export type BillingStatus = 'paid' | 'upcoming' | 'upcoming-soon';

export interface BillingItem {
  subscription: Subscription;
  date: Date;
  status: BillingStatus;
  amount: number;
  currency: string;
}

export const CATEGORY_LABELS: Record<Subscription['category'], string> = {
  telecom: '通讯',
  entertainment: '娱乐',
  tool: '工具',
  cloud: '云服务',
  other: '其他',
};

export const CATEGORY_COLORS: Record<Subscription['category'], string> = {
  telecom: '#3b82f6',
  entertainment: '#ec4899',
  tool: '#f59e0b',
  cloud: '#8b5cf6',
  other: '#6b7280',
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  CNY: '¥',
  USD: '$',
  EUR: '€',
  JPY: '¥',
  GBP: '£',
};
