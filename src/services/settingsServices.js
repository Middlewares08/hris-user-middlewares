import apiClient from '../api/index';

export const settingsService = {
    // Public feature-flag subset for the authenticated employee, e.g. { 'overtime.enabled': true }
    getPublic: async () => {
        const { data } = await apiClient.get('/system/settings/public');
        return data;
    },
};
