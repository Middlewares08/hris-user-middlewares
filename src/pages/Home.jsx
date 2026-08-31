// src/pages/Home.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import moment from 'moment';
import {
    Fingerprint,
    CalendarDays,
    Wallet,
    ClipboardList,
    FileText,
    UserPen,
    Bell,
    Settings,
    LogOut,
    TrendingUp,
    Clock,
    CheckCircle2,
    AlertCircle,
    IdCard,
    Landmark,
    Building2,
    Megaphone,
    AlertTriangle,
    Zap,
    X,
} from 'lucide-react';
import { CustomAvatar } from '../components/CustomAvatar';
import CustomEmptyPlaceholder from '../components/CustomEmptyPlaceholder';
import Loading from '../components/Loading';
import RequestLeaveModal from '../components/leave/RequestLeaveModal';
import RequestOvertimeModal from '../components/overtime/RequestOvertimeModal';
import AnnouncementModal from '../components/announcement/AnnouncementModal';
import FaceVerifyModal from '../components/attendance/FaceVerifyModal';
import { useAuthUser } from '../hooks/useAuthUser';
import { useMyAttendanceHistory, useMyAttendanceRange, useClockIn, useClockOut } from '../hooks/useAttendance';
import { useNextPayday } from '../hooks/usePayslips';
import { useMyActivity } from '../hooks/useActivity';
import { useMyLeaveRequests } from '../hooks/useLeave';
import { useMyOvertimeRequests } from '../hooks/useOvertime';
import { useMyDocumentRequests } from '../hooks/useDocuments';
import { useFeatureFlag, usePublicSettings } from '../hooks/useSettings';
import { useMyFaceEnrollment } from '../hooks/useFaceEnrollment';
import { useAnnouncements } from '../hooks/useAnnouncements';
import { LEAVE_TYPES, LEAVE_STATUS_TONE, REQUEST_STATUS_TONE, ANNOUNCEMENT_PRIORITY } from '../utils/constants';

// Leave types that draw down the annual paid-leave credit (mirrors the backend note on
// the `leave.annual_credits` setting). Maternity/paternity/bereavement/unpaid don't count.
const CREDITED_LEAVE_TYPES = ['vacation', 'sick', 'emergency'];

