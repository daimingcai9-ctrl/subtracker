import { addMonths, addYears, isBefore, startOfDay, differenceInDays } from 'date-fns';
import type { Subscription, BillingItem, BillingStatus } from '../types';

export function getNextBillingDate(sub: Subscription, fromDate: Date = new Date()): Date {
  const now = startOfDay(fromDate);

  if (sub.billingCycle === 'monthly') {
    let next = new Date(now.getFullYear(), now.getMonth(), sub.billingDay);
    if (isBefore(next, now) || next.getTime() === now.getTime()) {
      next = addMonths(next, 1);
    }
    return next;
  }

  if (sub.billingCycle === 'yearly' && sub.yearlyMonthDay) {
    const [m, d] = sub.yearlyMonthDay.split('-').map(Number);
    let next = new Date(now.getFullYear(), m - 1, d);
    if (isBefore(next, now) || next.getTime() === now.getTime()) {
      next = addYears(next, 1);
    }
    return next;
  }

  if (sub.billingCycle === 'quarterly') {
    let next = new Date(now.getFullYear(), now.getMonth(), sub.billingDay);
    while (isBefore(next, now) || next.getTime() === now.getTime()) {
      next = addMonths(next, 3);
    }
    return next;
  }

  return addMonths(now, 1);
}

export function getBillingStatus(date: Date): BillingStatus {
  const now = startOfDay(new Date());
  const diff = differenceInDays(date, now);
  if (diff < 0) return 'paid';
  if (diff <= 3) return 'upcoming-soon';
  return 'upcoming';
}

export function getMonthBillingItems(subscriptions: Subscription[], year: number, month: number): BillingItem[] {
  const items: BillingItem[] = [];

  for (const sub of subscriptions) {
    if (!sub.isActive) continue;

    if (sub.billingCycle === 'monthly') {
      const billingDate = new Date(year, month, sub.billingDay);
      if (billingDate.getMonth() === month) {
        items.push({
          subscription: sub,
          date: billingDate,
          status: getBillingStatus(billingDate),
          amount: sub.amount,
          currency: sub.currency,
        });
      }
    } else if (sub.billingCycle === 'yearly' && sub.yearlyMonthDay) {
      const [m, d] = sub.yearlyMonthDay.split('-').map(Number);
      if (m - 1 === month) {
        const billingDate = new Date(year, m - 1, d);
        items.push({
          subscription: sub,
          date: billingDate,
          status: getBillingStatus(billingDate),
          amount: sub.amount,
          currency: sub.currency,
        });
      }
    } else if (sub.billingCycle === 'quarterly') {
      // Check if this month falls on a quarterly cycle
      const createdMonth = new Date(sub.createdAt).getMonth();
      const monthDiff = (month - createdMonth + 12) % 12;
      if (monthDiff % 3 === 0) {
        const billingDate = new Date(year, month, sub.billingDay);
        if (billingDate.getMonth() === month) {
          items.push({
            subscription: sub,
            date: billingDate,
            status: getBillingStatus(billingDate),
            amount: sub.amount,
            currency: sub.currency,
          });
        }
      }
    }
  }

  items.sort((a, b) => a.date.getTime() - b.date.getTime());
  return items;
}

// Simple exchange rates (for display purposes)
const EXCHANGE_RATES: Record<string, number> = {
  CNY: 1,
  USD: 7.25,
  EUR: 7.9,
  JPY: 0.048,
  GBP: 9.2,
};

export function toCNY(amount: number, currency: string): number {
  const rate = EXCHANGE_RATES[currency] || 1;
  return amount * rate;
}

export function formatAmount(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    CNY: '¥',
    USD: '$',
    EUR: '€',
    JPY: '¥',
    GBP: '£',
  };
  const symbol = symbols[currency] || currency;
  return `${symbol}${amount.toFixed(2)}`;
}

export function getAnnualAmount(sub: Subscription): number {
  switch (sub.billingCycle) {
    case 'monthly':
      return toCNY(sub.amount * 12, sub.currency);
    case 'quarterly':
      return toCNY(sub.amount * 4, sub.currency);
    case 'yearly':
      return toCNY(sub.amount, sub.currency);
    default:
      return toCNY(sub.amount * 12, sub.currency);
  }
}
