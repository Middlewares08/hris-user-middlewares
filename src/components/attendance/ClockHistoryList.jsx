import PropTypes from 'prop-types';
import { Fingerprint, AlertCircle, CheckCircle2 } from 'lucide-react';
import CustomEmptyPlaceholder from '../CustomEmptyPlaceholder';
import Loading from '../Loading';

// Shared row list for the "Clock-In History" card and its "View All" modal.
function ClockHistoryList({ history, isLoading, onSelect }) {
    if (isLoading) {
        return <Loading size="sm" text="Loading history" />;
    }

    if (history.length === 0) {
        return (
            <CustomEmptyPlaceholder
                icon={Fingerprint}
                title="No attendance records yet"
                description="Your clock-in history will show up here once you start logging your time."
                hasButton={false}
            />
        );
    }

    return (
        <div className="max-h-[60vh] overflow-y-auto scrollbar-y-visible space-y-3  "> 
            {history.map(({ id, date, timeIn, timeOut, hours, status, percent, isCurrent }) => {
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
    );
}

ClockHistoryList.propTypes = {
    history: PropTypes.arrayOf(PropTypes.object).isRequired,
    isLoading: PropTypes.bool,
};

ClockHistoryList.defaultProps = {
    isLoading: false,
};

export default ClockHistoryList;
