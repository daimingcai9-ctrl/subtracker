import { useMemo, useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useThemeStore } from '../store/useTheme';
import { getMonthBillingItems, toCNY, getAnnualAmount, formatAmount } from '../utils/billing';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import SubscriptionIcon from '../components/SubscriptionIcon';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  XAxis,
  YAxis,
} from 'recharts';
import { subMonths, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

function ensureVisible(color: string, isDark: boolean): string {
  if (!isDark) return color;
  // Parse hex color and check luminance
  const hex = color.replace('#', '');
  if (hex.length !== 6) return color;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  // Relative luminance
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (lum > 0.25) return color;
  // Too dark — lighten it
  const lr = Math.min(255, r + 120);
  const lg = Math.min(255, g + 120);
  const lb = Math.min(255, b + 120);
  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
}

export default function AnalyticsPage() {
  const subscriptions = useStore((s) => s.subscriptions);
  const now = new Date();
  const activeSubs = subscriptions.filter((s) => s.isActive);
  const [mounted, setMounted] = useState(false);
  const resolved = useThemeStore((s) => s.resolved);
  const isDark = resolved === 'dark';

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Current month billing
  const currentBilling = useMemo(
    () => getMonthBillingItems(subscriptions, now.getFullYear(), now.getMonth()),
    [subscriptions]
  );
  const totalCNY = currentBilling.reduce((sum, item) => sum + toCNY(item.amount, item.currency), 0);

  // Last month for comparison
  const lastMonth = subMonths(now, 1);
  const lastBilling = useMemo(
    () => getMonthBillingItems(subscriptions, lastMonth.getFullYear(), lastMonth.getMonth()),
    [subscriptions]
  );
  const lastTotalCNY = lastBilling.reduce((sum, item) => sum + toCNY(item.amount, item.currency), 0);
  const changePercent = lastTotalCNY > 0 ? ((totalCNY - lastTotalCNY) / lastTotalCNY) * 100 : 0;

  // Category breakdown
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of currentBilling) {
      const cat = item.subscription.category;
      map.set(cat, (map.get(cat) || 0) + toCNY(item.amount, item.currency));
    }
    return Array.from(map.entries()).map(([name, value]) => ({
      name: CATEGORY_LABELS[name as keyof typeof CATEGORY_LABELS] || name,
      value: Math.round(value * 100) / 100,
      color: CATEGORY_COLORS[name as keyof typeof CATEGORY_COLORS] || '#6b7280',
    }));
  }, [currentBilling]);

  // Monthly trend (last 6 months)
  const trendData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(now, i);
      const items = getMonthBillingItems(subscriptions, month.getFullYear(), month.getMonth());
      const total = items.reduce((sum, item) => sum + toCNY(item.amount, item.currency), 0);
      data.push({
        month: format(month, 'M月', { locale: zhCN }),
        amount: Math.round(total * 100) / 100,
      });
    }
    return data;
  }, [subscriptions]);

  // Annual cost comparison
  const annualData = useMemo(() => {
    return activeSubs
      .map((sub) => ({
        name: sub.name,
        annual: Math.round(getAnnualAmount(sub) * 100) / 100,
        icon: sub.icon,
        iconColor: sub.iconColor,
      }))
      .sort((a, b) => b.annual - a.annual);
  }, [activeSubs]);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">支出分析</h1>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        {[
          {
            label: '本月总支出',
            value: `¥${totalCNY.toFixed(2)}`,
            sub: `环比 ${changePercent >= 0 ? '↑' : '↓'}${Math.abs(changePercent).toFixed(1)}% vs 上月`,
            subColor: changePercent >= 0 ? 'text-danger' : 'text-success',
          },
          {
            label: '活跃订阅',
            value: `${activeSubs.length} 项`,
            sub: `总订阅 ${subscriptions.length} 项`,
            subColor: 'text-text-secondary',
          },
          {
            label: '年度预估',
            value: `¥${(totalCNY * 12).toFixed(0)}`,
            sub: '按当前月均估算',
            subColor: 'text-text-secondary',
          },
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
            <div className="text-sm text-text-secondary mb-2">{card.label}</div>
            <div className="text-2xl md:text-3xl font-bold tracking-tight">{card.value}</div>
            <div className={`text-sm mt-2 ${card.subColor}`}>{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Category pie chart */}
        <div
          className="bg-surface rounded-2xl border border-border p-4 transition-all duration-500"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(16px)',
            transitionDelay: '300ms',
          }}
        >
          <h2 className="text-base font-semibold mb-2">分类占比</h2>
          <div style={{ width: '100%', height: 300 }}>
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    animationBegin={400}
                    animationDuration={800}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `¥${Number(value).toFixed(2)}`}
                    contentStyle={{
                      backgroundColor: isDark ? '#262637' : '#ffffff',
                      border: `1px solid ${isDark ? '#2e2e42' : '#e2e8f0'}`,
                      borderRadius: '12px',
                      color: isDark ? '#e2e8f0' : '#1e293b',
                      fontSize: '13px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {categoryData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2 text-sm">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="font-medium">{entry.name}</span>
                <span className="text-text-secondary">¥{entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly trend */}
        <div
          className="bg-surface rounded-2xl border border-border p-4 transition-all duration-500"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(16px)',
            transitionDelay: '400ms',
          }}
        >
          <h2 className="text-base font-semibold mb-2">月度趋势</h2>
          <div style={{ width: '100%', height: 300 }}>
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ left: 5, right: 45, top: 15, bottom: 15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2e2e42' : '#e2e8f0'} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `¥${v}`} width={40} tickCount={6} />
                  <Tooltip
                    formatter={(value) => `¥${Number(value).toFixed(2)}`}
                    contentStyle={{
                      backgroundColor: isDark ? '#262637' : '#ffffff',
                      border: `1px solid ${isDark ? '#2e2e42' : '#e2e8f0'}`,
                      borderRadius: '12px',
                      color: isDark ? '#e2e8f0' : '#1e293b',
                      fontSize: '13px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke={isDark ? '#818cf8' : '#6366f1'}
                    strokeWidth={2.5}
                    dot={{ fill: isDark ? '#818cf8' : '#6366f1', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: isDark ? '#818cf8' : '#6366f1' }}
                    animationBegin={500}
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Annual cost comparison */}
      <div
        className="bg-surface rounded-2xl border border-border p-5 mb-8 transition-all duration-500"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(16px)',
          transitionDelay: '500ms',
        }}
      >
        <h2 className="text-base font-semibold mb-5">年化费用对比</h2>
        <div className="space-y-3">
          {annualData.map((item, i) => {
            const maxAnnual = annualData[0]?.annual || 1;
            const percent = (item.annual / maxAnnual) * 100;
            return (
              <div
                key={item.name}
                className="transition-all duration-500"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateX(0)' : 'translateX(-16px)',
                  transitionDelay: `${600 + i * 80}ms`,
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <SubscriptionIcon icon={item.icon} color={ensureVisible(item.iconColor || '#6366f1', isDark)} size={16} />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    ¥{item.annual.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/年
                  </span>
                </div>
                <div className="h-3 bg-surface-alt rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: mounted ? `${percent}%` : '0%',
                      backgroundColor: ensureVisible(item.iconColor || '#6366f1', isDark),
                      transitionDelay: `${700 + i * 80}ms`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly billing detail table */}
      <div
        className="bg-surface rounded-2xl border border-border overflow-hidden transition-all duration-500 mb-4"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(16px)',
          transitionDelay: '600ms',
        }}
      >
        <div className="px-4 md:px-6 py-4 border-b border-border">
          <h2 className="text-base md:text-lg font-semibold">{now.getMonth() + 1}月账单明细</h2>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[480px]">
          <thead>
            <tr className="border-b border-border bg-surface-alt">
              <th className="text-left px-4 md:px-6 py-3 text-xs font-medium text-text-secondary">订阅</th>
              <th className="text-left px-4 md:px-6 py-3 text-xs font-medium text-text-secondary">分类</th>
              <th className="text-left px-4 md:px-6 py-3 text-xs font-medium text-text-secondary">周期</th>
              <th className="text-right px-4 md:px-6 py-3 text-xs font-medium text-text-secondary">金额</th>
              <th className="text-right px-4 md:px-6 py-3 text-xs font-medium text-text-secondary">年化</th>
            </tr>
          </thead>
          <tbody>
            {currentBilling.map((item) => (
              <tr
                key={item.subscription.id}
                className="border-b border-border last:border-0 hover:bg-surface-alt/50 transition-colors"
              >
                <td className="px-4 md:px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <SubscriptionIcon
                      icon={item.subscription.icon}
                      color={item.subscription.iconColor}
                      size={16}
                    />
                    <span className="text-sm font-medium">{item.subscription.name}</span>
                  </div>
                </td>
                <td className="px-4 md:px-6 py-3.5 text-sm text-text-secondary">
                  {CATEGORY_LABELS[item.subscription.category]}
                </td>
                <td className="px-4 md:px-6 py-3.5 text-sm text-text-secondary">
                  {item.subscription.billingCycle === 'monthly'
                    ? '月付'
                    : item.subscription.billingCycle === 'yearly'
                    ? '年付'
                    : '季付'}
                </td>
                <td className="px-4 md:px-6 py-3.5 text-sm font-medium text-right">
                  {formatAmount(item.amount, item.currency)}
                </td>
                <td className="px-4 md:px-6 py-3.5 text-sm text-text-secondary text-right">
                  ¥{getAnnualAmount(item.subscription).toFixed(0)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-surface-alt">
              <td colSpan={3} className="px-6 py-3.5 text-sm font-medium">
                合计
              </td>
              <td className="px-6 py-3.5 text-sm font-bold text-right">
                ¥{totalCNY.toFixed(2)}
              </td>
              <td className="px-6 py-3.5 text-sm font-bold text-right">
                ¥{(totalCNY * 12).toFixed(0)}
              </td>
            </tr>
          </tfoot>
        </table>
        </div>
      </div>
    </div>
  );
}