// Builds the four dashboard tiles from live data. Everything is defensive so the cards
// still render (as 0 / —) while the underlying queries are loading or empty.
function buildStats({ leaveRequests, monthAttendance, overtimeRequests, pendingDocRequests, annualLeaveCredits, nextPayday }) {
    const now = moment();

    // --- Leave balance: annual credits minus days approved this calendar year ---
    const leaveDaysUsed = leaveRequests
        .filter((r) =>
            r.status === 'approved' &&
            CREDITED_LEAVE_TYPES.includes(r.leave_type) &&
            moment(r.start_date).isSame(now, 'year'),
        )
        .reduce((sum, r) => sum + Number(r.total_days || 0), 0);
    const leaveRemaining = Math.max(0, annualLeaveCredits - leaveDaysUsed);

    // --- Attendance: month-to-date worked days over scheduled days ---
    const workedDays = monthAttendance.reduce((sum, r) => {
        if (r.status === 'present' || r.status === 'late') return sum + 1;
        if (r.status === 'half_day') return sum + 0.5;
        return sum;
    }, 0);
    const scheduledDays = monthAttendance.filter((r) => !['holiday', 'on_leave'].includes(r.status)).length;
    const attendanceRate = scheduledDays ? Math.round((workedDays / scheduledDays) * 100) : 0;

    // --- Pending requests: leave + overtime + document requests awaiting approval ---
    const pendingLeave = leaveRequests.filter((r) => r.status === 'pending').length;
    const pendingOvertime = overtimeRequests.filter((r) => r.status === 'pending').length;
    const pendingCount = pendingLeave + pendingOvertime + pendingDocRequests;

    // --- Next payday ---
    const payDate = nextPayday?.pay_date ? moment(nextPayday.pay_date) : null;
    const daysToPayday = payDate ? payDate.clone().startOf('day').diff(now.clone().startOf('day'), 'days') : null;
    let paydayMeta = 'No pay schedule yet';
    if (payDate) {
        if (daysToPayday > 1) paydayMeta = `In ${daysToPayday} days`;
        else if (daysToPayday === 1) paydayMeta = 'Tomorrow';
        else if (daysToPayday === 0) paydayMeta = 'Today';
        else paydayMeta = `Paid ${payDate.fromNow()}`;
    }
    let paydayPercent = 0;
    if (nextPayday?.period_start && payDate) {
        const total = payDate.diff(moment(nextPayday.period_start), 'days') || 1;
        const elapsed = now.clone().startOf('day').diff(moment(nextPayday.period_start), 'days');
        paydayPercent = Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
    }

    const round1 = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

    return [
        {
            id: 'leave',
            label: 'Leave Balance',
            value: round1(leaveRemaining),
            suffix: 'days',
            icon: CalendarDays,
            tone: 'text-emerald-600 bg-emerald-50',
            barTone: 'bg-emerald-400',
            percent: annualLeaveCredits ? Math.round((leaveRemaining / annualLeaveCredits) * 100) : 0,
            meta: `${round1(leaveRemaining)} of ${annualLeaveCredits} days left`,
        },
        {
            id: 'attendance',
            label: 'Attendance',
            value: String(attendanceRate),
            suffix: '%',
            icon: TrendingUp,
            tone: 'text-sky-600 bg-sky-50',
            barTone: 'bg-sky-400',
            percent: attendanceRate,
            meta: scheduledDays
                ? `${round1(workedDays)} of ${scheduledDays} days · ${now.format('MMM')}`
                : `No records in ${now.format('MMMM')}`,
        },
        {
            id: 'pending',
            label: 'Pending Requests',
            value: String(pendingCount),
            suffix: '',
            icon: ClipboardList,
            tone: 'text-amber-600 bg-amber-50',
            barTone: 'bg-amber-400',
            percent: Math.min(100, pendingCount * 25),
            meta: pendingCount ? 'Awaiting approval' : 'All caught up',
        },
        {
            id: 'payday',
            label: 'Next Payday',
            value: payDate ? payDate.format('MMM D') : '—',
            suffix: '',
            icon: Wallet,
            tone: 'text-violet-600 bg-violet-50',
            barTone: 'bg-violet-400',
            percent: paydayPercent,
            meta: paydayMeta,
        },
    ];
}

const QUICK_ACTIONS = [
    { id: 'time', label: 'Time In / Out', icon: Fingerprint },
    { id: 'leave', label: 'Request Leave', icon: CalendarDays },
    { id: 'overtime', label: 'File Overtime', icon: Clock, flag: 'overtime.enabled' },
    { id: 'payslip', label: 'View Payslip', icon: Wallet },
    { id: 'documents', label: 'My Documents', icon: FileText },
    { id: 'government', label: 'Government & Bank', icon: Landmark },
];

// Maps an activity_logs `category` to the icon + colour tone the timeline renders.
const ACTIVITY_CATEGORY = {
    attendance: { icon: Clock, tone: 'text-indigo-600 bg-indigo-50' },
    leave: { icon: CalendarDays, tone: 'text-emerald-600 bg-emerald-50' },
    payroll: { icon: Wallet, tone: 'text-violet-600 bg-violet-50' },
    profile: { icon: UserPen, tone: 'text-sky-600 bg-sky-50' },
    document: { icon: FileText, tone: 'text-amber-600 bg-amber-50' },
    system: { icon: Zap, tone: 'text-slate-500 bg-slate-100' },
};

// Maps a raw employee.activity_logs row (from GET /activity-logs/me) into the timeline shape.
function mapActivityRecord(record, now = moment()) {
    const cat = ACTIVITY_CATEGORY[record.category] || ACTIVITY_CATEGORY.system;
    const when = moment(record.created_at);

    return {
        id: record.id,
        label: record.description,
        time: when.isSame(now, 'day')
            ? `Today, ${when.format('h:mm A')}`
            : when.isSame(now.clone().subtract(1, 'day'), 'day')
                ? `Yesterday, ${when.format('h:mm A')}`
                : when.format('MMM D, h:mm A'),
        icon: cat.icon,
        tone: cat.tone,
    };
}

