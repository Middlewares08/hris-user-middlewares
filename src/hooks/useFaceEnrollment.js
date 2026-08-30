import { useQuery } from '@tanstack/react-query';
import { faceEnrollmentService } from '../services/faceEnrollmentServices';

/**
 * Whether the current employee has an active face enrollment. Cached generously —
 * it only changes when HR (re-)enrolls or removes the employee's face.
 */
export const useMyFaceEnrollment = () => {
    return useQuery({
        queryKey: ['myFaceEnrollment'],
        queryFn: faceEnrollmentService.getMine,
        select: (res) => res?.data || { enrolled: false },
        staleTime: 5 * 60 * 1000,
    });
};
