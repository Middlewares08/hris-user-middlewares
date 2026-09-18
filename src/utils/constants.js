import { generateUUID } from "./utils";


export const PERMISSION_ACTIONS = {
    ADD: 'add',
    UPDATE: 'update',
    DELETE: 'delete',
    VIEW: 'view',
    RESTORE: 'restore',
};

export const BLANK = '';

export const RATE_TYPE = [
    {
        id: generateUUID(),
        value: 'hr',
        label: 'Hourly'
    },
    {
        id: generateUUID(),
        value: 'day',
        label: 'Daily'
    }
]

export const GENDER = [
    {
        id: generateUUID(),
        value: 'M',
        label: 'Male'
    },
    {
        id: generateUUID(),
        value: 'F',
        label: 'Female'
    },
    {
        id: generateUUID(),
        value: '',
        label: 'Prefer not to say'
    },
]

export const RELIGIONS = [
    { code: 'RC',  name: 'Roman Catholic' },
    { code: 'ISL', name: 'Islam' },
    { code: 'INC', name: 'Iglesia ni Cristo' },
    { code: 'EVN', name: 'Evangelical Christian' },
    { code: 'PRT', name: 'Other Protestant Denomination' },
    { code: 'IFI', name: 'Iglesia Filipina Independiente (Aglipayan)' },
    { code: 'SDA', name: 'Seventh-day Adventist' },
    { code: 'JHV', name: 'Jehovah\'s Witnesses' },
    { code: 'BUD', name: 'Buddhism' },
    { code: 'IND', name: 'Indigenous / Tribal Religions' },
    { code: 'NON', name: 'None / Agnostic / Atheist' },
    { code: 'OTH', name: 'Other Religious Affiliation' }
].sort((a, b) => a.name.localeCompare(b.name));

export const NATIONALITIES = [
    { code: 'FIL', name: 'Filipino' },
    { code: 'AME', name: 'American' },
    { code: 'CHI', name: 'Chinese' },
    { code: 'IND', name: 'Indian' },
    { code: 'JAP', name: 'Japanese' },
    { code: 'KOR', name: 'Korean' },
    { code: 'CAN', name: 'Canadian' },
    { code: 'AUS', name: 'Australian' },
    { code: 'BRT', name: 'British' },
    { code: 'OTH', name: 'Other Nationality' }
].sort((a, b) => {
    // 🎯 If either option is Filipino, force it to the top slot
    if (a.code === 'FIL') return -1;
    if (b.code === 'FIL') return 1;
    // Otherwise, alphabetize normally
    return a.name.localeCompare(b.name);
});

export const EMPLOYMENT_TYPES = [
    {
        id: generateUUID(),
        value: 'regular',
        label: 'Regular'
    },
    {
        id: generateUUID(),
        value: 'probationary',
        label: 'Probationary'
    },
    {
        id: generateUUID(),
        value: 'contractual',
        label: 'Contractual'
    },
    {
        id: generateUUID(),
        value: 'intern',
        label: 'Intern/OJT'
    },
    {
        id: generateUUID(),
        value: 'project-based,',
        label: 'Project-based,'
    },
].sort((a, b) => a.label.localeCompare(b.label));


export const RELATIONSHIP_OPTIONS = [
  { label: 'Spouse', value: 'spouse' },
  { label: 'Child', value: 'child' },
  { label: 'Parent', value: 'parent' },
  { label: 'Sibling', value: 'sibling' },
  { label: 'Relative', value: 'relative' },
  { label: 'Friend', value: 'friend' },
  { label: 'Other', value: 'other' }
].sort((a, b) => a.label.localeCompare(b.label));

// Philippine statutory identifiers. `digits` = the exact digit counts a value may
// have (formatting/dashes stripped first); drives the placeholder + client-side
// validation on the Government & Bank Details page. Mirrors the backend whitelist.
export const PH_STATUTORY_FORMATS = {
    sss_number: { label: 'SSS Number', placeholder: '34-1234567-8', digits: [10] },
    tin_number: { label: 'TIN', placeholder: '123-456-789-000', digits: [9, 12] },
    philhealth_number: { label: 'PhilHealth Number', placeholder: '12-345678901-2', digits: [12] },
    pagibig_number: { label: 'Pag-IBIG MID Number', placeholder: '1234-5678-9012', digits: [12] },
};

