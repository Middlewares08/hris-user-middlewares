import apiClient from '../api/index';

export const attendanceService = {
    clockIn: async (payload = {}) => {
        const { data } = await apiClient.post('/attendance/clock-in', payload);
        return data;
    },

    clockOut: async () => {
        const { data } = await apiClient.post('/attendance/clock-out');
        return data;
    },

    // params = { limit, date_from, date_to }
    getMyHistory: async (params = {}) => {
        const { data } = await apiClient.get('/attendance/me', { params });
        return data;
    },
};
