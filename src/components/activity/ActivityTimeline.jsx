import PropTypes from 'prop-types';

// Shared timeline for the "Recent Activity" card and its "View All" modal.
function ActivityTimeline({ activity, isLoading }) {
    if (isLoading) {
        return <p className="text-sm text-slate-500">Loading activity…</p>;
    }

    if (activity.length === 0) {
        return <p className="text-sm text-slate-500">No recent activity yet.</p>;
    }

    return (
        <div className="relative max-h-[60vh] overflow-y-auto scrollbar-y-visible space-y-5">
            <div className="absolute bottom-4 left-4 top-4 w-px bg-slate-100" />
            {activity.map(({ id, label, time, icon: Icon, tone }) => (
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
    );
}

ActivityTimeline.propTypes = {
    activity: PropTypes.arrayOf(PropTypes.object).isRequired,
    isLoading: PropTypes.bool,
};

ActivityTimeline.defaultProps = {
    isLoading: false,
};

export default ActivityTimeline;
