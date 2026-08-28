import { useState } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Clock } from 'lucide-react';
import CustomModal from '../CustomModal';
import CustomButton from '../CustomButton';
import CustomInput from '../CustomInput';
import CustomDatePicker from '../CustomDatePicker';
import { OVERTIME_BACKFILE_DAYS, MAX_OVERTIME_HOURS } from '../../utils/constants';
import { useCreateOvertimeRequest } from '../../hooks/useOvertime';

const INITIAL_FORM = {
    workDate: null,
    hours: '',
    reason: '',
};

function RequestOvertimeModal({ isOpen, onClose }) {
    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const createOvertime = useCreateOvertimeRequest();

    // Earliest selectable day — today minus the allowed back-file window; no future filing.
    const minDate = moment().subtract(OVERTIME_BACKFILE_DAYS, 'days').startOf('day').toDate();
    const maxDate = moment().endOf('day').toDate();

    const setField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

    const validate = () => {
        const next = {};
        if (!form.workDate) next.workDate = 'Select the date worked.';
        const hrs = Number(form.hours);
        if (!form.hours || !Number.isFinite(hrs) || hrs <= 0) {
            next.hours = 'Enter the overtime hours.';
        } else if (hrs > MAX_OVERTIME_HOURS) {
            next.hours = `Cannot exceed ${MAX_OVERTIME_HOURS} hours.`;
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
        if (createOvertime.isPending) return;
        resetAndClose();
    };

    const handleSubmit = () => {
        if (!validate()) return;
        createOvertime.mutate(
            {
                work_date: moment(form.workDate).format('YYYY-MM-DD'),
                hours: Number(form.hours),
                reason: form.reason.trim(),
            },
            { onSuccess: resetAndClose },
        );
    };

    return (
        <CustomModal
            isOpen={isOpen}
            onClose={handleClose}
            title="File Overtime"
            size="md"
            showCloseButton
            hasRequiredFields
            footer={
                <>
                    <CustomButton variant="outline" size="sm" onClick={handleClose} disabled={createOvertime.isPending}>
                        Cancel
                    </CustomButton>
                    <CustomButton variant="primary" size="sm" onClick={handleSubmit} isLoading={createOvertime.isPending}>
                        Submit Request
                    </CustomButton>
                </>
            }
        >
            <div className="flex flex-col gap-4 text-left scrollbar-y-visible overflow-y-auto max-h-[50vh]">
                <CustomDatePicker
                    label="Date Worked"
                    isRequired
                    value={form.workDate}
                    onChange={(date) => setField('workDate', date)}
                    minDate={minDate}
                    maxDate={maxDate}
                    error={!!errors.workDate}
                    errorLabel={errors.workDate}
                />

                <CustomInput
                    label="Overtime Hours"
                    isRequired
                    type="number"
                    icon={Clock}
                    value={form.hours}
                    min="0"
                    max={String(MAX_OVERTIME_HOURS)}
                    step="0.25"
                    placeholder="e.g. 2.5"
                    onChange={(event) => setField('hours', event.target.value)}
                    error={!!errors.hours}
                    errorLabel={errors.hours}
                />

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
                        placeholder="What was the overtime for?"
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

                <p className="text-[11px] leading-relaxed text-slate-400">
                    You can back-file up to {OVERTIME_BACKFILE_DAYS} days. Requests stay{' '}
                    <span className="font-medium text-amber-600">pending</span> until a manager approves them, and only
                    approved hours are paid.
                </p>
            </div>
        </CustomModal>
    );
}

RequestOvertimeModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default RequestOvertimeModal;
