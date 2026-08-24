// src/pages/Home.jsx
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
import { useAuthUser } from '../hooks/useAuthUser';

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

const ACTIVITY = [
    { id: 1, label: 'Clocked in', time: 'Today, 8:58 AM', icon: Clock, tone: 'text-indigo-600 bg-indigo-50' },
    { id: 2, label: 'Leave request approved', time: 'Yesterday, 4:12 PM', icon: CheckCircle2, tone: 'text-emerald-600 bg-emerald-50' },
    { id: 3, label: 'Payslip for July released', time: 'Aug 15, 9:00 AM', icon: Wallet, tone: 'text-violet-600 bg-violet-50' },
];

const ANNOUNCEMENTS = [
    { id: 1, title: 'Company town hall this Friday, 4 PM', time: '2 hours ago', priority: 'Info', icon: Megaphone },
    { id: 2, title: 'Payroll cut-off moved to Aug 28', time: 'Yesterday', priority: 'Important', icon: AlertTriangle },
];

const ANNOUNCEMENT_TONE = {
    Info: { badge: 'bg-sky-50 text-sky-700', bar: 'bg-sky-400', icon: 'text-sky-500 bg-sky-50' },
    Important: { badge: 'bg-amber-50 text-amber-700', bar: 'bg-amber-400', icon: 'text-amber-500 bg-amber-50' },
};

const CLOCK_HISTORY = [
    { id: 1, date: 'Today, Aug 22', timeIn: '8:58 AM', timeOut: 'In Progress', hours: '4h 39m so far', status: 'On Time', percent: 60, isCurrent: true },
    { id: 2, date: 'Aug 21', timeIn: '8:55 AM', timeOut: '6:02 PM', hours: '9h 07m', status: 'On Time', percent: 100 },
    { id: 3, date: 'Aug 20', timeIn: '9:12 AM', timeOut: '6:00 PM', hours: '8h 48m', status: 'Late', percent: 95 },
    { id: 4, date: 'Aug 19', timeIn: '8:50 AM', timeOut: '5:58 PM', hours: '9h 08m', status: 'On Time', percent: 100 },
    { id: 5, date: 'Aug 18', timeIn: '8:49 AM', timeOut: '6:05 PM', hours: '9h 16m', status: 'On Time', percent: 100 },
];

function Home() {
    const { data: user } = useAuthUser();
    const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);

    console.log('USERRL: ', user)
    const firstName = user?.firstName || 'Employee';
    const lastName = user?.lastName || '';
    const position = user?.position?.name || 'Team Member';
    const department = user?.position?.department?.name || 'General';
    const employeeId = user?.id || '—';

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
                                    {QUICK_ACTIONS.map(({ id, label, icon: Icon }) => (
                                        <button
                                            key={id}
                                            type="button"
                                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
                                        >
                                            <Icon size={16} className="text-slate-400" />
                                            {label}
                                        </button>
                                    ))}
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
                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                                        <TrendingUp size={12} /> 98% Punctual
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {CLOCK_HISTORY.map(({ id, date, timeIn, timeOut, hours, status, percent, isCurrent }) => {
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
                                    <div className="relative space-y-5">
                                        <div className="absolute bottom-4 left-4 top-4 w-px bg-slate-100" />
                                        {ACTIVITY.map(({ id, label, time, icon: Icon, tone }) => (
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
                        {QUICK_ACTIONS.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setIsQuickActionsOpen(false)}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
                            >
                                <Icon size={16} className="text-slate-400" />
                                {label}
                            </button>
                        ))}
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
