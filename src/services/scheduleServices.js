import apiClient from '../api/index';

/**
 * Employee-facing, read-only: the caller's own work schedule, the org holiday
 * calendar, and a schedule-aware attendance summary.
 */
export const scheduleService = {
    getMySchedule: async () => {
        const { data } = await apiClient.get('/auth/me/schedule');
        return data;
    },

    // params = { year }
    getHolidays: async (params = {}) => {
        const { data } = await apiClient.get('/auth/me/holidays', { params });
        return data;
    },

    // params = { month: 'YYYY-MM' }
    getAttendanceSummary: async (params = {}) => {
        const { data } = await apiClient.get('/attendance/me/summary', { params });
        return data;
    },
};
