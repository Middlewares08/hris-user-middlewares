// src/pages/Home.jsx
import { useState, useEffect } from 'react';
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
    Building2,
    Megaphone,
    AlertTriangle,
    Zap,
    X,
} from 'lucide-react';
import { CustomAvatar } from '../components/CustomAvatar';
import CustomEmptyPlaceholder from '../components/CustomEmptyPlaceholder';
import Loading from '../components/Loading';
import { useAuthUser } from '../hooks/useAuthUser';
import { useMyAttendanceHistory, useClockIn, useClockOut } from '../hooks/useAttendance';
import { useMyActivity } from '../hooks/useActivity';

const STATS = [
    { id: 'leave', label: 'Leave Balance', value: '12.5', suffix: 'days', icon: CalendarDays, tone: 'text-emerald-600 bg-emerald-50', barTone: 'bg-emerald-400', percent: 62, meta: '12.5 of 20 days left' },
    { id: 'attendance', label: 'Attendance', value: '96', suffix: '%', icon: TrendingUp, tone: 'text-sky-600 bg-sky-50', barTone: 'bg-sky-400', percent: 96, meta: '+2% vs last month' },
    { id: 'pending', label: 'Pending Requests', value: '2', suffix: '', icon: ClipboardList, tone: 'text-amber-600 bg-amber-50', barTone: 'bg-amber-400', percent: 40, meta: 'Awaiting approval' },
    { id: 'payday', label: 'Next Payday', value: 'Aug 30', suffix: '', icon: Wallet, tone: 'text-violet-600 bg-violet-50', barTone: 'bg-violet-400', percent: 80, meta: 'In 8 days' },
];

const QUICK_ACTIONS = [
    { id: 'time', label: 'Time In / Out', icon: Fingerprint },
    { id: 'leave', label: 'Request Leave', icon: CalendarDays },
    { id: 'payslip', label: 'View Payslip', icon: Wallet },
    { id: 'documents', label: 'My Documents', icon: FileText },
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

const ANNOUNCEMENTS = [
    { id: 1, title: 'Company town hall this Friday, 4 PM', time: '2 hours ago', priority: 'Info', icon: Megaphone },
    { id: 2, title: 'Payroll cut-off moved to Aug 28', time: 'Yesterday', priority: 'Important', icon: AlertTriangle },
];

const ANNOUNCEMENT_TONE = {
    Info: { badge: 'bg-sky-50 text-sky-700', bar: 'bg-sky-400', icon: 'text-sky-500 bg-sky-50' },
    Important: { badge: 'bg-amber-50 text-amber-700', bar: 'bg-amber-400', icon: 'text-amber-500 bg-amber-50' },
};

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
    const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);

    const firstName = user?.firstName || 'Employee';
    const lastName = user?.lastName || '';
    const position = user?.position?.name || 'Team Member';
    const department = user?.position?.department?.name || 'General';
    const employeeId = user?.id || '—';

    const { data: attendanceHistory = [], isLoading: isHistoryLoading } = useMyAttendanceHistory(5);
    const clockIn = useClockIn();
    const clockOut = useClockOut();

    const todayLog = attendanceHistory.find((record) => moment(record.log_date).isSame(moment(), 'day'));
    const isClockedIn = !!todayLog && !todayLog.time_out;
    const isPunchPending = clockIn.isPending || clockOut.isPending;

    const handleTimeClock = () => {
        if (isPunchPending) return;
        if (isClockedIn) clockOut.mutate();
        else clockIn.mutate();
    };

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

                        {/* Controls */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="hidden lg:block">
                                <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Quick Actions
                                </p>
                                <div className="space-y-1">
                                    {QUICK_ACTIONS.map(({ id, label, icon: Icon }) => {
                                        const isTimeAction = id === 'time';
                                        const displayLabel = isTimeAction ? (isClockedIn ? 'Time Out' : 'Time In') : label;

                                        return (
                                            <button
                                                key={id}
                                                type="button"
                                                onClick={isTimeAction ? handleTimeClock : undefined}
                                                disabled={isTimeAction && isPunchPending}
                                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <Icon size={16} className={isTimeAction && isClockedIn ? 'text-indigo-500' : 'text-slate-400'} />
                                                {displayLabel}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-1 border-t-0 pt-0 lg:mt-2 lg:border-t lg:border-slate-100 lg:pt-2">
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
                                >
                                    <UserPen size={16} className="text-slate-400" />
                                    Edit Profile
                                </button>
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
                                >
                                    <Settings size={16} className="text-slate-400" />
                                    Settings
                                </button>
                                <button
                                    type="button"
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
                            {STATS.map(({ id, label, value, suffix, icon: Icon, tone, barTone, percent, meta }) => (
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

                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
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
                                        {ANNOUNCEMENTS.length > 0 && (
                                            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-50 px-1.5 text-[10px] font-semibold text-rose-600">
                                                {ANNOUNCEMENTS.length}
                                            </span>
                                        )}
                                    </div>

                                    {ANNOUNCEMENTS.length === 0 ? (
                                        <p className="text-sm text-slate-500">No new announcements right now.</p>
                                    ) : (
                                        <div className="space-y-2.5">
                                            {ANNOUNCEMENTS.map(({ id, title, time, priority, icon: Icon }) => {
                                                const t = ANNOUNCEMENT_TONE[priority];
                                                return (
                                                    <div
                                                        key={id}
                                                        className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/70 py-2.5 pl-2.5 pr-3"
                                                    >
                                                        <span className={`w-1 shrink-0 rounded-full ${t.bar}`} />
                                                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${t.icon}`}>
                                                            <Icon size={15} />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-medium leading-snug text-slate-700">{title}</p>
                                                            <div className="mt-1 flex items-center gap-2">
                                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${t.badge}`}>
                                                                    {priority}
                                                                </span>
                                                                <p className="text-xs text-slate-400">{time}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
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
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* Floating Quick Actions (mobile / small screens only) */}
            <div className="fixed bottom-5 right-5 z-40 lg:hidden">
                <div
                    className={`absolute bottom-16 right-0 w-56 origin-bottom-right rounded-2xl border border-slate-200 bg-white p-2 shadow-xl transition-all duration-200 ${
                        isQuickActionsOpen
                            ? 'scale-100 opacity-100'
                            : 'pointer-events-none scale-95 opacity-0'
                    }`}
                >
                    <p className="px-2 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Quick Actions
                    </p>
                    <div className="space-y-1">
                        {QUICK_ACTIONS.map(({ id, label, icon: Icon }) => {
                            const isTimeAction = id === 'time';
                            const displayLabel = isTimeAction ? (isClockedIn ? 'Time Out' : 'Time In') : label;

                            return (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => {
                                        if (isTimeAction) handleTimeClock();
                                        setIsQuickActionsOpen(false);
                                    }}
                                    disabled={isTimeAction && isPunchPending}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Icon size={16} className={isTimeAction && isClockedIn ? 'text-indigo-500' : 'text-slate-400'} />
                                    {displayLabel}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setIsQuickActionsOpen((open) => !open)}
                    aria-expanded={isQuickActionsOpen}
                    aria-label="Toggle quick actions"
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition-transform active:scale-95 cursor-pointer"
                >
                    {isQuickActionsOpen ? <X size={22} /> : <Zap size={22} />}
                </button>
            </div>
        </div>
    );
}

export default Home;
