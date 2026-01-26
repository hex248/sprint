import {
  Alert as PixelAlert,
  Check as PixelCheck,
  Checkbox as PixelCheckbox,
  ChevronDown as PixelChevronDown,
  ChevronLeft as PixelChevronLeft,
  ChevronRight as PixelChevronRight,
  ChevronUp as PixelChevronUp,
  Circle as PixelCircle,
  Clock as PixelClock,
  Close as PixelClose,
  MessagePlus as PixelCommentSend,
  Debug as PixelDebug,
  Edit as PixelEdit,
  Home as PixelHome,
  InfoBox as PixelInfo,
  Link as PixelLink,
  Loader as PixelLoader,
  Logout as PixelLogout,
  Moon as PixelMoon,
  MoreVertical as PixelMoreVertical,
  NoteDelete as PixelNoteDelete,
  Pause as PixelPause,
  Play as PixelPlay,
  Plus as PixelPlus,
  Server as PixelServer,
  CheckboxOn as PixelStop,
  Sun as PixelSun,
  Trash as PixelTrash,
  Undo as PixelUndo,
  User as PixelUser,
  ViewportWide as PixelViewportWide,
} from "@nsmr/pixelart-react";
import {
  BugIcon as PhosphorBug,
  CheckIcon as PhosphorCheck,
  CheckCircleIcon as PhosphorCheckCircle,
  CheckSquareIcon as PhosphorCheckSquare,
  CaretDownIcon as PhosphorChevronDown,
  CaretLeftIcon as PhosphorChevronLeft,
  CaretRightIcon as PhosphorChevronRight,
  CaretUpIcon as PhosphorChevronUp,
  CircleIcon as PhosphorCircle,
  ClockIcon as PhosphorClock,
  ChatTextIcon as PhosphorComment,
  DotsSixVerticalIcon as PhosphorDotsSixVertical,
  DotsThreeVerticalIcon as PhosphorDotsThreeVertical,
  PencilSimpleIcon as PhosphorEdit,
  HashIcon as PhosphorHash,
  HashStraightIcon as PhosphorHashStraight,
  HouseIcon as PhosphorHome,
  InfoIcon as PhosphorInfo,
  LinkIcon as PhosphorLink,
  SpinnerGapIcon as PhosphorLoader,
  SignOutIcon as PhosphorLogOut,
  MoonIcon as PhosphorMoon,
  OctagonIcon as PhosphorOctagon,
  PauseIcon as PhosphorPause,
  PlayIcon as PhosphorPlay,
  PlusIcon as PhosphorPlus,
  QuestionIcon as PhosphorQuestion,
  HardDrivesIcon as PhosphorServer,
  StopIcon as PhosphorStop,
  SunIcon as PhosphorSun,
  TrashIcon as PhosphorTrash,
  ArrowCounterClockwiseIcon as PhosphorUndo,
  UserIcon as PhosphorUser,
  WarningIcon as PhosphorWarning,
  XIcon as PhosphorX,
} from "@phosphor-icons/react";
import type { IconStyle } from "@sprint/shared";
import {
  AlertTriangle,
  Bug,
  Check,
  CheckIcon,
  ChevronDown,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUp,
  ChevronUpIcon,
  CircleCheckIcon,
  CircleIcon,
  CircleQuestionMark,
  Edit,
  EllipsisVertical,
  GripVerticalIcon,
  Hash,
  InfoIcon,
  Link,
  Loader,
  Loader2Icon,
  LogOut,
  Home as LucideHome,
  MessageSquarePlus,
  Moon,
  OctagonXIcon,
  Pause,
  Play,
  Plus,
  ServerIcon,
  Square,
  SquareCheck,
  Sun,
  Timer,
  Trash,
  TriangleAlertIcon,
  Undo,
  Undo2,
  UserRound,
  X,
} from "lucide-react";
import { useSessionSafe } from "@/components/session-provider";

