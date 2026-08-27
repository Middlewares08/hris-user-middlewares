import apiClient from '../api/index';

export const activityService = {
    // params = { limit, category, date_from, date_to }
    getMyActivity: async (params = {}) => {
        const { data } = await apiClient.get('/activity-logs/data/me', { params });
        return data;
    },

    // payload = { action, category, description, metadata, employee_id? }
    logActivity: async (payload) => {
        const { data } = await apiClient.post('/activity-logs', payload);
        return data;
    },
};
