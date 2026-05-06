import { useMemo, useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { getMonthBillingItems, toCNY, formatAmount } from '../utils/billing';
import { CATEGORY_LABELS } from '../types';
import SubscriptionIcon from '../components/SubscriptionIcon';
import { format, isToday, isTomorrow, differenceInDays, startOfDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { AlertTriangle, TrendingUp, Wallet, Receipt } from 'lucide-react';

export default function Dashboard() {
  const subscriptions = useStore((s) => s.subscriptions);
  const now = new Date();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const billingItems = useMemo(
    () => getMonthBillingItems(subscriptions, now.getFullYear(), now.getMonth()),
    [subscriptions, now.getFullYear(), now.getMonth()]
  );

  const today = startOfDay(now);

  const totalCNY = billingItems.reduce((sum, item) => sum + toCNY(item.amount, item.currency), 0);
  const paidItems = billingItems.filter((item) => differenceInDays(item.date, today) < 0 || isToday(item.date));
  const upcomingItems = billingItems.filter((item) => differenceInDays(item.date, today) > 0);
  const paidCNY = paidItems.reduce((sum, item) => sum + toCNY(item.amount, item.currency), 0);
  const upcomingCNY = upcomingItems.reduce((sum, item) => sum + toCNY(item.amount, item.currency), 0);
  const soonCount = upcomingItems.filter((item) => differenceInDays(item.date, today) <= 3).length;

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, typeof billingItems>();
    for (const item of billingItems) {
      const key = format(item.date, 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries());
  }, [billingItems]);

  const formatDateLabel = (date: Date) => {
    if (isToday(date)) return '今天';
    if (isTomorrow(date)) return '明天';
    return format(date, 'M月d日 EEEE', { locale: zhCN });
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Upcoming alert */}
      {soonCount > 0 && (
        <div
          className="mb-6 flex items-center gap-3 bg-warning/10 border border-warning/30 text-warning rounded-xl px-5 py-3 transition-all duration-500"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(-8px)',
          }}
        >
          <AlertTriangle size={20} />
          <span className="text-sm font-medium">
            3天内有 {soonCount} 项即将扣费，共 ¥{upcomingItems
              .filter((item) => differenceInDays(item.date, today) <= 3)
              .reduce((sum, item) => sum + toCNY(item.amount, item.currency), 0)
              .toFixed(2)}
          </span>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        {[
          { icon: Wallet, label: '本月预计总支出', value: `¥${totalCNY.toFixed(2)}`, sub: `${billingItems.length} 项订阅`, color: 'text-text' },
          { icon: Receipt, label: '已扣费', value: `¥${paidCNY.toFixed(2)}`, sub: `${paidItems.length} 项`, color: 'text-success' },
          { icon: TrendingUp, label: '待扣费', value: `¥${upcomingCNY.toFixed(2)}`, sub: `${upcomingItems.length} 项`, color: 'text-primary' },
        ].map((card, i) => (
          <div
            key={card.label}
            className="bg-surface rounded-2xl p-5 border border-border transition-all duration-500"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(12px)',
              transitionDelay: `${i * 100}ms`,
            }}
          >
            <div className="flex items-center gap-2 text-text-secondary text-sm mb-2">
              <card.icon size={16} />
              {card.label}
            </div>
            <div className={`text-2xl md:text-3xl font-bold tracking-tight ${card.color}`}>{card.value}</div>
            <div className="text-sm text-text-secondary mt-1">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div
        className="bg-surface rounded-2xl border border-border transition-all duration-500"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(16px)',
          transitionDelay: '300ms',
        }}
      >
        <div className="px-4 md:px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">{now.getMonth() + 1}月扣费时间线</h2>
        </div>
        <div className="divide-y divide-border">
          {grouped.map(([dateKey, items], groupIndex) => {
            const date = items[0].date;
            const isPast = differenceInDays(date, today) < 0;
            const isSoon = !isPast && differenceInDays(date, today) <= 3;

            return (
              <div
                key={dateKey}
                className="px-4 md:px-6 py-4 transition-all duration-400"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateX(0)' : 'translateX(-12px)',
                  transitionDelay: `${400 + groupIndex * 80}ms`,
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      isPast
                        ? 'bg-success/10 text-success'
                        : isSoon
                        ? 'bg-warning/10 text-warning'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {isPast ? '已扣' : isSoon ? '即将扣费' : '待扣'}
                  </span>
                  <span className="text-sm font-medium text-text">
                    {formatDateLabel(date)}
                  </span>
                </div>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.subscription.id}
                      className="flex items-center justify-between pl-2 group"
                    >
                      <div className="flex items-center gap-3">
                        <SubscriptionIcon
                          icon={item.subscription.icon}
                          color={item.subscription.iconColor}
                          size={20}
                        />
                        <div>
                          <div className="text-sm font-medium text-text group-hover:text-primary transition-colors">
                            {item.subscription.name}
                          </div>
                          <div className="text-xs text-text-secondary">
                            {CATEGORY_LABELS[item.subscription.category]}
                            {item.subscription.notes && ` · ${item.subscription.notes}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-text tabular-nums">
                        {formatAmount(item.amount, item.currency)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {grouped.length === 0 && (
            <div className="px-6 py-12 text-center text-text-secondary">
              本月暂无扣费记录
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
