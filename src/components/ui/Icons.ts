/**
 * Centralized Icon Mapping from lucide-react
 * 
 * Single source of truth for all icons used in LukeAPP.
 * If icon library needs to change in the future, only this file needs updating.
 * 
 * Usage: import { Icons } from '@/components/ui/Icons'
 * Then: <Icons.Edit size={18} />
 */

import {
    // Actions
    Eye,
    Pencil,
    Trash2,
    Plus,
    ArrowLeft,
    Save,
    X,
    Check,
    Download,
    Upload,
    Copy,
    ExternalLink,
    RefreshCw,
    Search,

    // Navigation
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    ArrowRight,
    Menu,
    MoreVertical,
    MoreHorizontal,

    // Stats & Data
    Users,
    Package,
    BarChart3,
    Calendar,
    TrendingUp,
    TrendingDown,
    Activity,

    // Status & Feedback
    CheckCircle2,
    AlertTriangle,
    AlertCircle,
    Info,
    XCircle,
    Hourglass,
    Clock,

    // Context & Business
    Building2,
    FolderKanban,
    FileText,
    ClipboardList,
    Megaphone,
    Wrench,
    Ruler,
    Hammer,

    // UI Elements
    Settings,
    Filter,
    SortAsc,
    SortDesc,
    Grid,
    List,
    Maximize2,
    Minimize2,
    ZoomIn,
    ZoomOut,

    // Communication
    Mail,
    MessageSquare,
    Bell,
    Send,

    // Files & Media
    File,
    Folder,
    Image,
    Video,

    // User & Auth
    User,
    UserPlus,
    LogOut,
    LogIn,
    Lock,
    Unlock
} from 'lucide-react'

export const Icons = {
    // Actions
    View: Eye,
    Edit: Pencil,
    Delete: Trash2,
    Add: Plus,
    Back: ArrowLeft,
    Save: Save,
    Close: X,
    Check: Check,
    Download: Download,
    Upload: Upload,
    Copy: Copy,
    ExternalLink: ExternalLink,
    Refresh: RefreshCw,
    Search: Search,

    // Navigation
    ChevronLeft: ChevronLeft,
    ChevronRight: ChevronRight,
    ChevronDown: ChevronDown,
    ChevronUp: ChevronUp,
    ArrowRight: ArrowRight,
    Menu: Menu,
    MoreVertical: MoreVertical,
    MoreHorizontal: MoreHorizontal,

    // Stats & Data
    Users: Users,
    Package: Package,
    BarChart: BarChart3,
    Calendar: Calendar,
    TrendingUp: TrendingUp,
    TrendingDown: TrendingDown,
    Activity: Activity,

    // Status & Feedback
    Success: CheckCircle2,
    Warning: AlertTriangle,
    Error: AlertCircle,
    Info: Info,
    Failed: XCircle,
    Pending: Hourglass,
    Clock: Clock,

    // Context & Business
    Company: Building2,
    Project: FolderKanban,
    Document: FileText,
    Checklist: ClipboardList,
    Announcement: Megaphone,
    Tool: Wrench,
    Ruler: Ruler,
    Fabrication: Hammer,

    // UI Elements
    Settings: Settings,
    Filter: Filter,
    SortAsc: SortAsc,
    SortDesc: SortDesc,
    Grid: Grid,
    List: List,
    Maximize: Maximize2,
    Minimize: Minimize2,
    ZoomIn: ZoomIn,
    ZoomOut: ZoomOut,

    // Communication
    Mail: Mail,
    Message: MessageSquare,
    Bell: Bell,
    Send: Send,

    // Files & Media
    File: File,
    Folder: Folder,
    Image: Image,
    Video: Video,

    // User & Auth
    User: User,
    UserPlus: UserPlus,
    LogOut: LogOut,
    LogIn: LogIn,
    Lock: Lock,
    Unlock: Unlock
} as const

export type IconName = keyof typeof Icons
