import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { CalendarDays } from 'lucide-react';
import CustomModal from '../CustomModal';
import CustomButton from '../CustomButton';
import CustomDropdown from '../CustomDropdown';
import CustomDatePicker from '../CustomDatePicker';
import { LEAVE_TYPES, LEAVE_BACKFILE_DAYS } from '../../utils/constants';
import { useCreateLeaveRequest } from '../../hooks/useLeave';

// Mirrors the backend LeaveRequest.computeTotalDays so the on-screen preview
// matches exactly what the server will persist.
function computeTotalDays(start, end, isHalfDay) {
    if (!start || !end) return 0;
    const span = moment(end).startOf('day').diff(moment(start).startOf('day'), 'days') + 1;
    if (span <= 0) return 0;
    if (isHalfDay && span === 1) return 0.5;
    return span;
}

const INITIAL_FORM = {
    leaveType: '',
    startDate: null,
    endDate: null,
    isHalfDay: false,
    reason: '',
};

function RequestLeaveModal({ isOpen, onClose }) {
    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const createLeave = useCreateLeaveRequest();

    // Earliest selectable day — today minus the allowed back-file window.
    const minDate = useMemo(
        () => moment().add(LEAVE_BACKFILE_DAYS, 'days').startOf('day').toDate(),
        [],
    );

    const isSameDay = Boolean(
        form.startDate && form.endDate && moment(form.startDate).isSame(form.endDate, 'day'),
    );
    const totalDays = computeTotalDays(form.startDate, form.endDate, isSameDay && form.isHalfDay);

    const setField = (key, value) => {
        setForm((prev) => {
            const next = { ...prev, [key]: value };

            // Pull end_date forward if start_date jumps past it.
            if (key === 'startDate' && next.endDate && moment(value).isAfter(next.endDate, 'day')) {
                next.endDate = value;
            }

            // A half day only applies to a single-day request.
            if (key === 'startDate' || key === 'endDate') {
                const stillSameDay =
                    next.startDate && next.endDate && moment(next.startDate).isSame(next.endDate, 'day');
                if (!stillSameDay) next.isHalfDay = false;
            }

            return next;
        });
        setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

    const validate = () => {
        const next = {};
        if (!form.leaveType) next.leaveType = 'Select a leave type.';
        if (!form.startDate) next.startDate = 'Select a start date.';
        if (!form.endDate) next.endDate = 'Select an end date.';
        if (
            form.startDate &&
            form.endDate &&
            moment(form.endDate).isBefore(form.startDate, 'day')
        ) {
            next.endDate = 'End date cannot be before the start date.';
        }
        if (!form.reason.trim()) next.reason = 'A short reason is required.';

        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const resetAndClose = () => {
        setForm(INITIAL_FORM);
        setErrors({});
        onClose();
    };

    const handleClose = () => {
        if (createLeave.isPending) return;
        resetAndClose();
    };

    const handleSubmit = () => {
        if (!validate()) return;

        createLeave.mutate(
            {
                leave_type: form.leaveType,
                start_date: moment(form.startDate).format('YYYY-MM-DD'),
                end_date: moment(form.endDate).format('YYYY-MM-DD'),
                is_half_day: Boolean(isSameDay && form.isHalfDay),
                reason: form.reason.trim(),
            },
            { onSuccess: resetAndClose },
        );
    };

    return (
        <CustomModal
            isOpen={isOpen}
            onClose={handleClose}
            title="Request Leave"
            size="md"
            showCloseButton
            hasRequiredFields
            footer={
                <>
                    <CustomButton
                        variant="outline"
                        size="sm"
                        onClick={handleClose}
                        disabled={createLeave.isPending}
                    >
                        Cancel
                    </CustomButton>
                    <CustomButton
                        variant="primary"
                        size="sm"
                        onClick={handleSubmit}
                        isLoading={createLeave.isPending}
                    >
                        Submit Request
                    </CustomButton>
                </>
            }
        >
            <div className="flex flex-col gap-4 text-left scrollbar-y-visible overflow-y-auto max-h-[50vh]">
                <CustomDropdown
                    label="Leave Type"
                    isRequired
                    options={LEAVE_TYPES}
                    value={form.leaveType}
                    onChange={(value) => setField('leaveType', value)}
                    renderProps="label"
                    returnProps="value"
                    placeholder="Select a leave type"
                    icon={CalendarDays}
                    error={!!errors.leaveType}
                    errorLabel={errors.leaveType}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <CustomDatePicker
                        label="Start Date"
                        isRequired
                        value={form.startDate}
                        onChange={(date) => setField('startDate', date)}
                        minDate={minDate}
                        error={!!errors.startDate}
                        errorLabel={errors.startDate}
                    />
                    <CustomDatePicker
                        label="End Date"
                        isRequired
                        value={form.endDate}
                        onChange={(date) => setField('endDate', date)}
                        minDate={form.startDate || minDate}
                        error={!!errors.endDate}
                        errorLabel={errors.endDate}
                    />
                </div>

                {isSameDay && (
                    <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            checked={form.isHalfDay}
                            onChange={(event) => setField('isHalfDay', event.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        File this as a half day
                    </label>
                )}

                <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                        Reason
                        <span className="ml-1 font-bold text-rose-500" aria-hidden="true">*</span>
                    </label>
                    <textarea
                        rows={3}
                        value={form.reason}
                        maxLength={500}
                        onChange={(event) => setField('reason', event.target.value)}
                        placeholder="Briefly describe the reason for this leave…"
                        className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-700 outline-none transition-all focus-within:ring-2 ${
                            errors.reason
                                ? 'border-rose-400 bg-rose-50/50 focus:ring-rose-500'
                                : 'border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring-blue-500'
                        }`}
                    />
                    {errors.reason && (
                        <p className="mt-1 text-xs font-medium text-rose-500">{errors.reason}</p>
                    )}
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm">
                    <span className="text-slate-500">Total leave days</span>
                    <span className="font-semibold text-slate-800">
                        {totalDays} day{totalDays === 1 ? '' : 's'}
                    </span>
                </div>

                <p className="text-[11px] leading-relaxed text-slate-400">
                    You can back-file a request up to {LEAVE_BACKFILE_DAYS} days from today. New requests
                    stay <span className="font-medium text-amber-600">pending</span> until a manager reviews them.
                </p>
            </div>
        </CustomModal>
    );
}

RequestLeaveModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default RequestLeaveModal;
