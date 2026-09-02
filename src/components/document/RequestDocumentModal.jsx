import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'sonner';
import CustomModal from '../CustomModal';
import CustomButton from '../CustomButton';
import CustomInput from '../CustomInput';
import { useCreateDocumentRequest } from '../../hooks/useDocuments';

// A few common asks, offered as quick-fill chips.
const COMMON_DOCS = [
    'Certificate of Employment',
    'Certificate of Contributions',
    'Income Tax Return (BIR 2316)',
    'Payslip History',
];

/** Employee asks HR to provide a document. */
function RequestDocumentModal({ isOpen, onClose }) {
    const createRequest = useCreateDocumentRequest();
    const [label, setLabel] = useState('');
    const [note, setNote] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        setLabel('');
        setNote('');
    }, [isOpen]);

    const busy = createRequest.isPending;

    const handleClose = () => {
        if (busy) return;
        onClose();
    };

    const handleSubmit = async () => {
        if (!label.trim()) return toast.error('Tell HR which document you need.');
        try {
            await createRequest.mutateAsync({ label: label.trim(), note: note.trim() || undefined });
            onClose();
        } catch { /* toast handled in hook */ }
    };

    return (
        <CustomModal
            isOpen={isOpen}
            onClose={handleClose}
            title="Request a document from HR"
            size="md"
            showCloseButton
            hasRequiredFields
            footer={
                <>
                    <CustomButton variant="outline" size="sm" onClick={handleClose} disabled={busy}>
                        Cancel
                    </CustomButton>
                    <CustomButton variant="primary" size="sm" onClick={handleSubmit} isLoading={busy}>
                        Send request
                    </CustomButton>
                </>
            }
        >
            <div className="flex flex-col gap-4 text-left">
                <div>
                    <CustomInput
                        label="Document"
                        isRequired
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="e.g. Certificate of Employment"
                    />
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {COMMON_DOCS.map((doc) => (
                            <button
                                key={doc}
                                type="button"
                                onClick={() => setLabel(doc)}
                                className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-100 cursor-pointer"
                            >
                                {doc}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">Note</label>
                    <textarea
                        rows={3}
                        value={note}
                        maxLength={500}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Purpose, number of copies, deadline… (optional)"
                        className="w-full resize-none rounded-lg border border-gray-300 p-2 text-sm focus:outline-gray-600"
                    />
                </div>
            </div>
        </CustomModal>
    );
}

RequestDocumentModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default RequestDocumentModal;
