import apiClient from '../api/index';

export const faceEnrollmentService = {
    // Lightweight enrollment status for the authenticated employee:
    //   { enrolled: boolean, status: string|null, enrolled_at: string|null }
    getMine: async () => {
        const { data } = await apiClient.get('/face-enrollment/me');
        return data;
    },
};
