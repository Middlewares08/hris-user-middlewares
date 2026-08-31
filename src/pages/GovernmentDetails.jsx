// src/pages/GovernmentDetails.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import {
    ArrowLeft,
    Landmark,
    ShieldCheck,
    Banknote,
    Briefcase,
    CheckCircle2,
    AlertTriangle,
} from 'lucide-react';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import Loading from '../components/Loading';
import { useMyStatutory, useUpdateStatutory, useMyEmployment } from '../hooks/useFinancial';
import { PH_STATUTORY_FORMATS, EMPLOYMENT_TYPES } from '../utils/constants';

const peso = (value) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value) || 0);

const GOV_FIELDS = ['sss_number', 'philhealth_number', 'pagibig_number', 'tin_number'];
const BANK_FIELDS = ['bank_name', 'bank_account_name', 'bank_account_number'];
const EDITABLE_FIELDS = [...GOV_FIELDS, ...BANK_FIELDS];

const EMPTY_FORM = EDITABLE_FIELDS.reduce((acc, key) => ({ ...acc, [key]: '' }), {});

const EMPLOYMENT_TYPE_LABELS = EMPLOYMENT_TYPES.reduce(
    (acc, { value, label }) => ({ ...acc, [value]: label }),
    {},
);

const RATE_TYPE_LABELS = {
    monthly: 'Monthly',
    semi_monthly: 'Semi-monthly',
    daily: 'Daily',
    hourly: 'Hourly',
};

// Flattens the API shape ({ government: {...}, bank: {...} }) into the flat form.
function toForm(data) {
    if (!data) return EMPTY_FORM;
    return {
        ...EMPTY_FORM,
        ...GOV_FIELDS.reduce((acc, k) => ({ ...acc, [k]: data.government?.[k] || '' }), {}),
        ...BANK_FIELDS.reduce((acc, k) => ({ ...acc, [k]: data.bank?.[k] || '' }), {}),
    };
}

const EXEMPT_FLAGS = [
    { key: 'is_sss_exempt', label: 'SSS' },
    { key: 'is_philhealth_exempt', label: 'PhilHealth' },
    { key: 'is_pagibig_exempt', label: 'Pag-IBIG' },
];

