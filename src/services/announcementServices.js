import apiClient from '../api/index';

export const announcementService = {
    // params = { limit }
    getPublished: async (params = {}) => {
        const { data } = await apiClient.get('/announcements/me', { params });
        return data;
    },

    getByUuid: async (uuid) => {
        const { data } = await apiClient.get(`/announcements/me/${uuid}`);
        return data;
    },
};
