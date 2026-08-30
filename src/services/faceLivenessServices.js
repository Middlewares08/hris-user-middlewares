import apiClient from '../api/index';

export const faceLivenessService = {
    // Starts a Rekognition Face Liveness session for the current employee and
    // returns { sessionId, region, credentials } for the Amplify detector.
    createSession: async () => {
        const { data } = await apiClient.post('/face-liveness/session');
        return data;
    },
};
