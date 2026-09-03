import { useQuery } from '@tanstack/react-query';
import { scheduleService } from '../services/scheduleServices';

/** The employee's own work schedule + today's expected shift. */
export const useMySchedule = () =>
    useQuery({
        queryKey: ['mySchedule'],
        queryFn: () => scheduleService.getMySchedule(),
        select: (res) => res?.data || null,
        staleTime: 5 * 60 * 1000,
    });

/** Org holiday calendar for a given year (defaults to current year server-side). */
export const useMyHolidays = (year) =>
    useQuery({
        queryKey: ['myHolidays', year || 'current'],
        queryFn: () => scheduleService.getHolidays(year ? { year } : {}),
        select: (res) => res?.data || [],
        staleTime: 30 * 60 * 1000,
    });

/** Schedule-aware month-to-date attendance summary (`month` = 'YYYY-MM'). */
export const useMyAttendanceSummary = (month) =>
    useQuery({
        queryKey: ['myAttendanceSummary', month || 'current'],
        queryFn: () => scheduleService.getAttendanceSummary(month ? { month } : {}),
        select: (res) => res?.data || null,
    });
