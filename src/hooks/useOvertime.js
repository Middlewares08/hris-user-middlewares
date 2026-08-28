import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { overtimeService } from '../services/overtimeServices';

export const useMyOvertimeRequests = (limit = 50) => {
    return useQuery({
        queryKey: ['myOvertimeRequests', limit],
        queryFn: () => overtimeService.getMyRequests({ limit }),
        select: (res) => res?.data || [],
    });
};

export const useCreateOvertimeRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: overtimeService.createRequest,
        onSuccess: (data) => {
            toast.success(data?.message || 'Overtime request submitted.');
            queryClient.invalidateQueries({ queryKey: ['myOvertimeRequests'] });
            queryClient.invalidateQueries({ queryKey: ['myActivity'] });
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || 'Unable to submit overtime request.');
        },
    });
};

export const useCancelOvertimeRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (uuid) => overtimeService.cancelRequest(uuid),
        onSuccess: (data) => {
            toast.success(data?.message || 'Overtime request cancelled.');
            queryClient.invalidateQueries({ queryKey: ['myOvertimeRequests'] });
            queryClient.invalidateQueries({ queryKey: ['myActivity'] });
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || 'Unable to cancel overtime request.');
        },
    });
};
