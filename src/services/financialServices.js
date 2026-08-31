import apiClient from '../api/index';

export const financialService = {
    // Government identifiers (SSS / PhilHealth / Pag-IBIG / TIN) + payroll bank account.
    // Bank account number comes back decrypted so it can be edited; exempt flags are read-only.
    getStatutory: async () => {
        const { data } = await apiClient.get('/auth/me/statutory');
        return data;
    },

    // payload = { tin_number?, sss_number?, philhealth_number?, pagibig_number?,
    //   bank_name?, bank_account_name?, bank_account_number? }
    updateStatutory: async (payload) => {
        const { data } = await apiClient.patch('/auth/me/statutory', payload);
        return data;
    },

    // Read-only employment summary + effective-dated pay history.
    getEmployment: async () => {
        const { data } = await apiClient.get('/auth/me/employment');
        return data;
    },
};
