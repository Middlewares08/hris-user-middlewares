import PropTypes from 'prop-types';
import moment from 'moment';
import { Megaphone, AlertTriangle, Zap, ExternalLink } from 'lucide-react';
import CustomModal from '../CustomModal';
import CustomButton from '../CustomButton';
import { ANNOUNCEMENT_PRIORITY } from '../../utils/constants';

const ICONS = { Megaphone, AlertTriangle, Zap };

function AnnouncementModal({ isOpen, onClose, announcement }) {
    if (!announcement) return null;

    const tone = ANNOUNCEMENT_PRIORITY[announcement.priority] || ANNOUNCEMENT_PRIORITY.info;
    const Icon = ICONS[tone.icon] || Megaphone;
    const when = announcement.published_at || announcement.created_at;

    return (
        <CustomModal
            isOpen={isOpen}
            onClose={onClose}
            title="Announcement"
            size="md"
            showCloseButton
            footer={
                <CustomButton variant="outline" size="sm" onClick={onClose}>
                    Close
                </CustomButton>
            }
        >
            <div className="flex flex-col gap-4 text-left scrollbar-y-visible overflow-y-auto max-h-[60vh]">
                <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone.iconWrap}`}>
                        <Icon size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold leading-snug text-slate-900">
                            {announcement.title}
                        </h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone.badge}`}>
                                {tone.label}
                            </span>
                            {announcement.is_pinned && (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                                    Pinned
                                </span>
                            )}
                            {when && (
                                <span className="text-xs text-slate-400">
                                    {moment(when).format('MMM D, YYYY · h:mm A')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
                    {announcement.body}
                </p>

                {announcement.link_url && (
                    <a
                        href={announcement.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-100"
                    >
                        <ExternalLink size={13} />
                        Open link
                    </a>
                )}

                {announcement.creator && (
                    <p className="text-[11px] text-slate-400">
                        Posted by {announcement.creator.first_name} {announcement.creator.last_name}
                    </p>
                )}
            </div>
        </CustomModal>
    );
}

AnnouncementModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    announcement: PropTypes.object,
};

export default AnnouncementModal;