export const EDUCATION_LEVELS = [
    { label: 'Elementary', value: 'elementary' },
    { label: 'Secondary / High School', value: 'secondary' },
    { label: 'Vocational', value: 'vocational' },
    { label: 'College', value: 'college' },
    { label: 'Graduate / Post-graduate', value: 'graduate' },
];

export const DOCUMENT_TYPES = [
    { label: 'Resume', value: 'resume' },
    { label: 'Medical', value: 'medical' },
    { label: 'NBI', value: 'nbi' },
    { label: 'Other document', value: 'other' },

];

// Mirrors the attendance.leave_requests `leave_type` enum on the backend.
export const LEAVE_TYPES = [
    { label: 'Vacation Leave', value: 'vacation' },
    { label: 'Sick Leave', value: 'sick' },
    { label: 'Emergency Leave', value: 'emergency' },
    { label: 'Maternity Leave', value: 'maternity' },
    { label: 'Paternity Leave', value: 'paternity' },
    { label: 'Bereavement Leave', value: 'bereavement' },
    { label: 'Unpaid Leave', value: 'unpaid' },
    { label: 'Other', value: 'other' },
];

// How many days back an employee is still allowed to file a leave request.
export const LEAVE_BACKFILE_DAYS = 3;

// Shared pending/approved/rejected/cancelled tone map — used by leave and overtime.
export const LEAVE_STATUS_TONE = {
    pending: 'bg-amber-50 text-amber-700',
    approved: 'bg-emerald-50 text-emerald-700',
    rejected: 'bg-rose-50 text-rose-700',
    cancelled: 'bg-slate-100 text-slate-500',
};
export const REQUEST_STATUS_TONE = LEAVE_STATUS_TONE;

// employee.document_requests `status` enum — distinct from leave/overtime (uses `fulfilled`).
export const DOCUMENT_REQUEST_STATUS_TONE = {
    pending: 'bg-amber-50 text-amber-700',
    fulfilled: 'bg-emerald-50 text-emerald-700',
    cancelled: 'bg-slate-100 text-slate-500',
    declined: 'bg-rose-50 text-rose-700',
};

// payroll.payslip_requests `status` enum — pending | fulfilled | rejected | cancelled.
export const PAYSLIP_REQUEST_STATUS_TONE = {
    pending: 'bg-amber-50 text-amber-700',
    fulfilled: 'bg-emerald-50 text-emerald-700',
    rejected: 'bg-rose-50 text-rose-700',
    cancelled: 'bg-slate-100 text-slate-500',
};

// How many days back an employee may back-file overtime, and the per-day ceiling.
// MAX_OVERTIME_HOURS mirrors MAX_OT_HOURS_PER_DAY in the backend OvertimeRequestController.
export const OVERTIME_BACKFILE_DAYS = 3;
export const MAX_OVERTIME_HOURS = 12;

// Mirrors the announcement.announcements `priority` enum on the backend.
// `icon` names are resolved against lucide-react by the consuming component.
export const ANNOUNCEMENT_PRIORITY = {
    info: {
        label: 'Info',
        icon: 'Megaphone',
        badge: 'bg-sky-50 text-sky-700',
        bar: 'bg-sky-400',
        iconWrap: 'text-sky-500 bg-sky-50',
    },
    important: {
        label: 'Important',
        icon: 'AlertTriangle',
        badge: 'bg-amber-50 text-amber-700',
        bar: 'bg-amber-400',
        iconWrap: 'text-amber-500 bg-amber-50',
    },
    urgent: {
        label: 'Urgent',
        icon: 'Zap',
        badge: 'bg-rose-50 text-rose-700',
        bar: 'bg-rose-400',
        iconWrap: 'text-rose-500 bg-rose-50',
    },
};