// lucide: https://lucide.dev/icons
// pixel: https://pixelarticons.com/ (CLICK "Legacy") - these ones are free
// phosphor: https://phosphoricons.com/
const icons = {
  alertTriangle: { lucide: AlertTriangle, pixel: PixelAlert, phosphor: PhosphorWarning },
  bug: { lucide: Bug, pixel: PixelDebug, phosphor: PhosphorBug },
  check: { lucide: Check, pixel: PixelCheck, phosphor: PhosphorCheck },
  checkIcon: { lucide: CheckIcon, pixel: PixelCheck, phosphor: PhosphorCheck },
  checkBox: { lucide: SquareCheck, pixel: PixelCheckbox, phosphor: PhosphorCheckSquare },
  chevronDown: { lucide: ChevronDown, pixel: PixelChevronDown, phosphor: PhosphorChevronDown },
  chevronDownIcon: { lucide: ChevronDownIcon, pixel: PixelChevronDown, phosphor: PhosphorChevronDown },
  chevronLeftIcon: { lucide: ChevronLeftIcon, pixel: PixelChevronLeft, phosphor: PhosphorChevronLeft },
  chevronRightIcon: { lucide: ChevronRightIcon, pixel: PixelChevronRight, phosphor: PhosphorChevronRight },
  chevronUp: { lucide: ChevronUp, pixel: PixelChevronUp, phosphor: PhosphorChevronUp },
  chevronUpIcon: { lucide: ChevronUpIcon, pixel: PixelChevronUp, phosphor: PhosphorChevronUp },
  circleCheckIcon: { lucide: CircleCheckIcon, pixel: PixelCheck, phosphor: PhosphorCheckCircle },
  circleIcon: { lucide: CircleIcon, pixel: PixelCircle, phosphor: PhosphorCircle },
  circleQuestionMark: { lucide: CircleQuestionMark, pixel: PixelNoteDelete, phosphor: PhosphorQuestion },
  comment: { lucide: MessageSquarePlus, pixel: PixelCommentSend, phosphor: PhosphorComment },
  edit: { lucide: Edit, pixel: PixelEdit, phosphor: PhosphorEdit },
  ellipsisVertical: {
    lucide: EllipsisVertical,
    pixel: PixelMoreVertical,
    phosphor: PhosphorDotsThreeVertical,
  },
  gripVerticalIcon: {
    lucide: GripVerticalIcon,
    pixel: PixelViewportWide,
    phosphor: PhosphorDotsSixVertical,
  },
  hash: { lucide: Hash, pixel: PhosphorHashStraight, phosphor: PhosphorHash },
  home: { lucide: LucideHome, pixel: PixelHome, phosphor: PhosphorHome },
  infoIcon: { lucide: InfoIcon, pixel: PixelInfo, phosphor: PhosphorInfo },
  link: { lucide: Link, pixel: PixelLink, phosphor: PhosphorLink },
  loader: { lucide: Loader, pixel: PixelLoader, phosphor: PhosphorLoader },
  loader2Icon: { lucide: Loader2Icon, pixel: PixelLoader, phosphor: PhosphorLoader },
  logOut: { lucide: LogOut, pixel: PixelLogout, phosphor: PhosphorLogOut },
  moon: { lucide: Moon, pixel: PixelMoon, phosphor: PhosphorMoon },
  octagonXIcon: { lucide: OctagonXIcon, pixel: PixelClose, phosphor: PhosphorOctagon },
  pause: { lucide: Pause, pixel: PixelPause, phosphor: PhosphorPause },
  play: { lucide: Play, pixel: PixelPlay, phosphor: PhosphorPlay },
  plus: { lucide: Plus, pixel: PixelPlus, phosphor: PhosphorPlus },
  serverIcon: { lucide: ServerIcon, pixel: PixelServer, phosphor: PhosphorServer },
  sun: { lucide: Sun, pixel: PixelSun, phosphor: PhosphorSun },
  stop: { lucide: Square, pixel: PixelStop, phosphor: PhosphorStop },
  timer: { lucide: Timer, pixel: PixelClock, phosphor: PhosphorClock },
  trash: { lucide: Trash, pixel: PixelTrash, phosphor: PhosphorTrash },
  triangleAlertIcon: { lucide: TriangleAlertIcon, pixel: PixelAlert, phosphor: PhosphorWarning },
  undo: { lucide: Undo, pixel: PixelUndo, phosphor: PhosphorUndo },
  undo2: { lucide: Undo2, pixel: PixelUndo, phosphor: PhosphorUndo },
  userRound: { lucide: UserRound, pixel: PixelUser, phosphor: PhosphorUser },
  x: { lucide: X, pixel: PixelClose, phosphor: PhosphorX },
};

export type IconName = keyof typeof icons;
export const iconNames = Object.keys(icons) as IconName[];
export const iconStyles = ["lucide", "pixel", "phosphor"] as const;
export type { IconStyle };

export default function Icon({
  icon,
  iconStyle,
  size = 24,
  color,
  ...props
}: {
  icon: IconName;
  iconStyle?: IconStyle;
  size?: number | string;
  color?: string;
} & React.ComponentProps<"svg">) {
  const session = useSessionSafe();
  const resolvedStyle = (iconStyle ??
    session?.user?.iconPreference ??
    localStorage.getItem("iconPreference") ??
    "lucide") as IconStyle;
  const IconComponent = icons[icon]?.[resolvedStyle];

  if (localStorage.getItem("iconPreference") !== resolvedStyle)
    localStorage.setItem("iconPreference", resolvedStyle);

  if (!IconComponent) {
    return null;
  }

  let fill = "transparent";
  // lucide fills sillily
  if (color && resolvedStyle !== "lucide") {
    fill = color;
  } else if (resolvedStyle === "pixel" && ["bug", "moon", "hash"].includes(icon)) {
    fill = "var(--foreground)";
  } else if (resolvedStyle === "phosphor") {
    fill = "var(--foreground)";
  }

  return (
    <IconComponent
      size={size}
      fill={fill}
      style={{ color: color ? color : "var(--foreground)" }}
      {...props}
    />
  );
}
