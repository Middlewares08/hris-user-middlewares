import apiClient from '../api/index';

/**
 * Build the request for a punch:
 *   - `image` (Blob)          -> multipart/form-data face photo
 *   - `livenessSessionId`     -> JSON body with a completed liveness session
 *   - neither                 -> plain punch
 */
const punchRequest = (path, { image, livenessSessionId } = {}) => {
    if (image) {
        const form = new FormData();
        form.append('image', image, 'face.jpg');
        return apiClient.post(path, form, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    if (livenessSessionId) {
        return apiClient.post(path, { liveness_session_id: livenessSessionId });
    }
    return apiClient.post(path);
};

export const attendanceService = {
    // args: { image?: Blob, livenessSessionId?: string }
    clockIn: async (args = {}) => {
        const { data } = await punchRequest('/attendance/clock-in', args);
        return data;
    },

    clockOut: async (args = {}) => {
        const { data } = await punchRequest('/attendance/clock-out', args);
        return data;
    },

    // params = { limit, date_from, date_to }
    getMyHistory: async (params = {}) => {
        const { data } = await apiClient.get('/attendance/me', { params });
        return data;
    },
};
