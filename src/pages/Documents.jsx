// src/pages/Documents.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { ArrowLeft, FileText, Plus, ClipboardList, Upload, Send, Eye } from 'lucide-react';
import CustomEmptyPlaceholder from '../components/CustomEmptyPlaceholder';
import CustomModal from '../components/CustomModal';
import CustomButton from '../components/CustomButton';
import Loading from '../components/Loading';
import DocumentUploadModal from '../components/document/DocumentUploadModal';
import RequestDocumentModal from '../components/document/RequestDocumentModal';
import DocumentListItem from '../components/document/DocumentListItem';
import DocumentPreviewModal from '../components/document/DocumentPreviewModal';
import { useMyDocuments, useMyDocumentRequests, useDeleteDocument, useCancelDocumentRequest } from '../hooks/useDocuments';
import { DOCUMENT_REQUEST_STATUS_TONE } from '../utils/constants';

const fmtDate = (v) => (v ? moment(v).format('MMM D, YYYY') : '—');

function Documents() {
    const navigate = useNavigate();
    const { data: documents = [], isLoading: docsLoading } = useMyDocuments();
    const { data: requests = [], isLoading: reqLoading } = useMyDocumentRequests();
    const deleteDocument = useDeleteDocument();
    const cancelRequest = useCancelDocumentRequest();

    const [uploadFor, setUploadFor] = useState(null); // { request } | { document } | {} | null
    const [toDelete, setToDelete] = useState(null);
    const [toWithdraw, setToWithdraw] = useState(null);
    const [requestOpen, setRequestOpen] = useState(false);
    const [previewDoc, setPreviewDoc] = useState(null);

    // `source === 'employee'` → the employee asked HR; otherwise HR asked the employee.
    const hrRequests = requests.filter((r) => r.source !== 'employee');
    const myRequests = requests.filter((r) => r.source === 'employee');
    const pending = hrRequests.filter((r) => r.status === 'pending');
    const pendingMine = myRequests.filter((r) => r.status === 'pending');

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-4xl text-left">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="mb-5 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 cursor-pointer"
                >
                    <ArrowLeft size={16} />
                    Back
                </button>

                <div className="mb-6 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                            <FileText size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-semibold text-slate-900">My Documents</p>
                            <p className="text-sm text-slate-500">Upload and manage your employment documents.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <CustomButton variant="outline" size="sm" onClick={() => setRequestOpen(true)}>
                            <span className="flex items-center gap-1.5"><Send size={14} /> Request from HR</span>
                        </CustomButton>
                        <CustomButton variant="primary" size="sm" onClick={() => setUploadFor({})}>
                            <span className="flex items-center gap-1.5"><Plus size={15} /> Upload</span>
                        </CustomButton>
                    </div>
                </div>

                {/* My requests to HR */}
                {reqLoading ? null : myRequests.length > 0 && (
                    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center gap-2">
                            <Send size={16} className="text-indigo-600" />
                            <p className="text-sm font-semibold text-slate-900">My Requests to HR</p>
                            {pendingMine.length > 0 && (
                                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-700">
                                    {pendingMine.length} pending
                                </span>
                            )}
                        </div>
                        <div className="space-y-2">
                            {myRequests.map((r) => {
                                const isPending = r.status === 'pending';
                                return (
                                    <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="truncate text-sm font-medium text-slate-800">{r.label}</p>
                                                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${DOCUMENT_REQUEST_STATUS_TONE[r.status] || 'bg-slate-100 text-slate-500'}`}>
                                                    {r.status}
                                                </span>
                                            </div>
                                            {r.note && <p className="mt-0.5 text-xs text-slate-500">{r.note}</p>}
                                            {r.status === 'declined' && r.review_remarks && (
                                                <p className="mt-0.5 text-xs text-rose-500">Declined: {r.review_remarks}</p>
                                            )}
                                            <p className="mt-1 text-[11px] text-slate-400">
                                                {isPending
                                                    ? `Requested ${fmtDate(r.created_at)}`
                                                    : `${r.status === 'fulfilled' ? 'Delivered' : 'Updated'} ${fmtDate(r.reviewed_at || r.fulfilled_at || r.updated_at)}`}
                                            </p>
                                        </div>
                                        {isPending && (
                                            <CustomButton variant="outline" size="sm" onClick={() => setToWithdraw(r)}>
                                                Withdraw
                                            </CustomButton>
                                        )}
                                        {r.status === 'fulfilled' && r.fulfilledDocument?.file_url && (
                                            <button
                                                type="button"
                                                onClick={() => setPreviewDoc(r.fulfilledDocument)}
                                                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 cursor-pointer"
                                            >
                                                <Eye size={13} /> View
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Requests from HR */}
                {reqLoading ? null : hrRequests.length > 0 && (
                    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center gap-2">
                            <ClipboardList size={16} className="text-amber-600" />
                            <p className="text-sm font-semibold text-slate-900">Requests from HR</p>
                            {pending.length > 0 && (
                                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-700">
                                    {pending.length} pending
                                </span>
                            )}
                        </div>
                        <div className="space-y-2">
                            {hrRequests.map((r) => {
                                const isPending = r.status === 'pending';
                                return (
                                    <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="truncate text-sm font-medium text-slate-800">{r.label}</p>
                                                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${DOCUMENT_REQUEST_STATUS_TONE[r.status] || 'bg-slate-100 text-slate-500'}`}>
                                                    {r.status}
                                                </span>
                                            </div>
                                            {r.note && <p className="mt-0.5 text-xs text-slate-500">{r.note}</p>}
                                            <p className="mt-1 text-[11px] text-slate-400">
                                                {isPending
                                                    ? (r.due_date ? `Due ${fmtDate(r.due_date)}` : `Requested ${fmtDate(r.created_at)}`)
                                                    : `Submitted ${fmtDate(r.fulfilled_at || r.updated_at)}`}
                                            </p>
                                        </div>
                                        {isPending && (
                                            <CustomButton variant="primary" size="sm" onClick={() => setUploadFor({ request: r })}>
                                                <span className="flex items-center gap-1.5"><Upload size={14} /> Submit</span>
                                            </CustomButton>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Document list */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    {docsLoading ? (
                        <Loading size="sm" text="Loading documents" />
                    ) : documents.length === 0 ? (
                        <CustomEmptyPlaceholder
                            icon={FileText}
                            title="No documents yet"
                            description="Upload your documents or respond to a request from HR."
                            hasButton={false}
                        />
                    ) : (
                        <div className="space-y-2.5">
                            {documents.map((d) => (
                                <DocumentListItem
                                    key={d.id}
                                    document={d}
                                    onReplace={(doc) => setUploadFor({ document: doc })}
                                    onDelete={(doc) => setToDelete(doc)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <DocumentUploadModal
                isOpen={Boolean(uploadFor)}
                onClose={() => setUploadFor(null)}
                request={uploadFor?.request || null}
                document={uploadFor?.document || null}
            />

            <RequestDocumentModal isOpen={requestOpen} onClose={() => setRequestOpen(false)} />

            {previewDoc && (
                <DocumentPreviewModal document={previewDoc} onClose={() => setPreviewDoc(null)} />
            )}

            <CustomModal
                isOpen={Boolean(toWithdraw)}
                onClose={() => setToWithdraw(null)}
                title="Withdraw request?"
                size="sm"
                showCloseButton
                footer={
                    <>
                        <CustomButton variant="outline" size="sm" onClick={() => setToWithdraw(null)} disabled={cancelRequest.isPending}>
                            Keep
                        </CustomButton>
                        <CustomButton
                            variant="primary"
                            size="sm"
                            isLoading={cancelRequest.isPending}
                            onClick={async () => {
                                try {
                                    await cancelRequest.mutateAsync(toWithdraw.id);
                                    setToWithdraw(null);
                                } catch { /* handled */ }
                            }}
                        >
                            Withdraw
                        </CustomButton>
                    </>
                }
            >
                <p className="text-sm text-slate-600">
                    Your request for <span className="font-semibold text-slate-800">{toWithdraw?.label}</span> will be withdrawn.
                </p>
            </CustomModal>

            <CustomModal
                isOpen={Boolean(toDelete)}
                onClose={() => setToDelete(null)}
                title="Delete document?"
                size="sm"
                showCloseButton
                footer={
                    <>
                        <CustomButton variant="outline" size="sm" onClick={() => setToDelete(null)} disabled={deleteDocument.isPending}>
                            Cancel
                        </CustomButton>
                        <CustomButton
                            variant="primary"
                            size="sm"
                            isLoading={deleteDocument.isPending}
                            onClick={async () => {
                                try {
                                    await deleteDocument.mutateAsync(toDelete.id);
                                    setToDelete(null);
                                } catch { /* handled */ }
                            }}
                        >
                            Delete
                        </CustomButton>
                    </>
                }
            >
                <p className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">{toDelete?.label}</span> will be removed
                    {toDelete?.request ? ', and the related HR request will reopen.' : '.'}
                </p>
            </CustomModal>
        </div>
    );
}

export default Documents;
