import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { financialService } from '../services/financialServices';

export const useMyStatutory = () =>
    useQuery({
        queryKey: ['myStatutory'],
        queryFn: financialService.getStatutory,
        select: (res) => res?.data || null,
    });

export const useUpdateStatutory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: financialService.updateStatutory,
        onSuccess: (data) => {
            toast.success(data?.message || 'Details updated.');
            queryClient.invalidateQueries({ queryKey: ['myStatutory'] });
            queryClient.invalidateQueries({ queryKey: ['myEmployment'] });
            queryClient.invalidateQueries({ queryKey: ['myActivity'] });
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || 'Unable to update details.');
        },
    });
};

export const useMyEmployment = () =>
    useQuery({
        queryKey: ['myEmployment'],
        queryFn: financialService.getEmployment,
        select: (res) => res?.data || null,
        staleTime: 5 * 60 * 1000,
    });
