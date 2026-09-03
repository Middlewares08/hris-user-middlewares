import PropTypes from 'prop-types';
import moment from 'moment';
import { CalendarClock, CalendarDays } from 'lucide-react';
import { useMySchedule } from '../../hooks/useSchedule';

const WEEKDAYS = [
    { wd: 1, s: 'M' }, { wd: 2, s: 'T' }, { wd: 3, s: 'W' }, { wd: 4, s: 'T' },
    { wd: 5, s: 'F' }, { wd: 6, s: 'S' }, { wd: 0, s: 'S' },
];
const hhmm = (t) => {
    if (!t) return '';
    const m = moment(String(t).slice(0, 8), ['HH:mm:ss', 'HH:mm']);
    return m.isValid() ? m.format('h:mm A') : String(t).slice(0, 5);
};

/** Read-only "My Schedule" card for the employee home dashboard. */
function MyScheduleCard({ onOpenHolidays }) {
    const { data, isLoading } = useMySchedule();

    if (isLoading) {
        return <div className="h-40 animate-pulse rounded-2xl border border-slate-100 bg-slate-50" />;
    }
    if (!data?.schedule) return null;

    const { schedule, today } = data;
    const days = schedule.days || [];
    const sample = days.find((d) => d.is_workday);

    const todayLine = today.isHoliday
        ? `Holiday — ${today.holidayName}`
        : today.isRestDay
            ? 'Rest day today'
            : today.scheduledStart
                ? `Today ${moment(today.scheduledStart).format('h:mm A')} – ${moment(today.scheduledEnd).format('h:mm A')}`
                : 'No shift today';

    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <CalendarClock size={18} />
                    </span>
                    <div>
                        <p className="text-sm font-bold text-slate-800">{schedule.name}</p>
                        <p className="text-xs text-slate-400">
                            {sample
                                ? `${hhmm(sample.start_time)} – ${hhmm(sample.end_time)} · ${sample.break_minutes || 0}m break`
                                : 'No working days set'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="my-4 flex gap-1.5">
                {WEEKDAYS.map(({ wd, s }, i) => {
                    const d = days.find((x) => Number(x.weekday) === wd);
                    const on = d?.is_workday;
                    const isToday = moment().day() === wd;
                    return (
                        <div
                            key={i}
                            title={on ? `${hhmm(d.start_time)}–${hhmm(d.end_time)}` : 'Rest day'}
                            className={`flex h-8 flex-1 items-center justify-center rounded-lg text-xs font-bold ${
                                on ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-300'
                            } ${isToday ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}`}
                        >
                            {s}
                        </div>
                    );
                })}
            </div>

            <p className={`mt-3 text-xs font-medium ${today.isHoliday ? 'text-indigo-600' : today.isRestDay ? 'text-slate-400' : 'text-slate-600'}`}>
                {todayLine}
                {!today.isRestDay && !today.isHoliday && ` · ${schedule.grace_minutes ?? 0} min grace`}
            </p>
        </div>
    );
}

MyScheduleCard.propTypes = {
    onOpenHolidays: PropTypes.func,
};

export default MyScheduleCard;
