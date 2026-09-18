import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { attendanceService } from '../services/attendanceServices';

export const useMyAttendanceHistory = (limit = 5, options = {}) => {
    return useQuery({
        queryKey: ['myAttendance', limit],
        queryFn: () => attendanceService.getMyHistory({ limit }),
        select: (res) => res?.data || [],
        ...options,
    });
};

// Attendance logs within an explicit date window — used for month-to-date stats.
export const useMyAttendanceRange = ({ dateFrom, dateTo } = {}) => {
    return useQuery({
        queryKey: ['myAttendance', 'range', dateFrom, dateTo],
        queryFn: () => attendanceService.getMyHistory({ date_from: dateFrom, date_to: dateTo, limit: 400 }),
        select: (res) => res?.data || [],
        enabled: Boolean(dateFrom && dateTo),
    });
};

export const useClockIn = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: attendanceService.clockIn,
        onSuccess: (data) => {
            toast.success(data?.message || 'Clocked in successfully.');
            queryClient.invalidateQueries({ queryKey: ['myAttendance'] });
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || 'Unable to clock in.');
        },
    });
};

export const useClockOut = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: attendanceService.clockOut,
        onSuccess: (data) => {
            toast.success(data?.message || 'Clocked out successfully.');
            queryClient.invalidateQueries({ queryKey: ['myAttendance'] });
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || 'Unable to clock out.');
        },
    });
};
