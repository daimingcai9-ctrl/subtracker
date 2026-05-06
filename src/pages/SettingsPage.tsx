import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Download, Upload, Copy, Check, LogOut } from 'lucide-react';

export default function SettingsPage() {
  const { subscriptions, userCode } = useStore();
  const [primaryCurrency, setPrimaryCurrency] = useState('CNY');
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/?code=${userCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwitch = () => {
    localStorage.removeItem('subtracker-user-code');
    window.location.href = '/';
  };
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const handleExport = () => {
    const data = JSON.stringify(subscriptions, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtracker-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          console.log('Imported data:', data);
          alert(`成功导入 ${data.length} 条订阅记录（功能开发中）`);
        } catch {
          alert('文件格式错误');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleRequestNotification = async () => {
    if (!('Notification' in window)) {
      alert('当前浏览器不支持通知');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === 'granted');
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">设置</h1>

      <div className="space-y-4 md:space-y-6">
        {/* Account */}
        <div className="bg-surface rounded-2xl border border-border p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold mb-4">我的邀请码</h2>
          <div className="bg-surface-alt rounded-xl p-4 text-center mb-4">
            <div className="text-3xl font-bold font-mono tracking-[0.3em] text-primary">
              {userCode}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCopyLink}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-surface-alt transition-colors"
            >
              {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
              {copied ? '已复制' : '复制分享链接'}
            </button>
            <button
              onClick={handleSwitch}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
            >
              <LogOut size={16} />
              切换账号
            </button>
          </div>
        </div>

        {/* Currency */}
        <div className="bg-surface rounded-2xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">主币种</h2>
          <p className="text-sm text-text-secondary mb-3">
            统计报表将按此币种汇总显示
          </p>
          <select
            value={primaryCurrency}
            onChange={(e) => setPrimaryCurrency(e.target.value)}
            className="px-4 py-2.5 bg-surface-alt border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="CNY">¥ 人民币 (CNY)</option>
            <option value="USD">$ 美元 (USD)</option>
            <option value="EUR">€ 欧元 (EUR)</option>
            <option value="JPY">¥ 日元 (JPY)</option>
            <option value="GBP">£ 英镑 (GBP)</option>
          </select>
        </div>

        {/* Notifications */}
        <div className="bg-surface rounded-2xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">通知提醒</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">浏览器通知</p>
              <p className="text-sm text-text-secondary">
                扣费前3天推送提醒
              </p>
            </div>
            <button
              onClick={handleRequestNotification}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                notificationsEnabled
                  ? 'bg-success/10 text-success'
                  : 'bg-primary text-white hover:bg-primary-dark'
              }`}
            >
              {notificationsEnabled ? '已开启' : '开启通知'}
            </button>
          </div>
        </div>

        {/* Data management */}
        <div className="bg-surface rounded-2xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">数据管理</h2>
          <div className="space-y-3">
            <button
              onClick={handleExport}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-surface-alt transition-colors text-left"
            >
              <Download size={18} className="text-text-secondary" />
              <div>
                <div className="text-sm font-medium">导出数据</div>
                <div className="text-xs text-text-secondary">
                  导出为 JSON 文件
                </div>
              </div>
            </button>
            <button
              onClick={handleImport}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-surface-alt transition-colors text-left"
            >
              <Upload size={18} className="text-text-secondary" />
              <div>
                <div className="text-sm font-medium">导入数据</div>
                <div className="text-xs text-text-secondary">
                  从 JSON 文件导入
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* About */}
        <div className="bg-surface rounded-2xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">关于</h2>
          <p className="text-sm text-text-secondary">
            SubTracker — 软件订阅扣费管理工具
          </p>
          <p className="text-xs text-text-secondary mt-2">
            数据按邀请码隔离存储，分享链接给同学即可让他们使用独立空间。
          </p>
        </div>
      </div>
    </div>
  );
}
