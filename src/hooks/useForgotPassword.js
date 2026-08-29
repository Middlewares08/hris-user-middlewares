// src/hooks/useForgotPassword.js
import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/authServices';

/**
 * Drives the 3-step SMS reset flow:
 *   request  -> user enters email + mobile number, backend texts a code
 *   verify   -> user enters the code, backend returns a one-time reset token
 *   reset    -> user sets a new password
 *   done     -> success screen / back to login
 */
export function useForgotPassword() {
    const [step, setStep] = useState('request');
    const [token, setToken] = useState('');          // temp token from step 1
    const [resetToken, setResetToken] = useState(''); // one-time token from step 2
    const [maskedPhone, setMaskedPhone] = useState('');
    const [devCode, setDevCode] = useState('');        // only present outside production

    const requestMutation = useMutation({
        mutationFn: authService.forgotPassword,
        onSuccess: (data) => {
            setToken(data?.token || '');
            setMaskedPhone(data?.maskedPhone || '');
            setDevCode(data?.devCode || '');
            setStep('verify');
        },
    });

    const verifyMutation = useMutation({
        mutationFn: (otp) => authService.verifyResetOtp({ token, otp }),
        onSuccess: (data) => {
            setResetToken(data?.resetToken || '');
            setStep('reset');
        },
    });

    const resetMutation = useMutation({
        mutationFn: (password) => authService.resetPassword({ token: resetToken, password }),
        onSuccess: () => setStep('done'),
    });

    const resendMutation = useMutation({
        mutationFn: () => authService.forgotPassword(requestMutation.variables),
        onSuccess: (data) => {
            setToken(data?.token || token);
            setMaskedPhone(data?.maskedPhone || maskedPhone);
            setDevCode(data?.devCode || '');
        },
    });

    const activeError = requestMutation.error || verifyMutation.error || resetMutation.error || resendMutation.error;
    const error = useMemo(() => {
        if (!activeError) return null;
        const res = activeError.response?.data;
        return res?.message || res?.errors?.[0]?.msg || activeError.message || 'Something went wrong.';
    }, [activeError]);

    return {
        step,
        maskedPhone,
        devCode,
        error,
        loading:
            requestMutation.isPending ||
            verifyMutation.isPending ||
            resetMutation.isPending ||
            resendMutation.isPending,
        requestReset: (payload) => requestMutation.mutateAsync(payload),
        verifyCode: (otp) => verifyMutation.mutateAsync(otp),
        submitNewPassword: (password) => resetMutation.mutateAsync(password),
        resend: () => resendMutation.mutateAsync(),
        resendState: {
            loading: resendMutation.isPending,
            done: resendMutation.isSuccess,
        },
        back: () => setStep('request'),
    };
}
