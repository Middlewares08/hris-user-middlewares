import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { activityService } from '../services/activityServices';

export const useMyActivity = (limit = 5) => {
    return useQuery({
        queryKey: ['myActivity', limit],
        queryFn: () => activityService.getMyActivity({ limit }),
        select: (res) => res?.data || [],
    });
};

export const useLogActivity = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: activityService.logActivity,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myActivity'] });
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || 'Unable to record activity.');
        },
    });
};
