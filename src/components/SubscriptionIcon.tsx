import {
  Smartphone,
  Music,
  PlayCircle,
  Bot,
  Cloud,
  Tv,
  Code,
  Headphones,
  CreditCard,
  Package,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string; color?: string }>> = {
  smartphone: Smartphone,
  music: Music,
  'play-circle': PlayCircle,
  bot: Bot,
  cloud: Cloud,
  tv: Tv,
  code: Code,
  headphones: Headphones,
  'credit-card': CreditCard,
  package: Package,
};

interface Props {
  icon: string;
  color?: string;
  size?: number;
}

export default function SubscriptionIcon({ icon, color, size = 24 }: Props) {
  const IconComponent = iconMap[icon] || Package;
  return (
    <div
      className="flex items-center justify-center rounded-xl shrink-0"
      style={{
        width: size + 16,
        height: size + 16,
        backgroundColor: color ? `${color}15` : '#f1f5f9',
      }}
    >
      <IconComponent size={size} color={color || '#64748b'} />
    </div>
  );
}