function GovernmentDetails() {
    const navigate = useNavigate();
    const { data: statutory, isLoading, isError } = useMyStatutory();
    const { data: employment, isLoading: isEmploymentLoading } = useMyEmployment();
    const updateStatutory = useUpdateStatutory();

    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (statutory) setForm(toForm(statutory));
    }, [statutory]);

    const baseline = useMemo(() => toForm(statutory), [statutory]);
    const isDirty = EDITABLE_FIELDS.some((key) => form[key] !== baseline[key]);
    const hasPayProfile = statutory?.bank?.has_pay_profile !== false;

    const setField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

    const validate = () => {
        const next = {};
        for (const key of GOV_FIELDS) {
            const digits = (form[key] || '').replace(/\D/g, '');
            if (digits && !PH_STATUTORY_FORMATS[key].digits.includes(digits.length)) {
                next[key] = `Enter a valid ${PH_STATUTORY_FORMATS[key].label}.`;
            }
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!isDirty || !validate()) return;

        const payload = EDITABLE_FIELDS.reduce((acc, key) => {
            if (form[key] !== baseline[key]) acc[key] = form[key].trim();
            return acc;
        }, {});

        updateStatutory.mutate(payload);
    };

    const handleReset = () => {
        setForm(baseline);
        setErrors({});
    };

    const payHistory = employment?.payHistory || [];
    const tenure = employment?.dateHired ? moment(employment.dateHired).fromNow(true) : null;

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-4xl text-left">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="mb-5 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 cursor-pointer"
                >
                    <ArrowLeft size={16} />
                    Back
                </button>

                <div className="mb-6 flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <Landmark size={20} />
                    </div>
                    <div>
                        <p className="text-2xl font-semibold text-slate-900">Government &amp; Bank Details</p>
                        <p className="text-sm text-slate-500">
                            Manage your statutory numbers and the bank account your pay is deposited to.
                        </p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                        <Loading size="sm" text="Loading your details" />
                    </div>
                ) : isError ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 shadow-sm">
                        We couldn&apos;t load your details. Please refresh and try again.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Government IDs */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <ShieldCheck size={16} className="text-slate-400" />
                                <p className="text-sm font-semibold text-slate-900">Government Identifiers</p>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {GOV_FIELDS.map((key) => (
                                    <CustomInput
                                        key={key}
                                        label={PH_STATUTORY_FORMATS[key].label}
                                        value={form[key]}
                                        onChange={(e) => setField(key, e.target.value)}
                                        placeholder={PH_STATUTORY_FORMATS[key].placeholder}
                                        error={!!errors[key]}
                                        errorLabel={errors[key]}
                                        maxLength={20}
                                    />
                                ))}
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                                {EXEMPT_FLAGS.map(({ key, label }) => {
                                    const exempt = !!statutory?.government?.[key];
                                    return (
                                        <span
                                            key={key}
                                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                                                exempt ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700'
                                            }`}
                                        >
                                            {label}: {exempt ? 'Exempt' : 'Contributing'}
                                        </span>
                                    );
                                })}
                            </div>
                            <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                                Contribution-exempt status is managed by HR. Contact them if any of these are wrong.
                            </p>
                        </section>

                        {/* Bank account */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <Banknote size={16} className="text-slate-400" />
                                <p className="text-sm font-semibold text-slate-900">Payroll Bank Account</p>
                            </div>

                            {!hasPayProfile && (
                                <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                                    <span>
                                        No pay profile is on file yet, so bank details can&apos;t be saved. Contact HR / Payroll
                                        to set one up.
                                    </span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <CustomInput
                                    label="Bank Name"
                                    value={form.bank_name}
                                    onChange={(e) => setField('bank_name', e.target.value)}
                                    placeholder="e.g. BDO, BPI, Metrobank"
                                    disabled={!hasPayProfile}
                                    maxLength={150}
                                />
                                <CustomInput
                                    label="Account Name"
                                    value={form.bank_account_name}
                                    onChange={(e) => setField('bank_account_name', e.target.value)}
                                    placeholder="Name on the account"
                                    disabled={!hasPayProfile}
                                    maxLength={150}
                                />
                                <div className="sm:col-span-2">
                                    <CustomInput
                                        label="Account Number"
                                        value={form.bank_account_number}
                                        onChange={(e) => setField('bank_account_number', e.target.value)}
                                        placeholder="Deposit account number"
                                        disabled={!hasPayProfile}
                                        maxLength={50}
                                    />
                                    {statutory?.bank?.bank_account_last4 && (
                                        <p className="mt-1 text-[11px] text-slate-400">
                                            Currently on file: {statutory.bank.bank_account_last4}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Employment history */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <Briefcase size={16} className="text-slate-400" />
                                <p className="text-sm font-semibold text-slate-900">Employment History</p>
                            </div>

                            {isEmploymentLoading ? (
                                <Loading size="sm" text="Loading employment record" />
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                        {[
                                            ['Employee ID', employment?.employeeId || '—'],
                                            ['Date Hired', employment?.dateHired ? moment(employment.dateHired).format('MMM D, YYYY') : '—'],
                                            ['Tenure', tenure || '—'],
                                            ['Employment Type', EMPLOYMENT_TYPE_LABELS[employment?.employmentType] || employment?.employmentType || '—'],
                                            ['Position', employment?.position || '—'],
                                            ['Department', employment?.department || '—'],
                                        ].map(([label, value]) => (
                                            <div key={label} className="rounded-xl bg-slate-50 px-3 py-2.5">
                                                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
                                                <p className="mt-0.5 truncate text-sm font-medium text-slate-700">{value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {payHistory.length > 0 && (
                                        <div className="mt-5 border-t border-slate-100 pt-4">
                                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                Compensation Changes
                                            </p>
                                            <div className="relative space-y-4">
                                                <div className="absolute bottom-2 left-[7px] top-2 w-px bg-slate-100" />
                                                {payHistory.map((row, index) => (
                                                    <div key={`${row.effective_date}-${index}`} className="relative flex gap-3">
                                                        <div
                                                            className={`relative z-10 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ring-4 ring-white ${
                                                                row.is_active ? 'bg-emerald-500 text-white' : 'bg-slate-300'
                                                            }`}
                                                        >
                                                            {row.is_active && <CheckCircle2 size={10} />}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <p className="text-sm font-medium text-slate-700">
                                                                    {peso(row.monthly_equivalent)}
                                                                    <span className="ml-1 text-xs font-normal text-slate-400">
                                                                        / month
                                                                    </span>
                                                                </p>
                                                                {row.is_active && (
                                                                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                                                        Current
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-slate-400">
                                                                {RATE_TYPE_LABELS[row.rate_type] || row.rate_type} · {peso(row.pay_rate)} {row.rate_type === 'monthly' ? '' : `per ${row.rate_type?.replace('_', ' ')}`}
                                                            </p>
                                                            <p className="mt-0.5 text-[11px] text-slate-400">
                                                                {moment(row.effective_date).format('MMM D, YYYY')}
                                                                {' – '}
                                                                {row.end_date ? moment(row.end_date).format('MMM D, YYYY') : 'present'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
                                        This record is maintained by HR. Contact them if anything looks incorrect.
                                    </p>
                                </>
                            )}
                        </section>

                        <div className="flex items-center justify-end gap-3">
                            <CustomButton
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleReset}
                                disabled={!isDirty || updateStatutory.isPending}
                            >
                                Discard Changes
                            </CustomButton>
                            <CustomButton
                                type="submit"
                                variant="primary"
                                size="sm"
                                isLoading={updateStatutory.isPending}
                                disabled={!isDirty}
                            >
                                Save Changes
                            </CustomButton>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default GovernmentDetails;
