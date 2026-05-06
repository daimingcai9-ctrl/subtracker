import { useMemo, useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { getMonthBillingItems, formatAmount, toCNY } from '../utils/billing';
import SubscriptionIcon from '../components/SubscriptionIcon';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarPage() {
  const subscriptions = useStore((s) => s.subscriptions);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const billingItems = useMemo(
    () => getMonthBillingItems(subscriptions, currentDate.getFullYear(), currentDate.getMonth()),
    [subscriptions, currentDate.getFullYear(), currentDate.getMonth()]
  );

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const billingByDay = useMemo(() => {
    const map = new Map<string, typeof billingItems>();
    for (const item of billingItems) {
      const key = format(item.date, 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [billingItems]);

  const selectedItems = selectedDate
    ? billingByDay.get(format(selectedDate, 'yyyy-MM-dd')) || []
    : [];

  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">扣费日历</h1>

      <div
        className="bg-surface rounded-2xl border border-border overflow-hidden transition-all duration-500"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(12px)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 rounded-lg hover:bg-surface-alt transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold">
            {format(currentDate, 'yyyy年M月', { locale: zhCN })}
          </h2>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 rounded-lg hover:bg-surface-alt transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 border-b border-border">
          {weekDays.map((day) => (
            <div
              key={day}
              className="py-3 text-center text-xs font-medium text-text-secondary"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const items = billingByDay.get(key) || [];
            const inMonth = isSameMonth(day, currentDate);
            const today = isToday(day);
            const selected = selectedDate && isSameDay(day, selectedDate);
            const totalAmount = items.reduce(
              (sum, item) => sum + toCNY(item.amount, item.currency),
              0
            );

            return (
              <button
                key={key}
                onClick={() => setSelectedDate(day)}
                className={`relative min-h-[80px] p-2 border-b border-r border-border text-left transition-colors ${
                  !inMonth ? 'bg-surface-alt/50' : ''
                } ${selected ? 'bg-primary/5' : 'hover:bg-surface-alt'}`}
              >
                <span
                  className={`text-sm inline-flex items-center justify-center w-7 h-7 rounded-full ${
                    today
                      ? 'bg-primary text-white font-bold'
                      : inMonth
                      ? 'text-text'
                      : 'text-text-secondary/50'
                  }`}
                >
                  {format(day, 'd')}
                </span>
                {items.length > 0 && (
                  <div className="mt-1">
                    <div className="flex flex-wrap gap-1">
                      {items.slice(0, 3).map((item) => (
                        <div
                          key={item.subscription.id}
                          className="w-5 h-5 rounded-md flex items-center justify-center"
                          style={{
                            backgroundColor: item.subscription.iconColor
                              ? `${item.subscription.iconColor}20`
                              : '#f1f5f9',
                          }}
                          title={item.subscription.name}
                        >
                          <span className="text-[10px]">
                            {item.subscription.name.charAt(0)}
                          </span>
                        </div>
                      ))}
                      {items.length > 3 && (
                        <span className="text-[10px] text-text-secondary">
                          +{items.length - 3}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-text-secondary mt-0.5">
                      ¥{totalAmount.toFixed(0)}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDate && (
        <div className="mt-4 bg-surface rounded-2xl border border-border p-6 animate-in">
          <h3 className="text-lg font-semibold mb-4">
            {format(selectedDate, 'M月d日 EEEE', { locale: zhCN })} 扣费详情
          </h3>
          {selectedItems.length === 0 ? (
            <p className="text-text-secondary text-sm">当天无扣费</p>
          ) : (
            <div className="space-y-3">
              {selectedItems.map((item) => (
                <div
                  key={item.subscription.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <SubscriptionIcon
                      icon={item.subscription.icon}
                      color={item.subscription.iconColor}
                      size={20}
                    />
                    <div>
                      <div className="text-sm font-medium">{item.subscription.name}</div>
                      <div className="text-xs text-text-secondary">
                        {item.subscription.billingCycle === 'monthly'
                          ? '月付'
                          : item.subscription.billingCycle === 'yearly'
                          ? '年付'
                          : '季付'}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold">
                    {formatAmount(item.amount, item.currency)}
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-border flex justify-between">
                <span className="text-sm font-medium text-text-secondary">合计</span>
                <span className="text-sm font-bold">
                  ¥{selectedItems
                    .reduce((sum, item) => sum + toCNY(item.amount, item.currency), 0)
                    .toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
