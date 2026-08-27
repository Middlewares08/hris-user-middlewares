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
};
