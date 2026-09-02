import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { documentService } from '../services/documentServices';

const invalidateKeys = (queryClient) => {
    queryClient.invalidateQueries({ queryKey: ['myDocuments'] });
    queryClient.invalidateQueries({ queryKey: ['myDocumentRequests'] });
    queryClient.invalidateQueries({ queryKey: ['myActivity'] });
};

export const useMyDocuments = () =>
    useQuery({
        queryKey: ['myDocuments'],
        queryFn: documentService.getMine,
        select: (res) => res?.data || [],
    });

export const useMyDocumentRequests = () =>
    useQuery({
        queryKey: ['myDocumentRequests'],
        queryFn: documentService.getMyRequests,
        select: (res) => res?.data || [],
    });

export const useCreateDocumentRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: documentService.createRequest,
        onSuccess: (data) => {
            toast.success(data?.message || 'Request sent to HR.');
            invalidateKeys(queryClient);
        },
        onError: (error) => toast.error(error?.response?.data?.message || 'Unable to send request.'),
    });
};

export const useCancelDocumentRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => documentService.cancelRequest(id),
        onSuccess: (data) => {
            toast.success(data?.message || 'Request withdrawn.');
            invalidateKeys(queryClient);
        },
        onError: (error) => toast.error(error?.response?.data?.message || 'Unable to withdraw request.'),
    });
};

export const useUploadDocument = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: documentService.upload,
        onSuccess: (data) => {
            toast.success(data?.message || 'Document uploaded.');
            invalidateKeys(queryClient);
        },
        onError: (error) => toast.error(error?.response?.data?.message || 'Unable to upload document.'),
    });
};

export const useUpdateDocument = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, formData }) => documentService.update(id, formData),
        onSuccess: (data) => {
            toast.success(data?.message || 'Document updated.');
            invalidateKeys(queryClient);
        },
        onError: (error) => toast.error(error?.response?.data?.message || 'Unable to update document.'),
    });
};

export const useDeleteDocument = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => documentService.remove(id),
        onSuccess: (data) => {
            toast.success(data?.message || 'Document removed.');
            invalidateKeys(queryClient);
        },
        onError: (error) => toast.error(error?.response?.data?.message || 'Unable to remove document.'),
    });
};
