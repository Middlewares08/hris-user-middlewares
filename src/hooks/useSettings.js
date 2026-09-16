import { useQuery } from '@tanstack/react-query';
import { settingsService } from '../services/settingsServices';

/**
 * Public application settings / feature flags. Short staleTime so an admin toggle
 * (e.g. disabling the face-liveness challenge) reaches an already-open session
 * quickly via React Query's normal refetch-on-focus/-mount, without a poll.
 */
export const usePublicSettings = () => {
    return useQuery({
        queryKey: ['publicSettings'],
        queryFn: settingsService.getPublic,
        select: (res) => res?.data || {},
        staleTime: 30 * 1000,
    });
};

export const useFeatureFlag = (key, fallback = false) => {
    const { data = {}, isLoading } = usePublicSettings();
    const value = key in data ? data[key] : fallback;
    return { enabled: value === true, isLoading };
};
