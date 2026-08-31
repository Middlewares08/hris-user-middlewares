// src/pages/Settings.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings as SettingsIcon, Bell, Megaphone, CalendarDays, Wallet, FileText, Sparkles } from 'lucide-react';
import CustomButton from '../components/CustomButton';
import CustomDropdown from '../components/CustomDropdown';
import Loading from '../components/Loading';
import { useMyPreferences, useUpdatePreferences } from '../hooks/useProfile';

// Mirrors PREFERENCE_REGISTRY in the backend auth.controller.
const PREFERENCE_KEYS = [
    'notify_announcements',
    'notify_leave_updates',
    'notify_payslip_released',
    'notify_document_updates',
    'notification_channel',
    'reduce_motion',
];

const DEFAULTS = {
    notify_announcements: true,
    notify_leave_updates: true,
    notify_payslip_released: true,
    notify_document_updates: true,
    notification_channel: 'email',
    reduce_motion: false,
};

const CHANNEL_OPTIONS = [
    { label: 'Email', value: 'email' },
    { label: 'SMS', value: 'sms' },
    { label: 'Email + SMS', value: 'both' },
    { label: 'None (in-app only)', value: 'none' },
];

const NOTIFY_ROWS = [
    { key: 'notify_announcements', icon: Megaphone, label: 'Announcements', hint: 'Company-wide and team announcements.' },
    { key: 'notify_leave_updates', icon: CalendarDays, label: 'Leave updates', hint: 'When your leave request is approved or rejected.' },
    { key: 'notify_payslip_released', icon: Wallet, label: 'Payslip released', hint: 'When a new payslip is available to view.' },
    { key: 'notify_document_updates', icon: FileText, label: 'Document requests', hint: 'When HR fulfills or updates a document request.' },
];

function Toggle({ checked, onChange, disabled }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                checked ? 'bg-indigo-600' : 'bg-slate-200'
            }`}
        >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    checked ? 'translate-x-5' : 'translate-x-0.5'
                }`}
            />
        </button>
    );
}

function Settings() {
    const navigate = useNavigate();
    const { data: prefs, isLoading, isError } = useMyPreferences();
    const updatePrefs = useUpdatePreferences();

    const [form, setForm] = useState(DEFAULTS);

    useEffect(() => {
        if (prefs) setForm({ ...DEFAULTS, ...prefs });
    }, [prefs]);

    const baseline = useMemo(() => ({ ...DEFAULTS, ...(prefs || {}) }), [prefs]);
    const isDirty = PREFERENCE_KEYS.some((key) => form[key] !== baseline[key]);

    const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!isDirty) return;

        const payload = PREFERENCE_KEYS.reduce((acc, key) => {
            if (form[key] !== baseline[key]) acc[key] = form[key];
            return acc;
        }, {});

        updatePrefs.mutate(payload);
    };

    const notificationsMuted = form.notification_channel === 'none';

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
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <SettingsIcon size={20} />
                    </div>
                    <div>
                        <p className="text-2xl font-semibold text-slate-900">Settings</p>
                        <p className="text-sm text-slate-500">Manage your notification and display preferences.</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                        <Loading size="sm" text="Loading your settings" />
                    </div>
                ) : isError ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 shadow-sm">
                        We couldn&apos;t load your settings. Please refresh and try again.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Notifications */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <Bell size={16} className="text-slate-400" />
                                <p className="text-sm font-semibold text-slate-900">Notifications</p>
                            </div>

                            <div className="mb-4 max-w-xs">
                                <CustomDropdown
                                    label="Delivery channel"
                                    options={CHANNEL_OPTIONS}
                                    value={form.notification_channel}
                                    onChange={(value) => setField('notification_channel', value)}
                                    renderProps="label"
                                    returnProps="value"
                                    placeholder="Select a channel"
                                />
                            </div>

                            <div className="divide-y divide-slate-100 border-t border-slate-100">
                                {NOTIFY_ROWS.map(({ key, icon: Icon, label, hint }) => (
                                    <div key={key} className="flex items-center justify-between gap-4 py-3">
                                        <div className="flex min-w-0 items-start gap-3">
                                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                                                <Icon size={15} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-700">{label}</p>
                                                <p className="text-xs text-slate-400">{hint}</p>
                                            </div>
                                        </div>
                                        <Toggle
                                            checked={form[key] && !notificationsMuted}
                                            disabled={notificationsMuted}
                                            onChange={(next) => setField(key, next)}
                                        />
                                    </div>
                                ))}
                            </div>

                            {notificationsMuted && (
                                <p className="mt-3 text-[11px] leading-relaxed text-amber-600">
                                    Delivery channel is set to <span className="font-medium">None</span> — you&apos;ll only see these updates inside the app.
                                </p>
                            )}
                            <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
                                Email and SMS delivery is being rolled out. Your choices here are saved and will take effect automatically once it&apos;s live.
                            </p>
                        </section>

                        {/* Display */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <Sparkles size={16} className="text-slate-400" />
                                <p className="text-sm font-semibold text-slate-900">Display</p>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-700">Reduce motion</p>
                                    <p className="text-xs text-slate-400">Minimize animations like the pulsing status dot and progress bars.</p>
                                </div>
                                <Toggle
                                    checked={form.reduce_motion}
                                    onChange={(next) => setField('reduce_motion', next)}
                                />
                            </div>
                        </section>

                        <div className="flex items-center justify-end gap-3">
                            <CustomButton
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setForm(baseline)}
                                disabled={!isDirty || updatePrefs.isPending}
                            >
                                Discard Changes
                            </CustomButton>
                            <CustomButton
                                type="submit"
                                variant="primary"
                                size="sm"
                                isLoading={updatePrefs.isPending}
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

export default Settings;
