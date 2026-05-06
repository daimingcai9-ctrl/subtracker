import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { CATEGORY_LABELS } from '../types';
import type { Subscription } from '../types';
import SubscriptionIcon from '../components/SubscriptionIcon';
import { formatAmount } from '../utils/billing';
import { Plus, Search, Pencil, Trash2, Power } from 'lucide-react';
import SubscriptionForm from '../components/SubscriptionForm';

export default function SubscriptionsPage() {
  const { subscriptions, deleteSubscription, toggleActive } = useStore();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const filtered = subscriptions.filter((sub) => {
    const matchSearch = sub.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === 'all' || sub.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const handleEdit = (sub: Subscription) => {
    setEditingSub(sub);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingSub(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold">订阅管理</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          <Plus size={18} />
          添加订阅
        </button>
      </div>

      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 md:mb-6">
        <div className="flex-1 relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
          />
          <input
            type="text"
            placeholder="搜索订阅..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">全部分类</option>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Subscription list */}
      <div className="space-y-3">
        {filtered.map((sub, i) => (
          <div
            key={sub.id}
            className={`bg-surface rounded-2xl border border-border p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 transition-all duration-400 ${
              !sub.isActive ? 'opacity-50' : ''
            }`}
            style={{
              opacity: mounted ? (!sub.isActive ? 0.5 : 1) : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(10px)',
              transitionDelay: `${i * 60}ms`,
            }}
          >
            <div className="flex items-center gap-4">
              <SubscriptionIcon icon={sub.icon} color={sub.iconColor} size={22} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{sub.name}</span>
                  {!sub.isActive && (
                    <span className="text-xs bg-surface-alt text-text-secondary px-2 py-0.5 rounded-full">
                      已暂停
                    </span>
                  )}
                </div>
                <div className="text-sm text-text-secondary mt-0.5">
                  {CATEGORY_LABELS[sub.category]} ·{' '}
                  {sub.billingCycle === 'monthly'
                    ? '月付'
                    : sub.billingCycle === 'yearly'
                    ? '年付'
                    : '季付'}{' '}
                  · 每月{sub.billingDay}号
                  {sub.notes && ` · ${sub.notes}`}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="flex items-baseline gap-1 sm:text-right sm:mr-2">
                <span className="font-semibold">{formatAmount(sub.amount, sub.currency)}</span>
                <span className="text-xs text-text-secondary">
                  /{sub.billingCycle === 'monthly' ? '月' : sub.billingCycle === 'yearly' ? '年' : '季'}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => toggleActive(sub.id)}
                  className="p-2 rounded-lg hover:bg-surface-alt transition-colors text-text-secondary"
                  title={sub.isActive ? '暂停' : '启用'}
                >
                  <Power size={16} />
                </button>
                <button
                  onClick={() => handleEdit(sub)}
                  className="p-2 rounded-lg hover:bg-surface-alt transition-colors text-text-secondary"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`确定删除「${sub.name}」？`)) deleteSubscription(sub.id);
                  }}
                  className="p-2 rounded-lg hover:bg-danger/10 transition-colors text-danger"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-text-secondary">
            没有找到匹配的订阅
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <SubscriptionForm subscription={editingSub} onClose={handleClose} />
      )}
    </div>
  );
}
