// src/hooks/useAuth.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { authService } from '../services/authServices';
import { storePermissions, clearPermissions } from '../utils/permissionCheck';
import { useNavigate } from 'react-router-dom';

// The account must carry this to be allowed into the employee PWA at all.
const PORTAL_ACCESS = 'employee-portal:access';

export function useAuth() {
    const [isVerifyOTP, setIsVerifyOTP] = useState(false);
    const [tempToken, setTempToken] = useState('');
    const [maskedPhone, setMaskedPhone] = useState('');
    const [devCode, setDevCode] = useState('');
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // Password Verification Phase
    const loginMutation = useMutation({
        mutationFn: authService.login,
            onSuccess: (data) => {
            // Store the temporary token to send with the OTP code later
            setTempToken(data.token);
            setMaskedPhone(data?.maskedPhone || '');
            setDevCode(data?.devCode || '');
            // Flip the UI to show the OTP view layout state
            setIsVerifyOTP(true);
        },
    });

    // Resend the second-factor code for the in-flight login
    const resendMutation = useMutation({
        mutationFn: () => authService.resendLoginOtp({ token: tempToken }),
        onSuccess: (data) => {
            setMaskedPhone(data?.maskedPhone || maskedPhone);
            setDevCode(data?.devCode || '');
        },
    });


    // OTP Verification Phase
    const otpMutation = useMutation({
        mutationFn: async (payload) => {
            const data = await authService.verifyOtp(payload);
            const permissions = data?.user?.permissions || [];

            // Gate: reject accounts that aren't allowed into the employee app.
            if (!permissions.includes(PORTAL_ACCESS)) {
                const err = new Error("This account doesn't have access to the employee app. Please use the admin dashboard.");
                err.code = 'NO_PORTAL_ACCESS';
                throw err;
            }
            return data;
        },
        onSuccess: (data) => {
            // Your Axios response interceptor expects this token in localStorage
            localStorage.setItem('accessToken', data?.accessToken);
            queryClient.setQueryData(['authUser'], data?.user);
            storePermissions(data?.user?.permissions || []);
            navigate('/home');
        },
        onError: () => {
            // A denied gate check must not leave a half-authenticated session behind.
            localStorage.removeItem('accessToken');
            clearPermissions();
        },
    });


    // Clean error text parsing
    const getError = () => {
        const err = loginMutation.error || otpMutation.error || resendMutation.error;
        return err?.response?.data?.message || err?.response?.data?.errors?.[0]?.msg || err?.message || null;
    };

    return {
        isVerifyOTP,
        login: loginMutation.mutateAsync,
        verifyOtp: otpMutation.mutateAsync,
        resendOtp: resendMutation.mutateAsync,
        resendPending: resendMutation.isPending,
        resendDone: resendMutation.isSuccess,
        tempToken: tempToken,
        maskedPhone,
        devCode,
        loading: loginMutation.isPending || otpMutation.isPending,
        error: getError(),
    };
}