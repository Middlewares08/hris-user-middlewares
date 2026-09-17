import apiClient from '../api/index';

export const licenseService = {
    /** Unauthenticated — drives the app-wide license gate on every page load. */
    getStatus: async () => {
        const { data } = await apiClient.get('/public/license/status');
        return data;
    },

    /** Unauthenticated — the "add a license" recovery form on /license-expired. */
    activate: async ({ productKey, email }) => {
        const { data } = await apiClient.post('/public/license/activate', { productKey, email });
        return data;
    },
};
