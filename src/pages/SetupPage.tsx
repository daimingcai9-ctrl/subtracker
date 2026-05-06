import { useState } from 'react';
import { useStore, generateUserCode, setUserCode } from '../store/useStore';
import { Copy, Check, ArrowRight } from 'lucide-react';

export default function SetupPage() {
  const [inputCode, setInputCode] = useState('');
  const [newCode, setNewCode] = useState('');
  const [copied, setCopied] = useState(false);
  const init = useStore((s) => s.init);

  const handleGenerate = () => {
    const code = generateUserCode();
    setNewCode(code);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/?code=${newCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = (code: string) => {
    if (!code || code.length < 4) return;
    setUserCode(code.toUpperCase());
    init();
  };

  // Check URL params for code
  const urlCode = new URLSearchParams(window.location.search).get('code');
  if (urlCode && !inputCode) {
    setInputCode(urlCode.toUpperCase());
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl border border-border p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">SubTracker</h1>
          <p className="text-text-secondary text-sm">软件订阅扣费管理</p>
        </div>

        {/* Join with code */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-text-secondary mb-3">已有邀请码？</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="输入邀请码"
              maxLength={6}
              className="flex-1 px-4 py-3 bg-surface-alt border border-border rounded-xl text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={() => handleJoin(inputCode)}
              className="px-5 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors flex items-center gap-2"
            >
              进入
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-surface px-3 text-text-secondary">或者</span>
          </div>
        </div>

        {/* Generate new code */}
        <div>
          <h2 className="text-sm font-medium text-text-secondary mb-3">创建你自己的空间</h2>
          {!newCode ? (
            <button
              onClick={handleGenerate}
              className="w-full px-5 py-3 bg-surface-alt border border-border rounded-xl font-medium hover:bg-primary/5 hover:border-primary/30 transition-colors"
            >
              生成邀请码
            </button>
          ) : (
            <div className="space-y-3">
              <div className="bg-surface-alt rounded-xl p-4 text-center">
                <div className="text-xs text-text-secondary mb-2">你的邀请码</div>
                <div className="text-3xl font-bold font-mono tracking-[0.3em] text-primary">
                  {newCode}
                </div>
              </div>
              <div className="bg-surface-alt rounded-xl p-4">
                <div className="text-xs text-text-secondary mb-2">分享链接</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs text-text truncate">
                    {window.location.origin}/?code={newCode}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 p-2 rounded-lg hover:bg-surface transition-colors"
                    title="复制链接"
                  >
                    {copied ? (
                      <Check size={16} className="text-success" />
                    ) : (
                      <Copy size={16} className="text-text-secondary" />
                    )}
                  </button>
                </div>
              </div>
              <button
                onClick={() => handleJoin(newCode)}
                className="w-full px-5 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
              >
                进入我的空间
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
