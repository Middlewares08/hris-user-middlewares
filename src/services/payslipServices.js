import apiClient from '../api/index';

export const payslipService = {
    // params = { limit }
    getMine: async (params = {}) => {
        const { data } = await apiClient.get('/payroll/payslips/me', { params });
        return data;
    },

    getByUuid: async (uuid) => {
        const { data } = await apiClient.get(`/payroll/payslips/me/${uuid}`);
        return data;
    },

    // Nearest upcoming pay period (falls back to the latest past one server-side).
    getNextPeriod: async () => {
        const { data } = await apiClient.get('/payroll/periods/next');
        return data;
    },

    // Raw axios response so the caller can read the blob + Content-Disposition.
    downloadPdf: async (uuid) =>
        apiClient.get(`/payroll/payslips/me/${uuid}/pdf`, { responseType: 'blob' }),

    // --- Payslip copy requests ---
    getMyRequests: async () => {
        const { data } = await apiClient.get('/payroll/payslip-requests/me');
        return data;
    },
    createRequest: async (payload) => {
        const { data } = await apiClient.post('/payroll/payslip-requests', payload);
        return data;
    },
    cancelRequest: async (uuid) => {
        const { data } = await apiClient.patch(`/payroll/payslip-requests/me/${uuid}/cancel`);
        return data;
    },
};
