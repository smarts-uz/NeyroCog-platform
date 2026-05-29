import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Baby,
  BookOpen,
  Brain,
  CheckCircle2,
  ClipboardList,
  Clock,
  Crosshair,
  Download,
  Ear,
  GitBranch,
  Layers,
  List,
  ListOrdered,
  type LucideIcon,
  Pencil,
  Pill,
  Play,
  Repeat,
  RotateCw,
  Search,
  Square,
  Star,
  Stethoscope,
  TrendingUp,
  Type,
  User,
  Zap,
} from "lucide-react";

/**
 * Prototipdagi kebab-case Lucide nomlari → lucide-react komponentlari.
 * Test metadata `icon: "git-branch"` kabi string'lar saqlaydi.
 */
const ICONS: Record<string, LucideIcon> = {
  activity: Activity,
  "alert-circle": AlertCircle,
  "alert-triangle": AlertTriangle,
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  baby: Baby,
  "book-open": BookOpen,
  brain: Brain,
  "check-circle": CheckCircle2,
  "clipboard-list": ClipboardList,
  clock: Clock,
  crosshair: Crosshair,
  download: Download,
  ear: Ear,
  "git-branch": GitBranch,
  layers: Layers,
  list: List,
  "list-ordered": ListOrdered,
  "edit-3": Pencil,
  pill: Pill,
  play: Play,
  repeat: Repeat,
  "rotate-cw": RotateCw,
  search: Search,
  square: Square,
  star: Star,
  stethoscope: Stethoscope,
  "trending-up": TrendingUp,
  type: Type,
  user: User,
  zap: Zap,
};

export function ClinicalIcon({
  name,
  size = 20,
  className,
  strokeWidth = 2,
}: {
  name: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  const Cmp = ICONS[name] ?? Activity;
  return <Cmp size={size} className={className} strokeWidth={strokeWidth} />;
}
