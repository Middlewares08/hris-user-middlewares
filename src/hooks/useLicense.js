import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { licenseService } from '../services/licenseServices';

const errMsg = (err, fallback) => err?.response?.data?.message || err?.message || fallback;

/**
 * Unauthenticated license status — drives the app-wide gate in App.jsx that
 * bounces to /license-expired before the user ever reaches the login screen.
 */
export function useLicenseStatus() {
    const query = useQuery({
        queryKey: ['licenseStatus'],
        queryFn: licenseService.getStatus,
        select: (res) => res?.data || {},
        staleTime: 60 * 1000,
        retry: 1,
    });

    return {
        // Fail safe: if the check itself errors, assume NOT expired — mirrors
        // licenseGuard.js's own fail-open behavior server-side. A bug or DB
        // hiccup in this check must never accidentally lock everyone out.
        expired: query.isError ? false : (query.data?.expired ?? false),
        hasLicense: query.isError ? true : (query.data?.hasLicense ?? true),
        isLoading: query.isLoading,
    };
}

/** Submits a product key + email from the /license-expired recovery form. */
export function useActivateLicense() {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: licenseService.activate,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['licenseStatus'] }),
    });

    return {
        activate: mutation.mutateAsync,
        isActivating: mutation.isPending,
        error: mutation.error ? errMsg(mutation.error, 'Could not activate the license.') : null,
    };
}
