import PropTypes from 'prop-types';
import { Fingerprint } from 'lucide-react';
import CustomModal from '../CustomModal';
import CustomButton from '../CustomButton';
import ClockHistoryList from './ClockHistoryList';

function ClockInHistoryModal({ isOpen, onClose, history, isLoading }) {
    return (
        <CustomModal
            isOpen={isOpen}
            onClose={onClose}
            title="Clock-In History"
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
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-2 text-indigo-500">
                        <Fingerprint size={18} />
                    </div>
                    <p className="text-xs text-slate-400">Your most recent shifts, newest first.</p>
                </div>

                <ClockHistoryList history={history} isLoading={isLoading} />
            </div>
        </CustomModal>
    );
}

ClockInHistoryModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    history: PropTypes.arrayOf(PropTypes.object),
    isLoading: PropTypes.bool,
};

ClockInHistoryModal.defaultProps = {
    history: [],
    isLoading: false,
};

export default ClockInHistoryModal;
