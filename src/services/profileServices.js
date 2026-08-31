import apiClient from '../api/index';

export const profileService = {
    // The authenticated employee's editable profile (contact, address, emergency contact)
    // plus a read-only identity block (name, position, login email, demographics).
    getMine: async () => {
        const { data } = await apiClient.get('/auth/me/profile');
        return data;
    },

    // payload = { preferred_name?, personal_email?, personal_phone?,
    //   emergency_contact_name?, emergency_contact_relationship?, emergency_contact_phone?,
    //   street_address?, barangay?, city?, state_province?, region?, postal_code? }
    updateMine: async (payload) => {
        const { data } = await apiClient.patch('/auth/me/profile', payload);
        return data;
    },

    // Notification opt-ins + channel + UI prefs. Server merges over defaults.
    getPreferences: async () => {
        const { data } = await apiClient.get('/auth/me/preferences');
        return data;
    },

    updatePreferences: async (payload) => {
        const { data } = await apiClient.patch('/auth/me/preferences', payload);
        return data;
    },
};
