import apiClient from '../api/index';

export const leaveService = {
    // params = { status, leave_type, date_from, date_to, limit }
    getMyRequests: async (params = {}) => {
        const { data } = await apiClient.get('/leave-requests/me', { params });
        return data;
    },

    // payload = { leave_type, start_date, end_date, is_half_day, reason }
    createRequest: async (payload) => {
        const { data } = await apiClient.post('/leave-requests', payload);
        return data;
    },

    // payload = { leave_type?, start_date?, end_date?, is_half_day?, reason? }
    updateRequest: async (uuid, payload) => {
        const { data } = await apiClient.put(`/leave-requests/${uuid}`, payload);
        return data;
    },

    cancelRequest: async (uuid) => {
        const { data } = await apiClient.patch(`/leave-requests/${uuid}/cancel`);
        return data;
    },
};
