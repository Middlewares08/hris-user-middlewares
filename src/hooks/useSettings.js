import { useQuery } from '@tanstack/react-query';
import { settingsService } from '../services/settingsServices';

/**
 * Public application settings / feature flags. Cached generously — these change rarely.
 */
export const usePublicSettings = () => {
    return useQuery({
        queryKey: ['publicSettings'],
        queryFn: settingsService.getPublic,
        select: (res) => res?.data || {},
        staleTime: 5 * 60 * 1000,
    });
};

export const useFeatureFlag = (key, fallback = false) => {
    const { data = {}, isLoading } = usePublicSettings();
    const value = key in data ? data[key] : fallback;
    return { enabled: value === true, isLoading };
};
