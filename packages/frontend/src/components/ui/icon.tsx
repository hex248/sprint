import {
    Alert as PixelAlert,
    Check as PixelCheck,
    ChevronDown as PixelChevronDown,
    ChevronLeft as PixelChevronLeft,
    ChevronRight as PixelChevronRight,
    ChevronUp as PixelChevronUp,
    Circle as PixelCircle,
    Clock as PixelClock,
    Close as PixelClose,
    Edit as PixelEdit,
    Home as PixelHome,
    InfoBox as PixelInfo,
    Link as PixelLink,
    Loader as PixelLoader,
    Logout as PixelLogout,
    Moon as PixelMoon,
    MoreVertical as PixelMoreVertical,
    NoteDelete as PixelNoteDelete,
    Plus as PixelPlus,
    Server as PixelServer,
    Sun as PixelSun,
    Trash as PixelTrash,
    Undo as PixelUndo,
    User as PixelUser,
    ViewportWide as PixelViewportWide,
} from "@nsmr/pixelart-react";
import {
    CheckIcon as PhosphorCheck,
    CheckCircleIcon as PhosphorCheckCircle,
    CaretDownIcon as PhosphorChevronDown,
    CaretLeftIcon as PhosphorChevronLeft,
    CaretRightIcon as PhosphorChevronRight,
    CaretUpIcon as PhosphorChevronUp,
    CircleIcon as PhosphorCircle,
    ClockIcon as PhosphorClock,
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
    PlusIcon as PhosphorPlus,
    QuestionIcon as PhosphorQuestion,
    HardDrivesIcon as PhosphorServer,
    SunIcon as PhosphorSun,
    TrashIcon as PhosphorTrash,
    ArrowCounterClockwiseIcon as PhosphorUndo,
    UserIcon as PhosphorUser,
    WarningIcon as PhosphorWarning,
    XIcon as PhosphorX,
} from "@phosphor-icons/react";
import {
    AlertTriangle,
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
    Moon,
    OctagonXIcon,
    Plus,
    ServerIcon,
    Sun,
    Timer,
    Trash,
    TriangleAlertIcon,
    Undo,
    Undo2,
    UserRound,
    X,
} from "lucide-react";

const icons = {
    alertTriangle: { lucide: AlertTriangle, pixel: PixelAlert, phosphor: PhosphorWarning },
    check: { lucide: Check, pixel: PixelCheck, phosphor: PhosphorCheck },
    checkIcon: { lucide: CheckIcon, pixel: PixelCheck, phosphor: PhosphorCheck },
    chevronDown: { lucide: ChevronDown, pixel: PixelChevronDown, phosphor: PhosphorChevronDown },
    chevronDownIcon: { lucide: ChevronDownIcon, pixel: PixelChevronDown, phosphor: PhosphorChevronDown },
    chevronLeftIcon: { lucide: ChevronLeftIcon, pixel: PixelChevronLeft, phosphor: PhosphorChevronLeft },
    chevronRightIcon: { lucide: ChevronRightIcon, pixel: PixelChevronRight, phosphor: PhosphorChevronRight },
    chevronUp: { lucide: ChevronUp, pixel: PixelChevronUp, phosphor: PhosphorChevronUp },
    chevronUpIcon: { lucide: ChevronUpIcon, pixel: PixelChevronUp, phosphor: PhosphorChevronUp },
    circleCheckIcon: { lucide: CircleCheckIcon, pixel: PixelCheck, phosphor: PhosphorCheckCircle },
    circleIcon: { lucide: CircleIcon, pixel: PixelCircle, phosphor: PhosphorCircle },
    circleQuestionMark: { lucide: CircleQuestionMark, pixel: PixelNoteDelete, phosphor: PhosphorQuestion },
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
    plus: { lucide: Plus, pixel: PixelPlus, phosphor: PhosphorPlus },
    serverIcon: { lucide: ServerIcon, pixel: PixelServer, phosphor: PhosphorServer },
    sun: { lucide: Sun, pixel: PixelSun, phosphor: PhosphorSun },
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
export type IconStyle = (typeof iconStyles)[number];

export default function Icon({
    icon,
    iconStyle = "lucide",
    size = 24,
    ...props
}: {
    icon: IconName;
    iconStyle?: IconStyle;
    size?: number | string;
    color?: string;
} & React.ComponentProps<"svg">) {
    const IconComponent = icons[icon]?.[iconStyle];

    if (!IconComponent) {
        return null;
    }

    return (
        <IconComponent
            size={size}
            fill={
                (iconStyle === "pixel" && icon === "moon") ||
                (iconStyle === "pixel" && icon === "hash") ||
                iconStyle === "phosphor"
                    ? "var(--foreground)"
                    : "transparent"
            }
            {...props}
        />
    );
}
