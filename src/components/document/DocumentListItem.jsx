import { useState } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { FileText, Image as ImageIcon, Download, RefreshCw, Trash2 } from 'lucide-react';
import DocumentPreviewModal from './DocumentPreviewModal';

const fmtDate = (v) => (v ? moment(v).format('MMM D, YYYY') : '—');
const fmtSize = (b) => (b ? `${(Number(b) / 1024 / 1024).toFixed(2)} MB` : '');

/**
 * A single row in the employee's document library: click the name to preview
 * the file in a modal, or use the trailing actions to download, replace/rename,
 * or delete.
 */
function DocumentListItem({ document: d, onReplace, onDelete }) {
    const [previewing, setPreviewing] = useState(false);
    const href = d.file_url || d.file_link;

    return (
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3" onClick={() => setPreviewing(true)}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:cursor-pointer" onClick={() => setPreviewing(true)}>
                {d.type === 'image' ? <ImageIcon size={17} /> : <FileText size={17} />}
            </div>
            <button
                type="button"
                onClick={() => setPreviewing(true)}
                className="min-w-0 flex-1 text-left group cursor-pointer"
                title="View file"
            >
                <p className="truncate text-sm font-medium text-slate-800 group-hover:text-indigo-600 group-hover:underline">{d.label}</p>
                <p className="text-[11px] text-slate-400">
                    {fmtDate(d.created_at)}{fmtSize(d.size_bytes) && ` · ${fmtSize(d.size_bytes)}`}
                    {d.request ? ' · from an HR request' : ''}
                </p>
            </button>
            <a
                href={href}
                target="_blank"
                rel="noreferrer"
                download={d.file_name || d.label}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white hover:text-slate-700 cursor-pointer"
                title="Download"
            >
                <Download size={16} />
            </a>
            <button
                type="button"
                onClick={() => onReplace(d)}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white hover:text-indigo-600 cursor-pointer"
                title="Replace / rename"
            >
                <RefreshCw size={15} />
            </button>
            <button
                type="button"
                onClick={() => onDelete(d)}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white hover:text-rose-600 cursor-pointer"
                title="Delete"
            >
                <Trash2 size={15} />
            </button>

            {previewing && <DocumentPreviewModal document={d} onClose={() => setPreviewing(false)} />}
        </div>
    );
}

DocumentListItem.propTypes = {
    document: PropTypes.object.isRequired,
    onReplace: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
};

export default DocumentListItem;
