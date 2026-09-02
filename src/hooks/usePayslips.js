import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { payslipService } from '../services/payslipServices';
import { downloadBlob, filenameFromHeaders } from '../utils/downloadBlob';

// Fetches a payslip PDF for the signed-in employee and hands it to the browser.
export async function downloadMyPayslipPdf(uuid) {
    try {
        const res = await payslipService.downloadPdf(uuid);
        downloadBlob(res.data, filenameFromHeaders(res.headers, `payslip-${uuid}.pdf`));
    } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to download payslip PDF.');
    }
}

// List of the authenticated employee's released payslips (newest first).
export const useMyPayslips = (limit = 12) => {
    return useQuery({
        queryKey: ['myPayslips', limit],
        queryFn: () => payslipService.getMine({ limit }),
        select: (res) => res?.data || [],
    });
};

// Nearest upcoming pay date — drives the dashboard "Next Payday" tile.
export const useNextPayday = () => {
    return useQuery({
        queryKey: ['nextPayday'],
        queryFn: payslipService.getNextPeriod,
        select: (res) => res?.data || null,
        staleTime: 60 * 60 * 1000,
    });
};

// Single payslip (with line items + run/period) via its uuid.
export const useMyPayslip = (uuid) => {
    return useQuery({
        queryKey: ['myPayslip', uuid],
        queryFn: () => payslipService.getByUuid(uuid),
        select: (res) => res?.data || null,
        enabled: Boolean(uuid),
    });
};

// The employee's own payslip copy requests (newest first).
export const useMyPayslipRequests = () => {
    return useQuery({
        queryKey: ['myPayslipRequests'],
        queryFn: payslipService.getMyRequests,
        select: (res) => res?.data || [],
    });
};

export const useCreatePayslipRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: payslipService.createRequest,
        onSuccess: (data) => {
            toast.success(data?.message || 'Payslip request submitted.');
            queryClient.invalidateQueries({ queryKey: ['myPayslipRequests'] });
            queryClient.invalidateQueries({ queryKey: ['myActivity'] });
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || 'Unable to submit payslip request.');
        },
    });
};

export const useCancelPayslipRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (uuid) => payslipService.cancelRequest(uuid),
        onSuccess: (data) => {
            toast.success(data?.message || 'Payslip request cancelled.');
            queryClient.invalidateQueries({ queryKey: ['myPayslipRequests'] });
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || 'Unable to cancel payslip request.');
        },
    });
};
