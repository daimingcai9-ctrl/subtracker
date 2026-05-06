import { useThemeStore } from '../store/useTheme';
import { Sun, Moon, Monitor } from 'lucide-react';

const options = [
  { value: 'light' as const, icon: Sun, label: '浅色' },
  { value: 'dark' as const, icon: Moon, label: '深色' },
  { value: 'system' as const, icon: Monitor, label: '跟随系统' },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="flex items-center gap-1 bg-surface-alt rounded-xl p-1 border border-border">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            theme === opt.value
              ? 'bg-surface text-text shadow-sm'
              : 'text-text-secondary hover:text-text'
          }`}
          title={opt.label}
        >
          <opt.icon size={14} />
          <span className="hidden sm:inline">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
