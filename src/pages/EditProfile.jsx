// src/pages/EditProfile.jsx
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPen } from 'lucide-react';
import CustomEmptyPlaceholder from '../components/CustomEmptyPlaceholder';

function EditProfile() {
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
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                        <UserPen size={20} />
                    </div>
                    <div>
                        <p className="text-2xl font-semibold text-slate-900">Edit Profile</p>
                        <p className="text-sm text-slate-500">Update your personal information and contact details.</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <CustomEmptyPlaceholder
                        icon={UserPen}
                        title="Profile editing coming soon"
                        description="You'll be able to update your details here once the form is available."
                        hasButton={false}
                    />
                </div>
            </div>
        </div>
    );
}

export default EditProfile;
