import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import CustomModal from '../CustomModal';
import { useMyHolidays } from '../../hooks/useSchedule';

const TYPE_META = {
    regular: { label: 'Regular holiday', cls: 'bg-indigo-50 text-indigo-600' },
    special_non_working: { label: 'Special (non-working)', cls: 'bg-amber-50 text-amber-600' },
    special_working: { label: 'Special (working)', cls: 'bg-slate-100 text-slate-500' },
};

const MONTHS = moment.months();

function HolidayCalendarModal({ isOpen, onClose }) {
    const [year, setYear] = useState(moment().year());
    const { data: holidays = [], isLoading } = useMyHolidays(year);

    const todayStr = moment().format('YYYY-MM-DD');

    const byMonth = useMemo(() => {
        const groups = Array.from({ length: 12 }, () => []);
        [...holidays]
            .sort((a, b) => String(a.date).localeCompare(String(b.date)))
            .forEach((h) => {
                const d = moment(String(h.date).slice(0, 10), 'YYYY-MM-DD');
                if (d.isValid()) groups[d.month()].push(h);
            });
        return groups;
    }, [holidays]);

    const nextUp = useMemo(
        () => [...holidays]
            .filter((h) => String(h.date).slice(0, 10) >= todayStr)
            .sort((a, b) => String(a.date).localeCompare(String(b.date)))[0] || null,
        [holidays, todayStr],
    );

    return (
        <CustomModal isOpen={isOpen} onClose={onClose} title="Holiday Calendar" size="lg" showCloseButton>
            <div className="space-y-4  overflow-y-auto scrollbar-y-visible text-left">
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                    <button
                        type="button"
                        onClick={() => setYear((y) => y - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white"
                        aria-label="Previous year"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span className="text-sm font-bold text-slate-700">{year}</span>
                    <button
                        type="button"
                        onClick={() => setYear((y) => y + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white"
                        aria-label="Next year"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>

                {nextUp && year === moment().year() && (
                    <div className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-3">
                        <CalendarDays size={18} className="shrink-0 text-indigo-600" />
                        <div className="text-sm">
                            <p className="font-semibold text-indigo-900">{nextUp.name}</p>
                            <p className="text-xs text-indigo-600">
                                {moment(String(nextUp.date).slice(0, 10)).format('dddd, MMMM D')} · {moment(String(nextUp.date).slice(0, 10)).fromNow()}
                            </p>
                        </div>
                    </div>
                )}

                <div className="max-h-[35vh] space-y-4  overflow-y-auto scrollbar-y-visible pr-1">
                    {isLoading ? (
                        <div className="space-y-2">
                            {[0, 1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}
                        </div>
                    ) : holidays.length === 0 ? (
                        <p className="py-8 text-center text-sm text-slate-400">No holidays listed for {year}.</p>
                    ) : (
                        byMonth.map((items, mi) => (
                            items.length > 0 && (
                                <div key={mi}>
                                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">{MONTHS[mi]}</p>
                                    <div className="overflow-hidden rounded-xl border border-slate-100">
                                        {items.map((h) => {
                                            const dateStr = String(h.date).slice(0, 10);
                                            const isToday = dateStr === todayStr;
                                            const meta = TYPE_META[h.type] || TYPE_META.regular;
                                            return (
                                                <div
                                                    key={h.uuid || dateStr + h.name}
                                                    className={`flex items-center justify-between gap-3 border-b border-slate-50 px-3 py-2.5 last:border-0 ${isToday ? 'bg-indigo-50/60' : ''}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white">
                                                            <span className="text-[10px] font-semibold uppercase text-slate-400">{moment(dateStr).format('ddd')}</span>
                                                            <span className="text-sm font-bold leading-none text-slate-700 pb-2">{moment(dateStr).format('D')}</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-800">{h.name}</p>
                                                            <span className={`mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${meta.cls}`}>
                                                                {meta.label}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {isToday && <span className="text-[10px] font-bold uppercase text-indigo-600">Today</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )
                        ))
                    )}
                </div>

                <p className="text-[11px] text-slate-400 text-center!">
                    Non-working holidays are excluded from your attendance rate and never counted as absences.
                </p>
            </div>
        </CustomModal>
    );
}

HolidayCalendarModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default HolidayCalendarModal;
