import { useState } from 'react';
import { useStore } from '../store/useStore';
import type { Subscription } from '../types';
import { CATEGORY_LABELS } from '../types';
import { X } from 'lucide-react';

const ICON_OPTIONS = [
  { key: 'smartphone', label: '手机' },
  { key: 'music', label: '音乐' },
  { key: 'play-circle', label: '视频' },
  { key: 'bot', label: 'AI' },
  { key: 'cloud', label: '云' },
  { key: 'tv', label: '电视' },
  { key: 'code', label: '代码' },
  { key: 'headphones', label: '耳机' },
  { key: 'credit-card', label: '信用卡' },
  { key: 'package', label: '其他' },
];

const COLOR_PRESETS = [
  '#3b82f6', '#ec4899', '#22c55e', '#f59e0b',
  '#ef4444', '#8b5cf6', '#6366f1', '#10b981',
  '#1e293b', '#f97316',
];

const CURRENCY_OPTIONS = [
  { value: 'CNY', label: '¥ CNY' },
  { value: 'USD', label: '$ USD' },
  { value: 'EUR', label: '€ EUR' },
  { value: 'JPY', label: '¥ JPY' },
  { value: 'GBP', label: '£ GBP' },
];

interface Props {
  subscription?: Subscription | null;
  onClose: () => void;
}

export default function SubscriptionForm({ subscription, onClose }: Props) {
  const { addSubscription, updateSubscription } = useStore();

  const [name, setName] = useState(subscription?.name || '');
  const [icon, setIcon] = useState(subscription?.icon || 'package');
  const [iconColor, setIconColor] = useState(subscription?.iconColor || '#6366f1');
  const [amount, setAmount] = useState(subscription?.amount?.toString() || '');
  const [currency, setCurrency] = useState(subscription?.currency || 'CNY');
  const [billingDay, setBillingDay] = useState(subscription?.billingDay?.toString() || '1');
  const [billingCycle, setBillingCycle] = useState<Subscription['billingCycle']>(
    subscription?.billingCycle || 'monthly'
  );
  const [category, setCategory] = useState<Subscription['category']>(
    subscription?.category || 'other'
  );
  const [autoRenew, setAutoRenew] = useState(subscription?.autoRenew ?? true);
  const [notes, setNotes] = useState(subscription?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;

    const data = {
      name,
      icon,
      iconColor,
      amount: parseFloat(amount),
      currency,
      billingDay: parseInt(billingDay),
      billingCycle,
      category,
      autoRenew,
      isActive: true,
      notes: notes || undefined,
    };

    if (subscription) {
      updateSubscription(subscription.id, data);
    } else {
      addSubscription(data);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-surface rounded-t-2xl md:rounded-2xl w-full md:max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">
            {subscription ? '编辑订阅' : '添加订阅'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-alt transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1.5">名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：中国移动主卡、Netflix"
              className="w-full px-4 py-2.5 bg-surface-alt border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
            />
          </div>

          {/* Icon + Color */}
          <div>
            <label className="block text-sm font-medium mb-1.5">图标</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setIcon(opt.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                    icon === opt.key
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">颜色</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setIconColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    iconColor === color ? 'border-text scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Amount + Currency */}
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">金额</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 bg-surface-alt border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">币种</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-alt border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {CURRENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Billing cycle + Day */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">扣费周期</label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as Subscription['billingCycle'])}
                className="w-full px-4 py-2.5 bg-surface-alt border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="monthly">每月</option>
                <option value="quarterly">每季</option>
                <option value="yearly">每年</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {billingCycle === 'yearly' ? '每年几月几号' : '每月几号'}
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={billingDay}
                onChange={(e) => setBillingDay(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-alt border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-1.5">分类</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key as Subscription['category'])}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                    category === key
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Auto renew */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="autoRenew"
              checked={autoRenew}
              onChange={(e) => setAutoRenew(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30"
            />
            <label htmlFor="autoRenew" className="text-sm">
              自动续费
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1.5">备注</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="可选，如套餐内容"
              className="w-full px-4 py-2.5 bg-surface-alt border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium border border-border hover:bg-surface-alt transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors"
            >
              {subscription ? '保存' : '添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
