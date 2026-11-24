import {
  BadgeCheck,
  BarChart3,
  BrainCircuit,
  Building2,
  CalendarRange,
  Clapperboard,
  ClipboardList,
  Code2,
  Cpu,
  Eye,
  FileCheck,
  FileLock,
  Landmark,
  LayoutDashboard,
  Lock,
  Megaphone,
  RefreshCw,
  Repeat,
  Rocket,
  Server,
  ServerCog,
  ShieldCheck,
  Sparkles,
  Timer,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';

/**
 * Lucide icons referenced by name in seed/site content (`icon: "shield-check"`).
 * A static map keeps the bundle small; unknown names (e.g. added later in the CMS) fall back.
 */
const icons: Record<string, LucideIcon> = {
  'badge-check': BadgeCheck,
  'bar-chart-3': BarChart3,
  'brain-circuit': BrainCircuit,
  'building-2': Building2,
  'calendar-range': CalendarRange,
  clapperboard: Clapperboard,
  'clipboard-list': ClipboardList,
  'code-2': Code2,
  cpu: Cpu,
  eye: Eye,
  'file-check': FileCheck,
  'file-lock': FileLock,
  landmark: Landmark,
  'layout-dashboard': LayoutDashboard,
  lock: Lock,
  megaphone: Megaphone,
  'refresh-cw': RefreshCw,
  repeat: Repeat,
  rocket: Rocket,
  server: Server,
  'server-cog': ServerCog,
  'shield-check': ShieldCheck,
  timer: Timer,
  'trending-up': TrendingUp,
  'user-check': UserCheck,
  users: Users,
  zap: Zap,
};

export function Icon({ name, ...props }: { name?: string | null } & LucideProps) {
  const Cmp = (name && icons[name]) || Sparkles;
  return <Cmp aria-hidden="true" {...props} />;
}
