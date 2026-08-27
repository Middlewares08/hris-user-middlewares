import { useQuery } from '@tanstack/react-query';
import { announcementService } from '../services/announcementServices';

export const useAnnouncements = (limit = 20) => {
    return useQuery({
        queryKey: ['announcements', limit],
        queryFn: () => announcementService.getPublished({ limit }),
        select: (res) => res?.data || [],
    });
};

export const useAnnouncement = (uuid) => {
    return useQuery({
        queryKey: ['announcement', uuid],
        queryFn: () => announcementService.getByUuid(uuid),
        select: (res) => res?.data || null,
        enabled: Boolean(uuid),
    });
};
