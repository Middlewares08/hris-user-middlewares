import PropTypes from 'prop-types';
import { History } from 'lucide-react';
import CustomModal from '../CustomModal';
import CustomButton from '../CustomButton';
import ActivityTimeline from './ActivityTimeline';

function RecentActivityModal({ isOpen, onClose, activity, isLoading }) {
    return (
        <CustomModal
            isOpen={isOpen}
            onClose={onClose}
            title="Recent Activity"
            size="md"
            showCloseButton
            footer={
                <CustomButton variant="outline" size="sm" onClick={onClose}>
                    Close
                </CustomButton>
            }
        >
            <div className="flex flex-col gap-3 text-left">
                <div className="flex items-center gap-2.5">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-2 text-slate-500">
                        <History size={18} />
                    </div>
                    <p className="text-xs text-slate-400">Everything logged on your account, newest first.</p>
                </div>

                <div className="">
                    <ActivityTimeline activity={activity} isLoading={isLoading} />
                </div>
            </div>
        </CustomModal>
    );
}

RecentActivityModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    activity: PropTypes.arrayOf(PropTypes.object),
    isLoading: PropTypes.bool,
};

RecentActivityModal.defaultProps = {
    activity: [],
    isLoading: false,
};

export default RecentActivityModal;
