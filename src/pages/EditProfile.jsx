// src/pages/EditProfile.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPen, Mail, Phone, MapPin, ShieldAlert, IdCard, Building2 } from 'lucide-react';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import CustomDropdown from '../components/CustomDropdown';
import Loading from '../components/Loading';
import { CustomAvatar } from '../components/CustomAvatar';
import { useMyProfile, useUpdateProfile } from '../hooks/useProfile';
import { RELATIONSHIP_OPTIONS } from '../utils/constants';
import { getRegions, getProvinces, getCities, getBarangays, resolveZip, resolveAddress } from '../utils/psgc';

// The editable fields, flat — mirrors the PATCH /auth/me/profile body.
const EDITABLE_FIELDS = [
    'preferred_name',
    'personal_email',
    'personal_phone',
    'emergency_contact_name',
    'emergency_contact_relationship',
    'emergency_contact_phone',
    'street_address',
    'barangay',
    'city',
    'state_province',
    'region',
    'postal_code',
];

const EMPTY_FORM = EDITABLE_FIELDS.reduce((acc, key) => ({ ...acc, [key]: '' }), {});

// Flattens the API shape ({ preferredName, contact: {...}, address: {...} }) into the flat form.
function toForm(profile) {
    if (!profile) return EMPTY_FORM;
    return {
        ...EMPTY_FORM,
        preferred_name: profile.preferredName || '',
        ...Object.fromEntries(
            Object.entries(profile.contact || {}).map(([k, v]) => [k, v || '']),
        ),
        ...Object.fromEntries(
            Object.entries(profile.address || {}).map(([k, v]) => [k, v || '']),
        ),
    };
}

