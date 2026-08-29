// src/pages/ForgotPassword.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Mail, Phone, ShieldCheck } from 'lucide-react';
import CustomButton from '../components/CustomButton';
import CustomInput from '../components/CustomInput';
import { useForgotPassword } from '../hooks/useForgotPassword';

function ForgotPassword() {
    const navigate = useNavigate();
    const {
        step,
        maskedPhone,
        devCode,
        error,
        loading,
        requestReset,
        verifyCode,
        submitNewPassword,
        resend,
        resendState,
    } = useForgotPassword();

    const [identity, setIdentity] = useState({ email: '', phone: '' });
    const [otp, setOtp] = useState('');
    const [passwords, setPasswords] = useState({ password: '', confirm: '' });

    const mismatch =
        passwords.confirm.length > 0 && passwords.password !== passwords.confirm;

    const onRequest = async (e) => {
        e.preventDefault();
        try {
            await requestReset(identity);
        } catch { /* surfaced via `error` */ }
    };

    const onVerify = async (e) => {
        e.preventDefault();
        try {
            await verifyCode(otp);
        } catch { /* surfaced via `error` */ }
    };

    const onReset = async (e) => {
        e.preventDefault();
        if (mismatch || passwords.password.length < 8) return;
        try {
            await submitNewPassword(passwords.password);
        } catch { /* surfaced via `error` */ }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center h-[80vh]">
            <div className="bg-white rounded-2xl shadow-lg shadow-black/5 ring-1 ring-black/5 p-10 w-full max-w-sm space-y-6">
                <div className="space-y-1 text-center">
                    <p className="text-2xl font-semibold leading-snug text-slate-900">Reset your password</p>
                    <p className="text-sm text-slate-500">
                        {step === 'request' && 'Confirm your email and registered mobile number'}
                        {step === 'verify' && `Enter the 6-digit code sent to ${maskedPhone || 'your phone'}`}
                        {step === 'reset' && 'Choose a new password'}
                        {step === 'done' && 'All set'}
                    </p>
                </div>

                {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium p-3 rounded-lg text-center">
                        {error}
                    </div>
                )}

                {devCode && step === 'verify' && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium p-3 rounded-lg text-center">
                        Dev mode — your code is <span className="font-mono font-bold">{devCode}</span>
                    </div>
                )}

                {step === 'request' && (
                    <form onSubmit={onRequest} className="space-y-4">
                        <CustomInput
                            label="Email"
                            icon={Mail}
                            type="email"
                            value={identity.email}
                            isRequired
                            placeholder="you@example.com"
                            onChange={(e) => setIdentity((p) => ({ ...p, email: e.target.value }))}
                        />
                        <CustomInput
                            label="Registered mobile number"
                            icon={Phone}
                            type="tel"
                            value={identity.phone}
                            isRequired
                            placeholder="09XXXXXXXXX"
                            onChange={(e) => setIdentity((p) => ({ ...p, phone: e.target.value }))}
                        />
                        <CustomButton type="submit" disabled={loading} isLoading={loading} variant="primary">
                            Send code
                        </CustomButton>
                    </form>
                )}

                {step === 'verify' && (
                    <form onSubmit={onVerify} className="space-y-4">
                        <CustomInput
                            label="One-Time Code"
                            icon={ShieldCheck}
                            type="text"
                            value={otp}
                            isRequired
                            maxLength={6}
                            placeholder="000000"
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            inputClassName="tracking-widest placeholder:tracking-normal font-mono"
                        />
                        <CustomButton type="submit" disabled={loading || otp.length < 6} isLoading={loading} variant="primary">
                            Verify code
                        </CustomButton>
                        <button
                            type="button"
                            onClick={() => resend().catch(() => {})}
                            disabled={resendState.loading}
                            className="w-full text-xs text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-50"
                        >
                            {resendState.loading
                                ? 'Sending…'
                                : resendState.done
                                    ? 'New code sent'
                                    : "Didn't get it? Resend code"}
                        </button>
                    </form>
                )}

                {step === 'reset' && (
                    <form onSubmit={onReset} className="space-y-4">
                        <CustomInput
                            label="New password"
                            icon={Lock}
                            type="password"
                            value={passwords.password}
                            isRequired
                            minLength={8}
                            placeholder="At least 8 characters"
                            onChange={(e) => setPasswords((p) => ({ ...p, password: e.target.value }))}
                        />
                        <CustomInput
                            label="Confirm new password"
                            icon={Lock}
                            type="password"
                            value={passwords.confirm}
                            isRequired
                            error={mismatch}
                            errorLabel={mismatch ? 'Passwords do not match' : ''}
                            placeholder="Re-enter password"
                            onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                        />
                        <CustomButton
                            type="submit"
                            disabled={loading || mismatch || passwords.password.length < 8}
                            isLoading={loading}
                            variant="primary"
                        >
                            Update password
                        </CustomButton>
                    </form>
                )}

                {step === 'done' && (
                    <div className="space-y-4">
                        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm p-4 rounded-lg text-center">
                            Your password has been updated. Sign in with your new password.
                        </div>
                        <CustomButton type="button" variant="primary" onClick={() => navigate('/login')}>
                            Back to sign in
                        </CustomButton>
                    </div>
                )}

                {step !== 'done' && (
                    <div className="pt-2">
                        <Link to="/login" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 transition-colors">
                            <ArrowLeft size={14} /> Back to sign in
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ForgotPassword;
