// src/utils/dashboardMappers.js
import moment from 'moment';
import { Clock, CalendarDays, Wallet, UserPen, FileText, Zap } from 'lucide-react';

// Maps an activity_logs `category` to the icon + colour tone the timeline renders.
export const ACTIVITY_CATEGORY = {
    attendance: { icon: Clock, tone: 'text-indigo-600 bg-indigo-50' },
    leave: { icon: CalendarDays, tone: 'text-emerald-600 bg-emerald-50' },
    payroll: { icon: Wallet, tone: 'text-violet-600 bg-violet-50' },
    profile: { icon: UserPen, tone: 'text-sky-600 bg-sky-50' },
    document: { icon: FileText, tone: 'text-amber-600 bg-amber-50' },
    system: { icon: Zap, tone: 'text-slate-500 bg-slate-100' },
};

// Maps a raw employee.activity_logs row (from GET /activity-logs/me) into the timeline shape.
export function mapActivityRecord(record, now = moment()) {
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
        raw: record,
    };
}

export const ATTENDANCE_STATUS_LABELS = {
    present: 'On Time',
    late: 'Late',
    half_day: 'Half Day',
    absent: 'Absent',
    on_leave: 'On Leave',
    holiday: 'Holiday',
};

// Maps a raw attendance.attendance_logs row (from GET /attendance/me) into the shape the timeline card renders.
// `now` is injected (rather than read via moment() inline) so the caller can tick it every second for a live counter.
export function mapAttendanceRecord(record, now = moment()) {
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
        raw: record,
    };
}
