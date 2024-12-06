'use client';

import {
  Activity,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Wifi,
  Signal,
  User,
  Users,
  UserPlus,
  LogIn,
  Settings,
  LogOut,
  LayoutDashboard,
  Map,
  Trophy,
  Menu,
  X,
  Save,
  Mail,
  Flame,
  Star,
  Plus,
  Zap,
  Twitter,
  Github,
  WifiOff,
  CheckCircle,
  XCircle,
  Home,
  Bell,
  Languages,
  type LucideProps
} from 'lucide-react';

export const Icons = {
  logo: Activity,
  spinner: Loader2,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  check: Check,
  checkCircle: CheckCircle,
  xCircle: XCircle,
  wifi: Wifi,
  signal: Signal,
  user: User,
  users: Users,
  userPlus: UserPlus,
  login: LogIn,
  settings: Settings,
  logout: LogOut,
  dashboard: LayoutDashboard,
  map: Map,
  trophy: Trophy,
  menu: Menu,
  close: X,
  save: Save,
  mail: Mail,
  flame: Flame,
  star: Star,
  plus: Plus,
  zap: Zap,
  activity: Activity,
  twitter: Twitter,
  github: Github,
  offline: WifiOff,
  home: Home,
  bell: Bell,
  languages: Languages,
  google: ({ ...props }: LucideProps) => (
    <svg
      aria-hidden="true"
      focusable="false"
      data-prefix="fab"
      data-icon="google"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 488 512"
      {...props}
    >
      <path
        fill="currentColor"
        d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
      />
    </svg>
  ),
};

export type Icon = keyof typeof Icons;