const LEAVE_TYPE_LABELS = LEAVE_TYPES.reduce(
    (acc, { value, label }) => ({ ...acc, [value]: label }),
    {},
);

// Maps a raw attendance.leave_requests row (from GET /leave-requests/me) into the shape the Upcoming Leave card renders.
function mapLeaveRecord(record) {
    const start = moment(record.start_date);
    const end = moment(record.end_date);
    const sameDay = start.isSame(end, 'day');
    const days = Number(record.total_days);

    return {
        id: record.id,
        uuid: record.uuid,
        type: LEAVE_TYPE_LABELS[record.leave_type] || record.leave_type,
        range: sameDay
            ? start.format('MMM D, YYYY')
            : `${start.format('MMM D')} – ${end.format('MMM D, YYYY')}`,
        days,
        status: record.status,
        startsIn: start.isSame(moment(), 'day') ? 'Starts today' : `Starts ${start.fromNow()}`,
    };
}

// Resolves the icon name stored on ANNOUNCEMENT_PRIORITY to a concrete lucide component.
const ANNOUNCEMENT_ICONS = { Megaphone, AlertTriangle, Zap };

// Maps a raw announcement.announcements row (from GET /announcements/me) into the shape the card renders.
function mapAnnouncementRecord(record) {
    const tone = ANNOUNCEMENT_PRIORITY[record.priority] || ANNOUNCEMENT_PRIORITY.info;
    const when = record.published_at || record.created_at;

    return {
        id: record.id,
        uuid: record.uuid,
        title: record.title,
        time: when ? moment(when).fromNow() : '',
        priorityLabel: tone.label,
        tone,
        icon: ANNOUNCEMENT_ICONS[tone.icon] || Megaphone,
        raw: record,
    };
}

const ATTENDANCE_STATUS_LABELS = {
    present: 'On Time',
    late: 'Late',
    half_day: 'Half Day',
    absent: 'Absent',
    on_leave: 'On Leave',
    holiday: 'Holiday',
};

// Maps a raw attendance.attendance_logs row (from GET /attendance/me) into the shape the timeline card renders.
// `now` is injected (rather than read via moment() inline) so the caller can tick it every second for a live counter.
function mapAttendanceRecord(record, now = moment()) {
    const logDay = moment(record.log_date);
    const isToday = logDay.isSame(now, 'day');
    const isCurrent = isToday && !record.time_out;

    let hours = '—';
    let percent = 0;

    if (isCurrent && record.time_in) {
        const totalSeconds = Math.max(0, now.diff(moment(record.time_in), 'seconds'));
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        hours = `${h}h ${m}m ${String(s).padStart(2, '0')}s so far`;
        percent = Math.min(95, Math.round((totalSeconds / (8 * 3600)) * 100));
    } else if (typeof record.worked_hours === 'number') {
        const h = Math.floor(record.worked_hours);
        const m = Math.round((record.worked_hours - h) * 60);
        hours = `${h}h ${String(m).padStart(2, '0')}m`;
        percent = Math.min(100, Math.round((record.worked_hours / 8) * 100));
    }

    return {
        id: record.id,
        date: isToday ? `Today, ${logDay.format('MMM D')}` : logDay.format('MMM D'),
        timeIn: record.time_in ? moment(record.time_in).format('h:mm A') : '—',
        timeOut: record.time_out ? moment(record.time_out).format('h:mm A') : (isCurrent ? 'In Progress' : '—'),
        hours,
        status: ATTENDANCE_STATUS_LABELS[record.status] || record.status,
        percent,
        isCurrent,
    };
}

