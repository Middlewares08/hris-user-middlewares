// src/pages/EditProfile.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPen, Mail, Phone, MapPin, ShieldAlert, IdCard, Building2, GraduationCap, Plus, Trash2 } from 'lucide-react';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import CustomDropdown from '../components/CustomDropdown';
import Loading from '../components/Loading';
import { CustomAvatar } from '../components/CustomAvatar';
import { useMyProfile, useUpdateProfile } from '../hooks/useProfile';
import { useMyEducation, useUpdateEducation } from '../hooks/useEducation';
import { RELATIONSHIP_OPTIONS, EDUCATION_LEVELS } from '../utils/constants';
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

// --- Educational background: a repeatable list, backed by its own endpoint
// (/auth/me/education) — tracked and saved alongside the profile fields above,
// but as its own dirty/baseline pair since it isn't part of the profile PATCH body.
const blankEducationEntry = () => ({
    education_level: 'college',
    school_name: '',
    degree: '',
    year_started: '',
    year_graduated: '',
    honors: '',
});

const educationRowKey = (row, index) => row.id ?? index;

function toEducationForm(rows) {
    if (!Array.isArray(rows)) return [];
    return rows.map((row) => ({
        id: row.id,
        education_level: row.education_level || 'college',
        school_name: row.school_name || '',
        degree: row.degree || '',
        year_started: row.year_started ? String(row.year_started) : '',
        year_graduated: row.year_graduated ? String(row.year_graduated) : '',
        honors: row.honors || '',
    }));
}

function EditProfile() {
    const navigate = useNavigate();
    const { data: profile, isLoading, isError } = useMyProfile();
    const updateProfile = useUpdateProfile();
    const { data: education, isLoading: isEducationLoading } = useMyEducation();
    const updateEducation = useUpdateEducation();

    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [educationEntries, setEducationEntries] = useState([]);
    const [educationBaseline, setEducationBaseline] = useState([]);

    // Seed the form once the profile lands (and re-seed after a successful save re-fetch).
    useEffect(() => {
        if (profile) setForm(toForm(profile));
    }, [profile]);

    useEffect(() => {
        if (education) {
            const rows = toEducationForm(education);
            setEducationEntries(rows);
            setEducationBaseline(rows);
        }
    }, [education]);

    const baseline = useMemo(() => toForm(profile), [profile]);
    const profileDirty = EDITABLE_FIELDS.some((key) => form[key] !== baseline[key]);
    const educationDirty = JSON.stringify(educationEntries) !== JSON.stringify(educationBaseline);
    const isDirty = profileDirty || educationDirty;
    const isSaving = updateProfile.isPending || updateEducation.isPending;

    const updateEducationEntry = (index, fields) =>
        setEducationEntries((prev) => prev.map((entry, i) => (i === index ? { ...entry, ...fields } : entry)));
    const addEducationEntry = () => setEducationEntries((prev) => [...prev, blankEducationEntry()]);
    const removeEducationEntry = (index) => setEducationEntries((prev) => prev.filter((_, i) => i !== index));

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

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!isDirty) return;
        if (profileDirty && !validate()) return;

        try {
            if (profileDirty) {
                // Send only the fields that actually changed.
                const payload = EDITABLE_FIELDS.reduce((acc, key) => {
                    if (form[key] !== baseline[key]) acc[key] = form[key].trim();
                    return acc;
                }, {});
                await updateProfile.mutateAsync(payload);
            }

            if (educationDirty) {
                const payload = educationEntries
                    .filter((entry) => entry.school_name.trim())
                    .map((entry) => ({
                        education_level: entry.education_level,
                        school_name: entry.school_name.trim(),
                        degree: entry.degree.trim() || null,
                        year_started: entry.year_started || null,
                        year_graduated: entry.year_graduated || null,
                        honors: entry.honors.trim() || null,
                    }));
                await updateEducation.mutateAsync({ education: payload });
            }
        } catch {
            // Each mutation hook already surfaces its own error toast.
        }
    };

    const handleReset = () => {
        setForm(baseline);
        setErrors({});
        setEducationEntries(educationBaseline);
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
                        <p className="text-sm text-slate-500">Update your contact details, emergency contact, and educational background.</p>
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

                        {/* Educational background — own endpoint, tracked alongside the profile fields */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <GraduationCap size={16} className="text-slate-400" />
                                <p className="text-sm font-semibold text-slate-900">Educational Background</p>
                            </div>

                            {isEducationLoading ? (
                                <Loading size="sm" text="Loading your education records" />
                            ) : (
                                <div className="space-y-4">
                                    {educationEntries.length === 0 && (
                                        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-8 text-slate-400">
                                            <GraduationCap size={22} />
                                            <span className="text-sm">No education entries yet.</span>
                                        </div>
                                    )}

                                    {educationEntries.map((entry, index) => (
                                        <div key={educationRowKey(entry, index)} className="relative rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-4">
                                            <button
                                                type="button"
                                                onClick={() => removeEducationEntry(index)}
                                                className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                                                title="Remove entry"
                                            >
                                                <Trash2 size={14} />
                                            </button>

                                            <div className="grid grid-cols-1 gap-4 pr-8 sm:grid-cols-2">
                                                <CustomDropdown
                                                    label="Education Level"
                                                    options={EDUCATION_LEVELS}
                                                    value={entry.education_level}
                                                    onChange={(val) => updateEducationEntry(index, { education_level: val })}
                                                    renderProps="label"
                                                    returnProps="value"
                                                    placeholder="Select level"
                                                />
                                                <CustomInput
                                                    label="School Name"
                                                    value={entry.school_name}
                                                    onChange={(e) => updateEducationEntry(index, { school_name: e.target.value })}
                                                    placeholder="Ex. University of Santo Tomas"
                                                    maxLength={150}
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                <CustomInput
                                                    label="Degree / Course"
                                                    value={entry.degree}
                                                    onChange={(e) => updateEducationEntry(index, { degree: e.target.value })}
                                                    placeholder="Ex. BS Computer Science"
                                                    maxLength={150}
                                                />
                                                <CustomInput
                                                    label="Honors"
                                                    value={entry.honors}
                                                    onChange={(e) => updateEducationEntry(index, { honors: e.target.value })}
                                                    placeholder="Ex. Cum Laude"
                                                    maxLength={100}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <CustomInput
                                                    label="Year Started"
                                                    value={entry.year_started}
                                                    onChange={(e) => updateEducationEntry(index, { year_started: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                                                    placeholder="Ex. 2016"
                                                    maxLength={4}
                                                />
                                                <CustomInput
                                                    label="Year Graduated"
                                                    value={entry.year_graduated}
                                                    onChange={(e) => updateEducationEntry(index, { year_graduated: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                                                    placeholder="Ex. 2020"
                                                    maxLength={4}
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={addEducationEntry}
                                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 cursor-pointer"
                                    >
                                        <Plus size={16} /> Add Education Entry
                                    </button>
                                </div>
                            )}
                        </section>

                        <div className="flex items-center justify-end gap-3">
                            <CustomButton
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleReset}
                                disabled={!isDirty || isSaving}
                            >
                                Discard Changes
                            </CustomButton>
                            <CustomButton
                                type="submit"
                                variant="primary"
                                size="sm"
                                isLoading={isSaving}
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
