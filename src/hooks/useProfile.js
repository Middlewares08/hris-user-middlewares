import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { profileService } from '../services/profileServices';

export const useMyProfile = () =>
    useQuery({
        queryKey: ['myProfile'],
        queryFn: profileService.getMine,
        select: (res) => res?.data || null,
    });

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: profileService.updateMine,
        onSuccess: (data) => {
            toast.success(data?.message || 'Profile updated.');
            queryClient.invalidateQueries({ queryKey: ['myProfile'] });
            queryClient.invalidateQueries({ queryKey: ['authUser'] });
            queryClient.invalidateQueries({ queryKey: ['myActivity'] });
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || 'Unable to update profile.');
        },
    });
};

export const useMyPreferences = () =>
    useQuery({
        queryKey: ['myPreferences'],
        queryFn: profileService.getPreferences,
        select: (res) => res?.data || null,
        staleTime: 5 * 60 * 1000,
    });

export const useUpdatePreferences = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: profileService.updatePreferences,
        onSuccess: (data) => {
            toast.success(data?.message || 'Preferences saved.');
            // Server echoes the merged bag — prime the cache so the UI doesn't flicker.
            if (data?.data) queryClient.setQueryData(['myPreferences'], { data: data.data });
            queryClient.invalidateQueries({ queryKey: ['myPreferences'] });
            queryClient.invalidateQueries({ queryKey: ['myActivity'] });
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || 'Unable to save preferences.');
        },
    });
};
