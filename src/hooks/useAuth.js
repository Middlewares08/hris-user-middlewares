// src/hooks/useAuth.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { authService } from '../services/authServices';
import { useNavigate } from 'react-router-dom';

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
        mutationFn: authService.verifyOtp,
        onSuccess: (data) => {
            // Your Axios response interceptor expects this token in localStorage
            localStorage.setItem('accessToken', data?.accessToken);
            // Securely redirect to your main dashboard page
            queryClient.setQueryData(['authUser'], data?.user);
            
            // set permission to session
            const rawPermissionsArray = data?.user?.permissions || []; // e.g., ['view', 'edit']

            // Convert array to a clean string, then encode it to Base64
            const encodedPermissions = btoa(JSON.stringify(rawPermissionsArray));

            sessionStorage.setItem('permissions', encodedPermissions);
            navigate('/home');
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