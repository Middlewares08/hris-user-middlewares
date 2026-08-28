import apiClient from '../api/index';

export const overtimeService = {
    // params = { status, date_from, date_to, limit }
    getMyRequests: async (params = {}) => {
        const { data } = await apiClient.get('/overtime-requests/me', { params });
        return data;
    },

    // payload = { work_date, hours, reason }
    createRequest: async (payload) => {
        const { data } = await apiClient.post('/overtime-requests', payload);
        return data;
    },

    // payload = { work_date?, hours?, reason? }
    updateRequest: async (uuid, payload) => {
        const { data } = await apiClient.put(`/overtime-requests/${uuid}`, payload);
        return data;
    },

    cancelRequest: async (uuid) => {
        const { data } = await apiClient.patch(`/overtime-requests/${uuid}/cancel`);
        return data;
    },
};
