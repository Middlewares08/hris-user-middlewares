import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { leaveService } from '../services/leaveServices';

export const useMyLeaveRequests = (limit = 50) => {
    return useQuery({
        queryKey: ['myLeaveRequests', limit],
        queryFn: () => leaveService.getMyRequests({ limit }),
        select: (res) => res?.data || [],
    });
};

export const useCreateLeaveRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: leaveService.createRequest,
        onSuccess: (data) => {
            toast.success(data?.message || 'Leave request submitted.');
            queryClient.invalidateQueries({ queryKey: ['myLeaveRequests'] });
            queryClient.invalidateQueries({ queryKey: ['myActivity'] });
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || 'Unable to submit leave request.');
        },
    });
};

export const useCancelLeaveRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (uuid) => leaveService.cancelRequest(uuid),
        onSuccess: (data) => {
            toast.success(data?.message || 'Leave request cancelled.');
            queryClient.invalidateQueries({ queryKey: ['myLeaveRequests'] });
            queryClient.invalidateQueries({ queryKey: ['myActivity'] });
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || 'Unable to cancel leave request.');
        },
    });
};
