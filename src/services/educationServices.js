import apiClient from '../api/index';

export const educationService = {
    // Returns the employee's own educational background list, newest year_graduated first.
    getEducation: async () => {
        const { data } = await apiClient.get('/auth/me/education');
        return data;
    },

    // payload = { education: [{ education_level, school_name, degree?, year_started?, year_graduated?, honors? }] }
    // Replaces the whole list — send every row you want kept, not just the changed ones.
    updateEducation: async (payload) => {
        const { data } = await apiClient.patch('/auth/me/education', payload);
        return data;
    },
};
