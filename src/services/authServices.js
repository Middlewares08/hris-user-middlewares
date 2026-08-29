// src/api/index.js
import  apiClient  from '../api/index';

export const authService = {
    login: async (payload) => {
        // payload = { email, password }
        const { data } = await apiClient.post('/auth/login', payload);
        return data;
    },
    verifyOtp: async (payload) => {
        // payload = { token, otp, email }
        const { data } = await apiClient.post('/auth/login/verify-otp', payload);
        return data;
    },
    resendLoginOtp: async (payload) => {
        // payload = { token }
        const { data } = await apiClient.post('/auth/login/resend-otp', payload);
        return data;
    },

    // --- Forgot password (SMS OTP) ---
    forgotPassword: async (payload) => {
        // payload = { email, phone }
        const { data } = await apiClient.post('/auth/forgot-password', payload);
        return data;
    },
    verifyResetOtp: async (payload) => {
        // payload = { token, otp }
        const { data } = await apiClient.post('/auth/forgot-password/verify-otp', payload);
        return data;
    },
    resetPassword: async (payload) => {
        // payload = { token, password }
        const { data } = await apiClient.post('/auth/reset-password', payload);
        return data;
    },

    getCurrentProfile: async () => {
        const response = await apiClient.get('/auth/me');
        return response.data; // Resolves to the user layout data block
    }
};
