import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { educationService } from '../services/educationServices';

export const useMyEducation = () =>
    useQuery({
        queryKey: ['myEducation'],
        queryFn: educationService.getEducation,
        select: (res) => res?.data || [],
    });

export const useUpdateEducation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: educationService.updateEducation,
        onSuccess: (data) => {
            toast.success(data?.message || 'Educational background updated.');
            queryClient.invalidateQueries({ queryKey: ['myEducation'] });
            queryClient.invalidateQueries({ queryKey: ['myActivity'] });
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || 'Unable to update educational background.');
        },
    });
};