function EditProfile() {
    const navigate = useNavigate();
    const { data: profile, isLoading, isError } = useMyProfile();
    const updateProfile = useUpdateProfile();

    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});

    // Seed the form once the profile lands (and re-seed after a successful save re-fetch).
    useEffect(() => {
        if (profile) setForm(toForm(profile));
    }, [profile]);

    const baseline = useMemo(() => toForm(profile), [profile]);
    const isDirty = EDITABLE_FIELDS.some((key) => form[key] !== baseline[key]);

    const setField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

    const validate = () => {
        const next = {};
        if (form.personal_email && !/^\S+@\S+\.\S+$/.test(form.personal_email)) {
            next.personal_email = 'Enter a valid email address.';
        }
        if (form.personal_phone && form.personal_phone.replace(/\D/g, '').length < 7) {
            next.personal_phone = 'Enter a valid phone number.';
        }
        if (form.emergency_contact_phone && form.emergency_contact_phone.replace(/\D/g, '').length < 7) {
            next.emergency_contact_phone = 'Enter a valid phone number.';
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!isDirty || !validate()) return;

        // Send only the fields that actually changed.
        const payload = EDITABLE_FIELDS.reduce((acc, key) => {
            if (form[key] !== baseline[key]) acc[key] = form[key].trim();
            return acc;
        }, {});

        updateProfile.mutate(payload);
    };

    const handleReset = () => {
        setForm(baseline);
        setErrors({});
    };

    // --- Home Address: cascading PSGC picker (region → province → city → barangay) ---
    // `form` keeps the human-readable names (the API contract is unchanged); the
    // codes below are derived each render to drive the dropdowns and resolve zips.
    const regions = useMemo(() => getRegions(), []);
    const { regCode, provCode, munCode } = useMemo(
        () => resolveAddress({ region: form.region, province: form.state_province, city: form.city }),
        [form.region, form.state_province, form.city],
    );
    const provinces = useMemo(() => getProvinces(regCode), [regCode]);
    const cities = useMemo(() => getCities(provCode), [provCode]);
    const barangays = useMemo(() => getBarangays(munCode), [munCode]);

    const setAddress = (fields) => {
        setForm((prev) => ({ ...prev, ...fields }));
        setErrors((prev) => ({ ...prev, ...Object.fromEntries(Object.keys(fields).map((k) => [k, undefined])) }));
    };

    const handleRegionChange = (code) => {
        const opt = regions.find((r) => r.reg_code === code);
        setAddress({ region: opt?.name || '', state_province: '', city: '', barangay: '', postal_code: '' });
    };
    const handleProvinceChange = (code) => {
        const opt = provinces.find((p) => p.prov_code === code);
        setAddress({ state_province: opt?.name || '', city: '', barangay: '', postal_code: '' });
    };
    const handleCityChange = (code) => {
        const opt = cities.find((c) => c.mun_code === code);
        setAddress({
            city: opt?.name || '',
            barangay: '',
            postal_code: opt ? resolveZip({ name: opt.name, munCode: code }) : '',
        });
    };
    const handleBarangayChange = (name) => {
        setAddress({
            barangay: name,
            postal_code: resolveZip({ name, munCode, preferFirst: true }) || form.postal_code,
        });
    };

    const fullName = [profile?.firstName, profile?.middleName, profile?.lastName].filter(Boolean).join(' ');

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
                        <p className="text-sm text-slate-500">Update your contact details and emergency contact.</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                        <Loading size="sm" text="Loading your profile" />
                    </div>
                ) : isError ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 shadow-sm">
                        We couldn&apos;t load your profile. Please refresh and try again.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Identity — read-only, HR controlled */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-4">
                                <CustomAvatar
                                    firstName={profile?.firstName}
                                    lastName={profile?.lastName}
                                    size="h-14 w-14 text-lg"
                                />
                                <div className="min-w-0">
                                    <p className="text-base font-semibold text-slate-900">{fullName || '—'}</p>
                                    <p className="truncate text-sm text-slate-500">{profile?.position || 'Team Member'}</p>
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                                <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                                    <IdCard size={15} className="shrink-0 text-slate-400" />
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Login Email</p>
                                        <p className="truncate text-sm font-medium text-slate-700">{profile?.loginEmail || '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                                    <Building2 size={15} className="shrink-0 text-slate-400" />
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Department</p>
                                        <p className="truncate text-sm font-medium text-slate-700">{profile?.department || 'General'}</p>
                                    </div>
                                </div>
                            </div>

                            <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
                                Your legal name, position and login email are managed by HR. Contact them if any of these need to change.
                            </p>
                        </section>

                        {/* Contact details */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <Mail size={16} className="text-slate-400" />
                                <p className="text-sm font-semibold text-slate-900">Contact Details</p>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <CustomInput
                                    label="Preferred Name"
                                    value={form.preferred_name}
                                    onChange={(e) => setField('preferred_name', e.target.value)}
                                    placeholder="What should we call you?"
                                    maxLength={100}
                                />
                                <CustomInput
                                    label="Personal Email"
                                    type="email"
                                    icon={Mail}
                                    value={form.personal_email}
                                    onChange={(e) => setField('personal_email', e.target.value)}
                                    placeholder="you@example.com"
                                    error={!!errors.personal_email}
                                    errorLabel={errors.personal_email}
                                />
                                <CustomInput
                                    label="Personal Phone"
                                    icon={Phone}
                                    value={form.personal_phone}
                                    onChange={(e) => setField('personal_phone', e.target.value)}
                                    placeholder="09XX XXX XXXX"
                                    error={!!errors.personal_phone}
                                    errorLabel={errors.personal_phone}
                                />
                            </div>
                        </section>

                        {/* Emergency contact */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <ShieldAlert size={16} className="text-slate-400" />
                                <p className="text-sm font-semibold text-slate-900">Emergency Contact</p>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <CustomInput
                                    label="Contact Name"
                                    value={form.emergency_contact_name}
                                    onChange={(e) => setField('emergency_contact_name', e.target.value)}
                                    placeholder="Full name"
                                />
                                <CustomDropdown
                                    label="Relationship"
                                    options={RELATIONSHIP_OPTIONS}
                                    value={form.emergency_contact_relationship}
                                    onChange={(value) => setField('emergency_contact_relationship', value)}
                                    renderProps="label"
                                    returnProps="value"
                                    placeholder="Select relationship"
                                />
                                <CustomInput
                                    label="Contact Phone"
                                    icon={Phone}
                                    value={form.emergency_contact_phone}
                                    onChange={(e) => setField('emergency_contact_phone', e.target.value)}
                                    placeholder="09XX XXX XXXX"
                                    error={!!errors.emergency_contact_phone}
                                    errorLabel={errors.emergency_contact_phone}
                                />
                            </div>
                        </section>

                        {/* Home address — cascading PSGC picker */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <MapPin size={16} className="text-slate-400" />
                                <p className="text-sm font-semibold text-slate-900">Home Address</p>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <CustomDropdown
                                    label="Region"
                                    options={regions}
                                    value={regCode}
                                    renderProps="name"
                                    returnProps="reg_code"
                                    onChange={handleRegionChange}
                                    placeholder="Select region"
                                />
                                <CustomDropdown
                                    label="Province"
                                    options={provinces}
                                    value={provCode}
                                    renderProps="name"
                                    returnProps="prov_code"
                                    disabled={!regCode}
                                    onChange={handleProvinceChange}
                                    placeholder={regCode ? 'Select province' : 'Choose a region first'}
                                />
                                <CustomDropdown
                                    label="City / Municipality"
                                    options={cities}
                                    value={munCode}
                                    renderProps="name"
                                    returnProps="mun_code"
                                    disabled={!provCode}
                                    onChange={handleCityChange}
                                    placeholder={provCode ? 'Select city / municipality' : 'Choose a province first'}
                                />
                                <CustomDropdown
                                    label="Barangay"
                                    options={barangays}
                                    value={form.barangay}
                                    renderProps="name"
                                    returnProps="name"
                                    disabled={!munCode}
                                    onChange={handleBarangayChange}
                                    placeholder={munCode ? 'Select barangay' : 'Choose a city first'}
                                />
                                <CustomInput
                                    label="Postal Code"
                                    value={form.postal_code}
                                    onChange={(e) => setField('postal_code', e.target.value)}
                                    placeholder="e.g. 3000"
                                    maxLength={4}
                                />
                                <CustomInput
                                    label="Street Address"
                                    value={form.street_address}
                                    onChange={(e) => setField('street_address', e.target.value)}
                                    placeholder="House / unit no., street"
                                />
                            </div>

                            {((form.region && !regCode) ||
                                (form.state_province && !provCode) ||
                                (form.city && !munCode)) && (
                                <p className="mt-3 text-[11px] leading-relaxed text-amber-600">
                                    Some of your saved address values
                                    {' '}
                                    (
                                    {[
                                        form.region && !regCode ? `region "${form.region}"` : null,
                                        form.state_province && !provCode ? `province "${form.state_province}"` : null,
                                        form.city && !munCode ? `city "${form.city}"` : null,
                                    ].filter(Boolean).join(', ')}
                                    )
                                    {' '}
                                    couldn&apos;t be matched to the official list. Re-select from the dropdowns to update them.
                                </p>
                            )}
                        </section>

                        <div className="flex items-center justify-end gap-3">
                            <CustomButton
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleReset}
                                disabled={!isDirty || updateProfile.isPending}
                            >
                                Discard Changes
                            </CustomButton>
                            <CustomButton
                                type="submit"
                                variant="primary"
                                size="sm"
                                isLoading={updateProfile.isPending}
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

export default EditProfile;
