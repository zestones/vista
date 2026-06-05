// Icon system: lucide-react for everything, plus two custom brand marks
// (Vista logo + GitHub wordmark) since lucide no longer ships brand icons.
import {
  ArrowRight as LArrowRight,
  ArrowLeft as LArrowLeft,
  X,
  Check,
  Plus,
  Shield,
  Settings,
  Users,
  Link2,
  Copy,
  Lock,
  Globe,
  Trash2,
  ChevronRight as LChevronRight,
  ChevronDown as LChevronDown,
  LayoutGrid,
  Menu,
  Sparkles as LSparkles,
  Bug as LBug,
  HelpCircle,
  Tag,
  Route,
  Milestone,
  Inbox,
  Circle as LCircle,
  CircleCheck,
  CalendarClock,
  Search,
  TriangleAlert,
  ArrowUpDown,
  ChevronsDownUp,
  ChevronsUpDown,
  Minus,
  LocateFixed,
} from "lucide-react";

// Wrap so existing call sites (<PlusIcon size={14} />) keep working with a
// sensible default size.
const wrap = (Cmp, def = 16) =>
  function Icon({ size = def, ...rest }) {
    return <Cmp size={size} {...rest} />;
  };

export const ArrowRight = wrap(LArrowRight);
export const ArrowLeft = wrap(LArrowLeft);
export const CloseIcon = wrap(X, 18);
export const CheckIcon = wrap(Check, 18);
export const PlusIcon = wrap(Plus);
export const ShieldIcon = wrap(Shield);
export const GearIcon = wrap(Settings);
export const UsersIcon = wrap(Users);
export const LinkIcon = wrap(Link2);
export const CopyIcon = wrap(Copy);
export const LockIcon = wrap(Lock);
export const GlobeIcon = wrap(Globe);
export const TrashIcon = wrap(Trash2);
export const ChevronRight = wrap(LChevronRight);
export const ChevronDown = wrap(LChevronDown);
export const GridIcon = wrap(LayoutGrid);
export const OpenIcon = wrap(LCircle);
export const ClosedIcon = wrap(CircleCheck);
export const DueIcon = wrap(CalendarClock);
export const SearchIcon = wrap(Search);
export const AlertIcon = wrap(TriangleAlert);
export const SortIcon = wrap(ArrowUpDown);
export const CollapseAllIcon = wrap(ChevronsDownUp);
export const ExpandAllIcon = wrap(ChevronsUpDown);
export const MinusIcon = wrap(Minus);
export const TodayIcon = wrap(LocateFixed);
export const MenuIcon = wrap(Menu);
export const SparklesIcon = wrap(LSparkles);
export const BugIcon = wrap(LBug);
export const QuestionIcon = wrap(HelpCircle);
export const TagIcon = wrap(Tag);
export const RouteIcon = wrap(Route);
export const MilestoneIcon = wrap(Milestone);
export const InboxIcon = wrap(Inbox);

// ── Custom brand marks (not in lucide) ──
export function VistaMark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="var(--ink)" />
      <rect x="6.5" y="8" width="11" height="2.2" rx="1.1" fill="var(--sig-peach)" />
      <rect x="6.5" y="11.6" width="8" height="2.2" rx="1.1" fill="var(--sig-mint)" />
      <rect x="6.5" y="15.2" width="5" height="2.2" rx="1.1" fill="var(--sig-yellow)" />
    </svg>
  );
}

export function GitHubIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.12-.31-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.18.77.84 1.24 1.92 1.24 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z" />
    </svg>
  );
}
