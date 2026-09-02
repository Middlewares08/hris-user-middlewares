import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import CustomModal from '../CustomModal';
import CustomButton from '../CustomButton';
import CustomDropdown from '../CustomDropdown';
import { useCreatePayslipRequest } from '../../hooks/usePayslips';

const peso = (v) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(v) || 0);

const periodLabel = (slip) => {
    const p = slip?.run?.period;
    if (p?.name) return p.name;
    if (p?.period_start && p?.period_end) {
        return `${moment(p.period_start).format('MMM D')} – ${moment(p.period_end).format('MMM D, YYYY')}`;
    }
    return 'Payslip';
};

function RequestPayslipModal({ isOpen, onClose, payslips = [], presetUuid = null }) {
    const [payslipUuid, setPayslipUuid] = useState(presetUuid);
    const [reason, setReason] = useState('');
    const [errors, setErrors] = useState({});
    const createRequest = useCreatePayslipRequest();

    useEffect(() => {
        if (isOpen) {
            setPayslipUuid(presetUuid);
            setReason('');
            setErrors({});
        }
    }, [isOpen, presetUuid]);

    const options = payslips.map((s) => ({
        id: s.uuid,
        value: s.uuid,
        label: `${periodLabel(s)} · ${peso(s.net_pay)}`,
    }));

    const resetAndClose = () => {
        setPayslipUuid(null);
        setReason('');
        setErrors({});
        onClose();
    };

    const handleClose = () => {
        if (createRequest.isPending) return;
        resetAndClose();
    };

    const handleSubmit = () => {
        const next = {};
        if (!payslipUuid) next.payslipUuid = 'Select the payslip you need a copy of.';
        if (!reason.trim()) next.reason = 'Tell HR what the copy is for.';
        setErrors(next);
        if (Object.keys(next).length) return;

        createRequest.mutate(
            { payslip_uuid: payslipUuid, reason: reason.trim() },
            { onSuccess: resetAndClose },
        );
    };

    return (
        <CustomModal
            isOpen={isOpen}
            onClose={handleClose}
            title="Request Payslip Copy"
            size="md"
            showCloseButton
            hasRequiredFields
            footer={
                <>
                    <CustomButton 
                        variant="primary" 
                        size="sm" 
                        onClick={handleSubmit} 
                        isLoading={createRequest.isPending}
                        className='flex py-2 items-center gap-2 hover:cursor-pointer px-4 bg-slate-700 text-white rounded-lg text-sm! font-medium hover:bg-slate-600 transition-colors shadow-xs'
                        children='Submit Request'
                    />
                        
                </>
            }
        >
            <div className="flex max-h-[50vh] flex-col gap-4 overflow-y-auto text-left">
                {options.length === 0 ? (
                    <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                        You have no released payslips to request a copy of yet.
                    </p>
                ) : (
                    <>
                        <CustomDropdown
                            label="Payslip"
                            isRequired
                            options={options}
                            value={payslipUuid}
                            renderProps="label"
                            returnProps="value"
                            placeholder="Choose a released payslip..."
                            onChange={(v) => { setPayslipUuid(v); setErrors((p) => ({ ...p, payslipUuid: undefined })); }}
                            error={!!errors.payslipUuid}
                            errorLabel={errors.payslipUuid}
                        />

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-700">
                                Purpose
                                <span className="ml-1 font-bold text-rose-500" aria-hidden="true">*</span>
                            </label>
                            <textarea
                                rows={3}
                                value={reason}
                                maxLength={500}
                                onChange={(e) => { setReason(e.target.value); setErrors((p) => ({ ...p, reason: undefined })); }}
                                placeholder="e.g. Bank loan application, visa requirement, personal records"
                                className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-700 outline-none transition-all focus-within:ring-2 ${
                                    errors.reason
                                        ? 'border-rose-400 bg-rose-50/50 focus:ring-rose-500'
                                        : 'border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring-blue-500'
                                }`}
                            />
                            {errors.reason && <p className="mt-1 text-xs font-medium text-rose-500">{errors.reason}</p>}
                        </div>

                        <p className="text-[11px] leading-relaxed text-slate-400">
                            HR reviews every request. Once it's marked{' '}
                            <span className="font-medium text-emerald-600">fulfilled</span> you can download the official
                            PDF here. You can also download a PDF of any released payslip right away without a request.
                        </p>
                    </>
                )}
            </div>
        </CustomModal>
    );
}

RequestPayslipModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    payslips: PropTypes.array,
    presetUuid: PropTypes.string,
};

export default RequestPayslipModal;
