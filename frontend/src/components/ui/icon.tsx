import {
  Alert as PixelAlert,
  ArrowBarDown as PixelArrowBarDown,
  ArrowBarUp as PixelArrowBarUp,
  Check as PixelCheck,
  Checkbox as PixelCheckbox,
  CheckboxOn as PixelCheckboxOn,
  ChevronDown as PixelChevronDown,
  ChevronLeft as PixelChevronLeft,
  ChevronRight as PixelChevronRight,
  ChevronUp as PixelChevronUp,
  Circle as PixelCircle,
  Clock as PixelClock,
  Close as PixelClose,
  MessagePlus as PixelCommentSend,
  Copy as PixelCopy,
  CreditCard as PixelCreditCard,
  CreditCardDelete as PixelCreditCardDelete,
  Dashboard as PixelDashboard,
  Debug as PixelDebug,
  DebugOff as PixelDebugOff,
  Edit as PixelEdit,
  EyeClosed as PixelEyeClosed,
  AddGrid as PixelGridAdd,
  HumanHandsup as PixelHandsUp,
  Home as PixelHome,
  InfoBox as PixelInfo,
  Link as PixelLink,
  Loader as PixelLoader,
  Logout as PixelLogout,
  Volume3 as PixelMic,
  VolumeX as PixelMicOff,
  Moon as PixelMoon,
  MoreVertical as PixelMoreVertical,
  NoteDelete as PixelNoteDelete,
  Pause as PixelPause,
  Play as PixelPlay,
  Plus as PixelPlus,
  Server as PixelServer,
  Shield as PixelShield,
  Ship as PixelShip,
  CheckboxOn as PixelStop,
  Sun as PixelSun,
  Trash as PixelTrash,
  Undo as PixelUndo,
  User as PixelUser,
  ViewportWide as PixelViewportWide,
  Zap as PixelZap,
} from "@nsmr/pixelart-react";
import {
  ArrowCounterClockwiseIcon as PhosphorArrowCounterClockwise,
  BugIcon as PhosphorBug,
  CheckIcon as PhosphorCheck,
  CheckCircleIcon as PhosphorCheckCircle,
  CheckSquareIcon as PhosphorCheckSquare,
  CaretDownIcon as PhosphorChevronDown,
  CaretLeftIcon as PhosphorChevronLeft,
  CaretRightIcon as PhosphorChevronRight,
  CaretUpIcon as PhosphorChevronUp,
  CircleIcon as PhosphorCircle,
  ChatTextIcon as PhosphorComment,
  CopyIcon as PhosphorCopy,
  CreditCardIcon as PhosphorCreditCard,
  CubeIcon as PhosphorCube,
  DotsSixVerticalIcon as PhosphorDotsSixVertical,
  DotsThreeVerticalIcon as PhosphorDotsThreeVertical,
  DownloadSimpleIcon as PhosphorDownloadSimple,
  PencilSimpleIcon as PhosphorEdit,
  EyeClosedIcon as PhosphorEyeClosed,
  PersonArmsSpreadIcon as PhosphorHandsUp,
  HashIcon as PhosphorHash,
  HashStraightIcon as PhosphorHashStraight,
  HouseIcon as PhosphorHome,
  InfoIcon as PhosphorInfo,
  LayoutIcon as PhosphorLayout,
  LightningIcon as PhosphorLightning,
  LinkIcon as PhosphorLink,
  SpinnerGapIcon as PhosphorLoader,
  SignOutIcon as PhosphorLogOut,
  MicrophoneIcon as PhosphorMic,
  MicrophoneSlashIcon as PhosphorMicOff,
  MoonIcon as PhosphorMoon,
  OctagonIcon as PhosphorOctagon,
  PauseIcon as PhosphorPause,
  PlayIcon as PhosphorPlay,
  PlusIcon as PhosphorPlus,
  QuestionIcon as PhosphorQuestion,
  RocketLaunchIcon as PhosphorRocketLaunch,
  HardDrivesIcon as PhosphorServer,
  ShieldCheckIcon as PhosphorShieldCheck,
  StackPlusIcon as PhosphorStackPlus,
  StopIcon as PhosphorStop,
  SunIcon as PhosphorSun,
  TimerIcon as PhosphorTimer,
  TrashIcon as PhosphorTrash,
  UploadSimpleIcon as PhosphorUploadSimple,
  UserIcon as PhosphorUser,
  WarningIcon as PhosphorWarning,
  XIcon as PhosphorX,
} from "@phosphor-icons/react";
import type { IconStyle } from "@sprint/shared";
import {
  AlertTriangle,
  Box,
  Bug,
  BugOff,
  Check,
  CheckIcon,
  ChevronDown,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUp,
  CircleCheckIcon,
  CircleIcon,
  CircleQuestionMark,
  Copy,
  CreditCard,
  Download,
  Edit,
  EllipsisVertical,
  EyeClosed,
  Grid2x2Plus as GridAdd,
  GripVerticalIcon,
  Hash,
  InfoIcon,
  LayoutDashboard,
  Link,
  Loader,
  Loader2Icon,
  LogOut,
  Home as LucideHome,
  MessageSquarePlus,
  Mic,
  MicOff,
  Moon,
  OctagonXIcon,
  Pause,
  PersonStanding,
  Play,
  Plus,
  Rocket,
  RotateCcw,
  ServerIcon,
  ShieldCheck,
  Square,
  SquareCheck,
  Sun,
  Timer,
  TimerOff,
  Trash,
  TriangleAlertIcon,
  Undo,
  Undo2,
  Upload,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import { useSessionSafe } from "@/components/session-provider";

// lucide: https://lucide.dev/icons
// pixel: https://pixelarticons.com/ (CLICK "Legacy") - these ones are free
// phosphor: https://phosphoricons.com/
const icons = {
  alertTriangle: { lucide: AlertTriangle, pixel: PixelAlert, phosphor: PhosphorWarning },
  box: { lucide: Box, pixel: PixelCheckboxOn, phosphor: PhosphorCube },
  bug: { lucide: Bug, pixel: PixelDebug, phosphor: PhosphorBug },
  bugOff: { lucide: BugOff, pixel: PixelDebugOff, phosphor: PhosphorBug },
  check: { lucide: Check, pixel: PixelCheck, phosphor: PhosphorCheck },
  checkIcon: { lucide: CheckIcon, pixel: PixelCheck, phosphor: PhosphorCheck },
  checkBox: { lucide: SquareCheck, pixel: PixelCheckbox, phosphor: PhosphorCheckSquare },
  chevronDown: { lucide: ChevronDown, pixel: PixelChevronDown, phosphor: PhosphorChevronDown },
  chevronDownIcon: { lucide: ChevronDownIcon, pixel: PixelChevronDown, phosphor: PhosphorChevronDown },
  chevronLeftIcon: { lucide: ChevronLeftIcon, pixel: PixelChevronLeft, phosphor: PhosphorChevronLeft },
  chevronRightIcon: { lucide: ChevronRightIcon, pixel: PixelChevronRight, phosphor: PhosphorChevronRight },
  chevronUp: { lucide: ChevronUp, pixel: PixelChevronUp, phosphor: PhosphorChevronUp },
  circleCheck: { lucide: CircleCheckIcon, pixel: PixelCheck, phosphor: PhosphorCheckCircle },
  circleIcon: { lucide: CircleIcon, pixel: PixelCircle, phosphor: PhosphorCircle },
  circleQuestionMark: { lucide: CircleQuestionMark, pixel: PixelNoteDelete, phosphor: PhosphorQuestion },
  comment: { lucide: MessageSquarePlus, pixel: PixelCommentSend, phosphor: PhosphorComment },
  copy: { lucide: Copy, pixel: PixelCopy, phosphor: PhosphorCopy },
  creditCard: { lucide: CreditCard, pixel: PixelCreditCard, phosphor: PhosphorCreditCard },
  creditCardDelete: { lucide: CreditCard, pixel: PixelCreditCardDelete, phosphor: PhosphorCreditCard },
  download: { lucide: Download, pixel: PixelArrowBarDown, phosphor: PhosphorDownloadSimple },
  edit: { lucide: Edit, pixel: PixelEdit, phosphor: PhosphorEdit },
  ellipsisVertical: {
    lucide: EllipsisVertical,
    pixel: PixelMoreVertical,
    phosphor: PhosphorDotsThreeVertical,
  },
  eyeClosed: { lucide: EyeClosed, pixel: PixelEyeClosed, phosphor: PhosphorEyeClosed },
  gridAdd: { lucide: GridAdd, pixel: PixelGridAdd, phosphor: PhosphorStackPlus },
  gripVerticalIcon: {
    lucide: GripVerticalIcon,
    pixel: PixelViewportWide,
    phosphor: PhosphorDotsSixVertical,
  },
  hash: { lucide: Hash, pixel: PhosphorHashStraight, phosphor: PhosphorHash },
  handsUp: { lucide: PersonStanding, pixel: PixelHandsUp, phosphor: PhosphorHandsUp },
  home: { lucide: LucideHome, pixel: PixelHome, phosphor: PhosphorHome },
  info: { lucide: InfoIcon, pixel: PixelInfo, phosphor: PhosphorInfo },
  layoutDashboard: { lucide: LayoutDashboard, pixel: PixelDashboard, phosphor: PhosphorLayout },
  link: { lucide: Link, pixel: PixelLink, phosphor: PhosphorLink },
  loader: { lucide: Loader, pixel: PixelLoader, phosphor: PhosphorLoader },
  loader2: { lucide: Loader2Icon, pixel: PixelLoader, phosphor: PhosphorLoader },
  logOut: { lucide: LogOut, pixel: PixelLogout, phosphor: PhosphorLogOut },
  mic: { lucide: Mic, pixel: PixelMic, phosphor: PhosphorMic },
  micOff: { lucide: MicOff, pixel: PixelMicOff, phosphor: PhosphorMicOff },
  moon: { lucide: Moon, pixel: PixelMoon, phosphor: PhosphorMoon },
  octagonX: { lucide: OctagonXIcon, pixel: PixelClose, phosphor: PhosphorOctagon },
  pause: { lucide: Pause, pixel: PixelPause, phosphor: PhosphorPause },
  play: { lucide: Play, pixel: PixelPlay, phosphor: PhosphorPlay },
  plus: { lucide: Plus, pixel: PixelPlus, phosphor: PhosphorPlus },
  rocket: { lucide: Rocket, pixel: PixelShip, phosphor: PhosphorRocketLaunch },
  rotateCcw: { lucide: RotateCcw, pixel: PixelUndo, phosphor: PhosphorArrowCounterClockwise },
  server: { lucide: ServerIcon, pixel: PixelServer, phosphor: PhosphorServer },
  shieldCheck: { lucide: ShieldCheck, pixel: PixelShield, phosphor: PhosphorShieldCheck },
  sun: { lucide: Sun, pixel: PixelSun, phosphor: PhosphorSun },
  stop: { lucide: Square, pixel: PixelStop, phosphor: PhosphorStop },
  timer: { lucide: Timer, pixel: PixelClock, phosphor: PhosphorTimer },
  timerOff: { lucide: TimerOff, pixel: PixelClock, phosphor: PhosphorTimer },
  trash: { lucide: Trash, pixel: PixelTrash, phosphor: PhosphorTrash },
  triangleAlert: { lucide: TriangleAlertIcon, pixel: PixelAlert, phosphor: PhosphorWarning },
  undo: { lucide: Undo, pixel: PixelUndo, phosphor: PhosphorArrowCounterClockwise },
  undo2: { lucide: Undo2, pixel: PixelUndo, phosphor: PhosphorArrowCounterClockwise },
  upload: { lucide: Upload, pixel: PixelArrowBarUp, phosphor: PhosphorUploadSimple },
  userRound: { lucide: UserRound, pixel: PixelUser, phosphor: PhosphorUser },
  x: { lucide: X, pixel: PixelClose, phosphor: PhosphorX },
  zap: { lucide: Zap, pixel: PixelZap, phosphor: PhosphorLightning },
};

export type IconName = keyof typeof icons;
export const iconNames = Object.keys(icons) as IconName[];
export const iconStyles = ["pixel", "lucide", "phosphor"] as const;
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
    "pixel") as IconStyle;
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
  } else if (resolvedStyle === "pixel" && ["bug", "moon", "hash", "bugOff"].includes(icon)) {
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
