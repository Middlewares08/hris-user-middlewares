import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Fingerprint,
    Wallet,
    FileText,
    CalendarClock,
    Landmark,
    Megaphone,
    ArrowRight,
    Download,
    Smartphone,
    LifeBuoy,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import ContactAdminModal from '../components/ContactAdminModal';

const FEATURES = [
    {
        icon: Fingerprint,
        title: 'Clock in from anywhere',
        body: 'Face-verified time in and out, with your attendance history always a tap away.',
    },
    {
        icon: Wallet,
        title: 'Payslips & next payday',
        body: 'View and download official payslips, and see exactly when you get paid next.',
    },
    {
        icon: CalendarClock,
        title: 'File leave & overtime',
        body: 'Request time off or log overtime and track approvals without chasing anyone.',
    },
    {
        icon: FileText,
        title: 'Your documents',
        body: 'Access company documents and request certificates and letters from HR.',
    },
    {
        icon: Landmark,
        title: 'Government details',
        body: 'Keep your SSS, PhilHealth, Pag-IBIG, TIN, and payroll bank account up to date.',
    },
    {
        icon: Megaphone,
        title: 'Company announcements',
        body: 'Never miss a memo — priority notices surface the moment you open the app.',
    },
];

function Landing() {
    const isAuthed = Boolean(localStorage.getItem('accessToken'));
    const { isInstallable, installApp } = usePWAInstall();
    const primaryTo = isAuthed ? '/home' : '/login';
    const [contactOpen, setContactOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
            {/* Nav */}
            <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
                <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-linear-to-br from-violet-600 to-indigo-600 text-white shadow-sm">
                        <Smartphone size={18} />
                    </span>
                    <span className="text-base font-semibold tracking-tight">
                        HRIS <span className="text-slate-400">Employee</span>
                    </span>
                </div>
                <Link
                    to={primaryTo}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                >
                    {isAuthed ? 'Open app' : 'Sign in'}
                </Link>
            </header>

            {/* Hero */}
            <section className="mx-auto max-w-6xl px-6 pb-16 pt-12 sm:pt-20">
                <div className="mx-auto max-w-3xl text-center">
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Installable · works offline
                    </span>
                    <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-700! sm:text-5xl">
                        Your workday,
                        <span className="bg-linear-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                            {' '}in your pocket
                        </span>
                    </h1>
                    <div className=' flex flex-col items-center justify-center'>
                        <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-slate-600">
                            Clock in, check your payslip, file leave, and stay on top of company news — all from
                            one app you can install on your phone.
                        </p>
                    </div>
                    
                    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <Link
                            to={primaryTo}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 sm:w-auto"
                        >
                            {isAuthed ? 'Open the app' : 'Sign in to your account'}
                            <ArrowRight size={16} />
                        </Link>
                        {isInstallable && (
                            <button
                                type="button"
                                onClick={installApp}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 sm:w-auto"
                            >
                                <Download size={16} />
                                Install the app
                            </button>
                        )}
                    </div>
                    <p className="pt-4 text-xs text-slate-400">
                        Trouble signing in?{' '}
                        <button
                            type="button"
                            onClick={() => setContactOpen(true)}
                            className="font-medium text-indigo-600 underline-offset-2 hover:underline"
                        >
                            Contact an admin
                        </button>
                    </p>
                </div>

                {/* Features */}
                <div className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {FEATURES.map(({ icon: Icon, title, body }) => (
                        <div
                            key={title}
                            className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                        >
                            <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700">
                                <Icon size={18} />
                            </span>
                            <h3 className="mt-4 text-sm font-semibold text-slate-900">{title}</h3>
                            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{body}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-200/70">
                <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-slate-400 sm:flex-row">
                    <span>&copy; {new Date().getFullYear()} HRIS Middleware. For employees only.</span>
                    <div className="flex items-center gap-4">
                        <Link to="/login" className="hover:text-slate-600">Sign in</Link>
                        <Link to="/forgot-password" className="hover:text-slate-600">Forgot password</Link>
                        <button
                            type="button"
                            onClick={() => setContactOpen(true)}
                            className="inline-flex items-center gap-1 hover:text-slate-600"
                        >
                            <LifeBuoy size={12} /> Contact an admin
                        </button>
                    </div>
                </div>
            </footer>

            <ContactAdminModal
                isOpen={contactOpen}
                onClose={() => setContactOpen(false)}
                source="employee-app · landing"
            />
        </div>
    );
}

export default Landing;