function Home() {
    const { data: user } = useAuthUser();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const [isOvertimeModalOpen, setIsOvertimeModalOpen] = useState(false);
    const [faceModalAction, setFaceModalAction] = useState(null); // null | 'in' | 'out'
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

    const { enabled: isOvertimeEnabled } = useFeatureFlag('overtime.enabled', true);
    const quickActions = QUICK_ACTIONS.filter(
        (action) => !action.flag || (action.flag === 'overtime.enabled' && isOvertimeEnabled),
    );

    const { data: documentRequests = [] } = useMyDocumentRequests();
    const pendingDocRequests = documentRequests.filter((r) => r.status === 'pending').length;
    // Per-quick-action badge count keyed by action id.
    const quickActionBadge = { documents: pendingDocRequests };

    const firstName = user?.firstName || 'Employee';
    const lastName = user?.lastName || '';
    const position = user?.position?.name || 'Team Member';
    const department = user?.position?.department?.name || 'General';
    const employeeId = user?.employeeId || '—';
    console.log('user: ', user);

    const { data: attendanceHistory = [], isLoading: isHistoryLoading } = useMyAttendanceHistory(5);
    const clockIn = useClockIn();
    const clockOut = useClockOut();

    const { enabled: faceClockinEnabled } = useFeatureFlag('face.clockin_enabled', false);
    const { enabled: faceLivenessEnabled } = useFeatureFlag('face.liveness_enabled', false);
    const { data: faceEnrollment } = useMyFaceEnrollment();
    const faceRequired = faceClockinEnabled && !!faceEnrollment?.enrolled;

    const todayLog = attendanceHistory.find((record) => moment(record.log_date).isSame(moment(), 'day'));
    const isClockedIn = !!todayLog && !todayLog.time_out;
    const isPunchPending = clockIn.isPending || clockOut.isPending;

    const runPunch = (action, { image, livenessSessionId } = {}) => {
        const args = image || livenessSessionId ? { image, livenessSessionId } : undefined;
        return action === 'out' ? clockOut.mutateAsync(args) : clockIn.mutateAsync(args);
    };

    const handleTimeClock = () => {
        if (isPunchPending) return;
        const action = isClockedIn ? 'out' : 'in';
        if (faceRequired) {
            setFaceModalAction(action);
            return;
        }
        runPunch(action).catch(() => {});
    };

    const handleFaceCapture = async ({ blob, livenessSessionId } = {}) => {
        try {
            await runPunch(faceModalAction, { image: blob, livenessSessionId });
            setFaceModalAction(null);
        } catch {
            // error toast is raised by the mutation hook; keep the modal open for a retry
        }
    };

    const handleQuickAction = (id) => {
        if (id === 'time') return handleTimeClock();
        if (id === 'leave') return setIsLeaveModalOpen(true);
        if (id === 'overtime') return setIsOvertimeModalOpen(true);
        if (id === 'payslip') return navigate('/payroll');
        if (id === 'documents') return navigate('/documents');
        if (id === 'government') return navigate('/government-details');
    };

    const handleSignOut = () => {
        localStorage.removeItem('accessToken');
        sessionStorage.removeItem('permissions');
        queryClient.clear();
        toast.success('Signed out');
        navigate('/login', { replace: true });
    };

    // Everything from the "Controls" card, flattened for the small-screen speed-dial.
    const mobileMenuActions = [
        ...quickActions.map((action) => ({
            id: action.id,
            icon: action.icon,
            label: action.id === 'time' ? (isClockedIn ? 'Time Out' : 'Time In') : action.label,
            onSelect: () => handleQuickAction(action.id),
            disabled: action.id === 'time' && isPunchPending,
            active: action.id === 'time' && isClockedIn,
            badge: quickActionBadge[action.id] || 0,
        })),
        { id: 'profile', icon: UserPen, label: 'Edit Profile', onSelect: () => navigate('/profile') },
        { id: 'settings', icon: Settings, label: 'Settings', onSelect: () => navigate('/settings') },
        { id: 'signout', icon: LogOut, label: 'Sign Out', onSelect: handleSignOut, tone: 'danger' },
    ];

    // Ticks once a second while clocked in, so the "so far" counter runs live instead of a static snapshot
    const [now, setNow] = useState(() => moment());
    useEffect(() => {
        if (!isClockedIn) return undefined;
        const interval = setInterval(() => setNow(moment()), 1000);
        return () => clearInterval(interval);
    }, [isClockedIn]);

    const clockHistory = attendanceHistory.map((record) => mapAttendanceRecord(record, now));

    const { data: activityLog = [], isLoading: isActivityLoading } = useMyActivity(4);
    const recentActivity = activityLog.map((record) => mapActivityRecord(record, now));

    const { data: announcementRecords = [], isLoading: isAnnouncementsLoading } = useAnnouncements(10);
    const announcements = announcementRecords.map(mapAnnouncementRecord);

    const { data: leaveRequests = [], isLoading: isLeaveLoading } = useMyLeaveRequests(50);
    const upcomingLeave = leaveRequests
        .filter((record) =>
            ['pending', 'approved'].includes(record.status) &&
            moment(record.end_date).isSameOrAfter(moment(), 'day'),
        )
        .sort((a, b) => moment(a.start_date).valueOf() - moment(b.start_date).valueOf())
        .slice(0, 4)
        .map(mapLeaveRecord);

    const { data: overtimeRequests = [], isLoading: isOvertimeLoading } = useMyOvertimeRequests(50);
    const recentOvertime = [...overtimeRequests]
        .sort((a, b) => moment(b.work_date).valueOf() - moment(a.work_date).valueOf())
        .slice(0, 4);

    // --- Dashboard stat tiles: all live-data backed ---
    const { data: publicSettings = {} } = usePublicSettings();
    const annualLeaveCredits = Number(publicSettings['leave.annual_credits']) || 15;

    const { data: monthAttendance = [] } = useMyAttendanceRange({
        dateFrom: moment().startOf('month').format('YYYY-MM-DD'),
        dateTo: moment().endOf('month').format('YYYY-MM-DD'),
    });

    const { data: nextPayday } = useNextPayday();

    const stats = buildStats({
        leaveRequests,
        monthAttendance,
        overtimeRequests,
        pendingDocRequests,
        annualLeaveCredits,
        nextPayday,
    });

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-6xl text-left">
                <div className="mb-6 text-left">
                    <p className="text-2xl font-semibold text-slate-900">Welcome back, {firstName}</p>
                    <p className="text-sm text-slate-500">Here's what's happening with your workspace today.</p>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
                    {/* Sidebar: profile + controls */}
                    <aside className="space-y-6">
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="h-14 bg-gradient-to-br from-indigo-50 via-sky-50 to-white" />
                            <div className="px-6 pb-6">
                                <div className="flex flex-col items-center text-center">
                                    <div className="relative -mt-10">
                                        <CustomAvatar
                                            firstName={firstName}
                                            lastName={lastName}
                                            src={user?.avatarUrl}
                                            size="h-20 w-20 text-xl"
                                            className="ring-4 ring-white"
                                        />
                                        <span className="absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full border-2 border-white bg-emerald-500">
                                            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-75" />
                                       </span>
                                    </div>
                                    <p className="mt-3 text-base font-semibold text-slate-900">
                                        {firstName} {lastName}
                                    </p>
                                    <p className="text-sm text-slate-500">{position}</p>

                                    <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        Active
                                    </span>
                                </div>

                                <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm">
                                            <IdCard size={15} />
                                        </div>
                                        <div className="min-w-0 text-left">
                                            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Employee ID</p>
                                            <p className="truncate text-sm font-medium text-slate-700">{employeeId}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm">
                                            <Building2 size={15} />
                                        </div>
                                        <div className="min-w-0 text-left">
                                            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Department</p>
                                            <p className="truncate text-sm font-medium text-slate-700">{department}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Controls — small screens use the floating speed-dial instead */}
                        <div className="hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:block">
                            <div className="hidden lg:block">
                                <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Quick Actions
                                </p>
                                <div className="space-y-1">
                                    {quickActions.map(({ id, label, icon: Icon }) => {
                                        const isTimeAction = id === 'time';
                                        const displayLabel = isTimeAction ? (isClockedIn ? 'Time Out' : 'Time In') : label;
                                        const badge = quickActionBadge[id] || 0;

                                        return (
                                            <button
                                                key={id}
                                                type="button"
                                                onClick={() => handleQuickAction(id)}
                                                disabled={isTimeAction && isPunchPending}
                                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <Icon size={16} className={isTimeAction && isClockedIn ? 'text-indigo-500' : 'text-slate-400'} />
                                                {displayLabel}
                                                {badge > 0 && (
                                                    <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-700">
                                                        {badge}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-1 border-t-0 pt-0 lg:mt-2 lg:border-t lg:border-slate-100 lg:pt-2">
                                <button
                                    type="button"
                                    onClick={() => navigate('/profile')}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
                                >
                                    <UserPen size={16} className="text-slate-400" />
                                    Edit Profile
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/settings')}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
                                >
                                    <Settings size={16} className="text-slate-400" />
                                    Settings
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSignOut}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 cursor-pointer"
                                >
                                    <LogOut size={16} />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* Main: stats + activity */}
                    <main className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            {stats.map(({ id, label, value, suffix, icon: Icon, tone, barTone, percent, meta }) => (
                                <div
                                    key={id}
                                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                                >
                                    <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
                                        <Icon size={18} />
                                    </div>
                                    <p className="mt-3 text-xl font-semibold text-slate-900">
                                        {value}
                                        {suffix && <span className="ml-1 text-sm font-medium text-slate-400">{suffix}</span>}
                                    </p>
                                    <p className="text-xs font-medium text-slate-500">{label}</p>

                                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${barTone}`}
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                    <p className="mt-1.5 text-[11px] text-slate-400">{meta}</p>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                            {/* Clock-in history */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-2 text-indigo-500">
                                            <Fingerprint size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">Clock-In History</p>
                                            <p className="text-xs text-slate-400">Weekly shift timeline</p>
                                        </div>
                                    </div>
                                    {/* <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                                        <TrendingUp size={12} /> 98% Punctual
                                    </span> */}
                                </div>

                                {isHistoryLoading ? (
                                    <Loading size="sm" text="Loading history" />
                                ) : clockHistory.length === 0 ? (
                                    <CustomEmptyPlaceholder
                                        icon={Fingerprint}
                                        title="No attendance records yet"
                                        description="Your clock-in history will show up here once you start logging your time."
                                        hasButton={false}
                                    />
                                ) : (
                                    <div className="space-y-3">
                                        {clockHistory.map(({ id, date, timeIn, timeOut, hours, status, percent, isCurrent }) => {
                                            const isLate = status === 'Late';

                                            return (
                                                <div
                                                    key={id}
                                                    className={`rounded-xl border p-3.5 transition-colors ${
                                                        isCurrent
                                                            ? 'border-indigo-200 bg-indigo-50/60'
                                                            : 'border-slate-100 bg-slate-50/70 hover:border-slate-200'
                                                    }`}
                                                >
                                                    <div className="mb-2 flex items-center justify-between text-xs">
                                                        <span className={`font-semibold ${isCurrent ? 'text-indigo-600' : 'text-slate-700'}`}>
                                                            {date}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-[11px] text-slate-400">{hours}</span>
                                                            <span
                                                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                                    isLate
                                                                        ? 'bg-amber-50 text-amber-700'
                                                                        : 'bg-emerald-50 text-emerald-700'
                                                                }`}
                                                            >
                                                                {isLate ? <AlertCircle size={10} /> : <CheckCircle2 size={10} />}
                                                                {status}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="relative my-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${
                                                                isCurrent
                                                                    ? 'animate-pulse bg-gradient-to-r from-indigo-500 to-indigo-400'
                                                                    : isLate
                                                                        ? 'bg-amber-400'
                                                                        : 'bg-emerald-400'
                                                            }`}
                                                            style={{ width: `${percent}%` }}
                                                        />
                                                    </div>

                                                    <div className="mt-1.5 flex justify-between font-mono text-[11px] text-slate-500">
                                                        <span>In: <strong className="text-slate-700">{timeIn}</strong></span>
                                                        <span>Out: <strong className={isCurrent ? 'italic text-indigo-600' : 'text-slate-700'}>{timeOut}</strong></span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Announcements + recent activity */}
                            <div className="space-y-6">
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="mb-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Bell size={16} className="text-slate-400" />
                                            <p className="text-sm font-semibold text-slate-900">Announcements</p>
                                        </div>
                                        {announcements.length > 0 && (
                                            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-50 px-1.5 text-[10px] font-semibold text-rose-600">
                                                {announcements.length}
                                            </span>
                                        )}
                                    </div>

                                    {isAnnouncementsLoading ? (
                                        <p className="text-sm text-slate-500">Loading announcements…</p>
                                    ) : announcements.length === 0 ? (
                                        <p className="text-sm text-slate-500">No new announcements right now.</p>
                                    ) : (
                                        <div className="space-y-2.5">
                                            {announcements.map(({ id, title, time, priorityLabel, tone, icon: Icon, raw }) => (
                                                <button
                                                    key={id}
                                                    type="button"
                                                    onClick={() => setSelectedAnnouncement(raw)}
                                                    className="flex w-full gap-3 rounded-xl border border-slate-100 bg-slate-50/70 py-2.5 pl-2.5 pr-3 text-left transition-colors hover:bg-slate-100 cursor-pointer"
                                                >
                                                    <span className={`w-1 shrink-0 rounded-full ${tone.bar}`} />
                                                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone.iconWrap}`}>
                                                        <Icon size={15} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-medium leading-snug text-slate-700">{title}</p>
                                                        <div className="mt-1 flex items-center gap-2">
                                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone.badge}`}>
                                                                {priorityLabel}
                                                            </span>
                                                            <p className="text-xs text-slate-400">{time}</p>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <p className="mb-4 text-sm font-semibold text-slate-900">Recent Activity</p>
                                    {isActivityLoading ? (
                                        <p className="text-sm text-slate-500">Loading activity…</p>
                                    ) : recentActivity.length === 0 ? (
                                        <p className="text-sm text-slate-500">No recent activity yet.</p>
                                    ) : (
                                        <div className="relative space-y-5">
                                            <div className="absolute bottom-4 left-4 top-4 w-px bg-slate-100" />
                                            {recentActivity.map(({ id, label, time, icon: Icon, tone }) => (
                                                <div key={id} className="relative flex items-center gap-3">
                                                    <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-white ${tone}`}>
                                                        <Icon size={15} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium text-slate-700">{label}</p>
                                                        <p className="text-xs text-slate-400">{time}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Upcoming leave */}
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CalendarDays size={16} className="text-slate-400" />
                                            <p className="text-sm font-semibold text-slate-900">Upcoming Leave</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsLeaveModalOpen(true)}
                                            className="text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-700 cursor-pointer"
                                        >
                                            Request
                                        </button>
                                    </div>

                                    {isLeaveLoading ? (
                                        <p className="text-sm text-slate-500">Loading leave…</p>
                                    ) : upcomingLeave.length === 0 ? (
                                        <p className="text-sm text-slate-500">No upcoming leave scheduled.</p>
                                    ) : (
                                        <div className="space-y-2.5">
                                            {upcomingLeave.map(({ id, type, range, days, status, startsIn }) => (
                                                <div
                                                    key={id}
                                                    className="rounded-xl border border-slate-100 bg-slate-50/70 p-3"
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="truncate text-sm font-medium text-slate-700">{type}</p>
                                                        <span
                                                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                                                                LEAVE_STATUS_TONE[status] || 'bg-slate-100 text-slate-500'
                                                            }`}
                                                        >
                                                            {status}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                                                        <span>{range}</span>
                                                        <span>
                                                            {days} day{days === 1 ? '' : 's'} · {startsIn}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Overtime */}
                                {isOvertimeEnabled && (
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="mb-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Clock size={16} className="text-slate-400" />
                                                <p className="text-sm font-semibold text-slate-900">Overtime</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setIsOvertimeModalOpen(true)}
                                                className="text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-700 cursor-pointer"
                                            >
                                                File
                                            </button>
                                        </div>

                                        {isOvertimeLoading ? (
                                            <p className="text-sm text-slate-500">Loading overtime…</p>
                                        ) : recentOvertime.length === 0 ? (
                                            <p className="text-sm text-slate-500">No overtime filed yet.</p>
                                        ) : (
                                            <div className="space-y-2.5">
                                                {recentOvertime.map((row) => (
                                                    <div
                                                        key={row.id}
                                                        className="rounded-xl border border-slate-100 bg-slate-50/70 p-3"
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className="truncate text-sm font-medium text-slate-700">
                                                                {Number(row.hours)} hour{Number(row.hours) === 1 ? '' : 's'}
                                                            </p>
                                                            <span
                                                                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                                                                    REQUEST_STATUS_TONE[row.status] || 'bg-slate-100 text-slate-500'
                                                                }`}
                                                            >
                                                                {row.status}
                                                            </span>
                                                        </div>
                                                        <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                                                            <span>{moment(row.work_date).format('MMM D, YYYY')}</span>
                                                            <span className="truncate pl-2">{row.reason}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            <RequestLeaveModal
                isOpen={isLeaveModalOpen}
                onClose={() => setIsLeaveModalOpen(false)}
            />

            <RequestOvertimeModal
                isOpen={isOvertimeModalOpen}
                onClose={() => setIsOvertimeModalOpen(false)}
            />

            {faceModalAction && (
                <FaceVerifyModal
                    action={faceModalAction}
                    liveness={faceLivenessEnabled}
                    submitting={isPunchPending}
                    onClose={() => setFaceModalAction(null)}
                    onCapture={handleFaceCapture}
                />
            )}

            <AnnouncementModal
                isOpen={Boolean(selectedAnnouncement)}
                onClose={() => setSelectedAnnouncement(null)}
                announcement={selectedAnnouncement}
            />

            {/* Floating Quick Actions — speed-dial, mobile / small screens only */}
            <div className="lg:hidden">
                {/* Backdrop — tap anywhere to dismiss */}
                <div
                    onClick={() => setIsQuickActionsOpen(false)}
                    className={`fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[2px] transition-opacity duration-200 ${
                        isQuickActionsOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
                    }`}
                />

                <div className="fixed bottom-5 right-5 z-50 flex max-h-[80vh] flex-col items-end gap-3 overflow-y-auto py-1 pr-1">
                    {mobileMenuActions.map(({ id, label, icon: Icon, onSelect, disabled, active, tone, badge }, index) => {
                        const isDanger = tone === 'danger';
                        // Items nearest the FAB animate first when opening.
                        const delay = isQuickActionsOpen ? (mobileMenuActions.length - 1 - index) * 35 : 0;

                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => {
                                    onSelect();
                                    setIsQuickActionsOpen(false);
                                }}
                                disabled={disabled || !isQuickActionsOpen}
                                style={{ transitionDelay: `${delay}ms` }}
                                className={`flex items-center gap-3 transition-all duration-200 disabled:cursor-not-allowed ${
                                    isQuickActionsOpen
                                        ? 'translate-y-0 opacity-100'
                                        : 'pointer-events-none translate-y-3 opacity-0'
                                }`}
                            >
                                <span
                                    className={`rounded-lg px-3 py-1.5 text-sm font-medium shadow-md ${
                                        isDanger ? 'bg-white text-rose-600' : 'bg-white text-slate-700'
                                    }`}
                                >
                                    {label}
                                </span>
                                <span
                                    className={`relative flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-lg ${
                                        isDanger ? 'text-rose-500' : active ? 'text-indigo-500' : 'text-slate-500'
                                    }`}
                                >
                                    <Icon size={18} />
                                    {badge > 0 && (
                                        <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">
                                            {badge}
                                        </span>
                                    )}
                                </span>
                            </button>
                        );
                    })}

                    <button
                        type="button"
                        onClick={() => setIsQuickActionsOpen((open) => !open)}
                        aria-expanded={isQuickActionsOpen}
                        aria-label="Toggle quick actions"
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition-transform duration-200 active:scale-95 cursor-pointer"
                    >
                        <span className={`transition-transform duration-200 ${isQuickActionsOpen ? 'rotate-90' : ''}`}>
                            {isQuickActionsOpen ? <X size={22} /> : <Zap size={22} />}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Home;
