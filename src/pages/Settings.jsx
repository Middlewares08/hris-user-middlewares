// src/pages/Settings.jsx
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings as SettingsIcon } from 'lucide-react';
import CustomEmptyPlaceholder from '../components/CustomEmptyPlaceholder';

function Settings() {
    const navigate = useNavigate();

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
                        <p className="text-sm text-slate-500">Manage your preferences and account settings.</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <CustomEmptyPlaceholder
                        icon={SettingsIcon}
                        title="No settings available yet"
                        description="Account and notification preferences will appear here."
                        hasButton={false}
                    />
                </div>
            </div>
        </div>
    );
}

export default Settings;
