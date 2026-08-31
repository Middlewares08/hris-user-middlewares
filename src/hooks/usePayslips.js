import { useQuery } from '@tanstack/react-query';
import { payslipService } from '../services/payslipServices';

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
