import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'sonner';
import CustomModal from '../CustomModal';
import CustomButton from '../CustomButton';
import CustomInput from '../CustomInput';
import { CustomFileUploader } from '../CustomFileUploader';
import { buildDocumentForm, MAX_DOC_BYTES } from '../../services/documentServices';
import { useUploadDocument, useUpdateDocument } from '../../hooks/useDocuments';

/**
 * Upload a new document, replace an existing one (`document`), or fulfil an HR
 * request (`request`, which pre-fills and locks the label).
 */
function DocumentUploadModal({ isOpen, onClose, document = null, request = null }) {
    const isEdit = Boolean(document);
    const upload = useUploadDocument();
    const update = useUpdateDocument();

    const [label, setLabel] = useState('');
    const [file, setFile] = useState(null);

    useEffect(() => {
        if (!isOpen) return;
        setLabel(request?.label || document?.label || '');
        setFile(null);
    }, [isOpen, request, document]);

    const busy = upload.isPending || update.isPending;

    const handleClose = () => {
        if (busy) return;
        onClose();
    };

    const handleSubmit = async () => {
        if (!label.trim()) return toast.error('Give the document a name.');
        if (!isEdit && !file?.file) return toast.error('Choose a file to upload.');
        if (file?.file && file.file.size > MAX_DOC_BYTES) {
            return toast.error('File is larger than 4MB.');
        }

        const formData = buildDocumentForm({
            label: label.trim(),
            file: file?.file,
            documentRequestId: isEdit ? undefined : request?.id,
        });

        try {
            if (isEdit) {
                await update.mutateAsync({ id: document.id, formData });
            } else {
                await upload.mutateAsync(formData);
            }
            onClose();
        } catch { /* toast handled in hook */ }
    };

    return (
        <CustomModal
            isOpen={isOpen}
            onClose={handleClose}
            title={isEdit ? 'Replace document' : request ? `Submit: ${request.label}` : 'Upload document'}
            size="md"
            showCloseButton
            hasRequiredFields
            footer={
                <>
                    <CustomButton variant="outline" size="sm" onClick={handleClose} disabled={busy}>
                        Cancel
                    </CustomButton>
                    <CustomButton variant="primary" size="sm" onClick={handleSubmit} isLoading={busy}>
                        {isEdit ? 'Save' : 'Submit'}
                    </CustomButton>
                </>
            }
        >
            <div className="flex flex-col gap-4 text-left">
                <CustomInput
                    label="Document name"
                    isRequired
                    value={label}
                    disabled={Boolean(request)}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. NBI Clearance"
                />
                <CustomFileUploader
                    label={isEdit ? 'New file' : 'File'}
                    isRequired={!isEdit}
                    value={file}
                    onChange={setFile}
                    description="Image or PDF up to 4MB"
                />
                {request?.note && (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">{request.note}</p>
                )}
                {isEdit && !file && (
                    <p className="text-[11px] text-slate-400">Leave the file empty to only rename the document.</p>
                )}
            </div>
        </CustomModal>
    );
}

DocumentUploadModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    document: PropTypes.object,
    request: PropTypes.object,
};

export default DocumentUploadModal;
