// src/pages/Payroll.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { ArrowLeft, Wallet, ChevronRight, CalendarDays, Receipt, Download, FilePlus2, X } from 'lucide-react';
import CustomEmptyPlaceholder from '../components/CustomEmptyPlaceholder';
import Loading from '../components/Loading';
import RequestPayslipModal from '../components/payroll/RequestPayslipModal';
import {
    useMyPayslips,
    useMyPayslip,
    useMyPayslipRequests,
    useCancelPayslipRequest,
    downloadMyPayslipPdf,
} from '../hooks/usePayslips';
import { PAYSLIP_REQUEST_STATUS_TONE } from '../utils/constants';

const peso = (value) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value) || 0);

const STATUS_TONE = {
    released: 'bg-emerald-50 text-emerald-700',
    on_hold: 'bg-amber-50 text-amber-700',
    calculated: 'bg-sky-50 text-sky-700',
    cancelled: 'bg-rose-50 text-rose-700',
};

const periodLabel = (slip) => {
    const period = slip?.run?.period;
    if (period?.name) return period.name;
    if (period?.period_start && period?.period_end) {
        return `${moment(period.period_start).format('MMM D')} – ${moment(period.period_end).format('MMM D, YYYY')}`;
    }
    return 'Payslip';
};

function LineTable({ title, lines, tone }) {
    if (!lines.length) return null;
    return (
        <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                {lines.map((line) => (
                    <div key={line.uuid || line.id} className="flex items-center justify-between px-3 py-2.5 text-sm">
                        <span className="text-slate-600">{line.label}</span>
                        <span className={`font-medium ${tone}`}>{peso(line.amount)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PayslipDetail({ uuid, onBack, onRequestCopy, hasFulfilledCopy }) {
    const { data: slip, isLoading, isError } = useMyPayslip(uuid);
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        setDownloading(true);
        try { await downloadMyPayslipPdf(uuid); } finally { setDownloading(false); }
    };

    if (isLoading) return <Loading size="sm" text="Loading payslip" />;
    if (isError || !slip) {
        return (
            <CustomEmptyPlaceholder
                icon={Receipt}
                title="Payslip unavailable"
                description="We couldn't load this payslip. It may not have been released yet."
                hasButton={false}
            />
        );
    }

    const lines = slip.lines || [];
    const earnings = lines.filter((l) => l.line_type === 'earning');
    const deductions = lines.filter((l) => l.line_type === 'deduction');

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 cursor-pointer"
                >
                    <ArrowLeft size={16} />
                    All payslips
                </button>

                <div className="flex items-center gap-2">
                    {hasFulfilledCopy && (
                        <button
                            type="button"
                            onClick={handleDownload}
                            disabled={downloading}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs! font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-60 cursor-pointer"
                        >
                            <Download size={14} />
                            {downloading ? 'Preparing…' : 'Download Payslip'}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => onRequestCopy(uuid)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm! font-semibold text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
                    >
                        <FilePlus2 size={14} />
                        Request copy
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-base font-semibold text-slate-900">{periodLabel(slip)}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                            <CalendarDays size={13} />
                            Pay date {slip.run?.period?.pay_date ? moment(slip.run.period.pay_date).format('MMM D, YYYY') : '—'}
                        </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${STATUS_TONE[slip.status] || 'bg-slate-100 text-slate-500'}`}>
                        {String(slip.status || '').replace('_', ' ')}
                    </span>
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-500">Net Pay</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">{peso(slip.net_pay)}</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                        {peso(slip.gross_pay)} gross − {peso(slip.total_deductions)} deductions
                    </p>
                </div>

                <div className="mt-5 space-y-5">
                    <LineTable title="Earnings" lines={earnings} tone="text-emerald-600" />
                    <LineTable title="Deductions" lines={deductions} tone="text-rose-600" />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
                    <Meta label="Taxable income" value={peso(slip.taxable_income)} />
                    <Meta label="Withholding tax" value={peso(slip.withholding_tax)} />
                    <Meta label="Days worked" value={slip.days_worked ?? '—'} />
                    <Meta label="Payment method" value={String(slip.payment_method || '—').replace('_', ' ')} />
                    {slip.payment_reference && <Meta label="Reference" value={slip.payment_reference} />}
                    {slip.released_at && <Meta label="Released" value={moment(slip.released_at).format('MMM D, YYYY')} />}
                </div>
            </div>
        </div>
    );
}

function Meta({ label, value }) {
    return (
        <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
            <p className="text-sm font-medium capitalize text-slate-700">{value}</p>
        </div>
    );
}

function RequestList({ requests, onDownload, onCancel, downloadingUuid, cancelling }) {
    if (!requests.length) return null;
    return (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-slate-900">My Copy Requests</p>
            <div className="space-y-2.5">
                {requests.map((req) => {
                    const tone = PAYSLIP_REQUEST_STATUS_TONE[req.status] || 'bg-slate-100 text-slate-500';
                    return (
                        <div key={req.uuid} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                            <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-sm font-medium text-slate-700">{periodLabel(req.payslip)}</p>
                                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${tone}`}>
                                    {req.status}
                                </span>
                            </div>
                            <p className="mt-1 truncate text-xs text-slate-400">{req.reason}</p>
                            {req.review_remarks && (
                                <p className="mt-1 text-xs text-slate-500">HR: {req.review_remarks}</p>
                            )}
                            <div className="mt-2 flex items-center gap-2">
                                {req.status === 'fulfilled' && req.payslip?.uuid && (
                                    <button
                                        type="button"
                                        onClick={() => onDownload(req.payslip.uuid)}
                                        disabled={downloadingUuid === req.payslip.uuid}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-2.5 py-2 text-xs! font-semibold text-white hover:bg-slate-700 disabled:opacity-60 cursor-pointer"
                                    >
                                        <Download size={12} />
                                        {downloadingUuid === req.payslip.uuid ? 'Preparing…' : 'Download Payslip'}
                                    </button>
                                )}
                                {req.status === 'pending' && (
                                    <button
                                        type="button"
                                        onClick={() => onCancel(req.uuid)}
                                        disabled={cancelling}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5  py-2 text-xs! font-semibold text-red-600 hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function Payroll() {
    const navigate = useNavigate();
    const [selectedUuid, setSelectedUuid] = useState(null);
    const [requestModal, setRequestModal] = useState({ open: false, presetUuid: null });
    const [downloadingUuid, setDownloadingUuid] = useState(null);
    const { data: payslips = [], isLoading } = useMyPayslips(24);
    const { data: requests = [] } = useMyPayslipRequests();
    const cancelRequest = useCancelPayslipRequest();

    const openRequestModal = (presetUuid = null) => setRequestModal({ open: true, presetUuid });

    const handleRequestDownload = async (uuid) => {
        setDownloadingUuid(uuid);
        try { await downloadMyPayslipPdf(uuid); } finally { setDownloadingUuid(null); }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-4xl text-left">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="mb-5 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 cursor-pointer"
                >
                    <ArrowLeft size={16} />
                    Back
                </button>

                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                            <Wallet size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-semibold text-slate-900">Payroll</p>
                            <p className="text-xs text-slate-500">Review, download, or request a copy of your payslips.</p>
                        </div>
                    </div>
                    {payslips.length > 0 && !selectedUuid && (
                        <button
                            type="button"
                            onClick={() => openRequestModal(null)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs! font-semibold text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
                        >
                            <FilePlus2 size={14} />
                            Request a copy
                        </button>
                    )}
                </div>

                {!selectedUuid && (
                    <RequestList
                        requests={requests}
                        onDownload={handleRequestDownload}
                        onCancel={(uuid) => cancelRequest.mutate(uuid)}
                        downloadingUuid={downloadingUuid}
                        cancelling={cancelRequest.isPending}
                    />
                )}

                {selectedUuid ? (
                    <PayslipDetail
                        uuid={selectedUuid}
                        onBack={() => setSelectedUuid(null)}
                        onRequestCopy={(uuid) => openRequestModal(uuid)}
                        hasFulfilledCopy={requests.some(
                            (r) => r.status === 'fulfilled' && r.payslip?.uuid === selectedUuid
                        )}
                    />
                ) : isLoading ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <Loading size="sm" text="Loading payslips" />
                    </div>
                ) : payslips.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <CustomEmptyPlaceholder
                            icon={Wallet}
                            title="No payslips available yet"
                            description="Your payslips will appear here once payroll has been processed and released."
                            hasButton={false}
                        />
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {payslips.map((slip) => (
                            <button
                                key={slip.uuid}
                                type="button"
                                onClick={() => setSelectedUuid(slip.uuid)}
                                className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                                    <Receipt size={18} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-slate-900">{periodLabel(slip)}</p>
                                    <p className="mt-0.5 text-xs text-slate-400">
                                        Pay date {slip.run?.period?.pay_date ? moment(slip.run.period.pay_date).format('MMM D, YYYY') : '—'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-slate-900">{peso(slip.net_pay)}</p>
                                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_TONE[slip.status] || 'bg-slate-100 text-slate-500'}`}>
                                        {String(slip.status || '').replace('_', ' ')}
                                    </span>
                                </div>
                                <ChevronRight size={16} className="shrink-0 text-slate-300" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <RequestPayslipModal
                isOpen={requestModal.open}
                onClose={() => setRequestModal({ open: false, presetUuid: null })}
                payslips={payslips}
                presetUuid={requestModal.presetUuid}
            />
        </div>
    );
}

export default Payroll;
