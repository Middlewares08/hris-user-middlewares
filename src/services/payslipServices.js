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
};
