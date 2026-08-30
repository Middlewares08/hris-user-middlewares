import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, Camera, RefreshCw, ScanFace, Upload } from 'lucide-react';
import CustomModal from '../CustomModal';
import CustomButton from '../CustomButton';
import Loading from '../Loading';

const FaceLivenessCheck = lazy(() => import('./FaceLivenessCheck'));

const MAX_DIM = 1024;
const ACCEPTED = /^image\/(jpe?g|png|webp)$/i;

// Auto-capture tuning. When the browser exposes the native FaceDetector we wait for a
// single, well-framed face to hold steady for a few frames; otherwise we just grab a
// frame after a short pause so the flow still needs no button press.
const DETECT_INTERVAL_MS = 300;
const STABLE_HITS = 4; // ~1.2s of good framing before we capture
const AUTO_FALLBACK_MS = 2500; // no FaceDetector -> capture after this pause
const MIN_FACE_RATIO = 0.22; // face-box width relative to the frame
const MAX_FACE_RATIO = 0.95;

function drawToBlob(source, srcW, srcH) {
    const scale = Math.min(1, MAX_DIM / Math.max(srcW, srcH));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(srcW * scale);
    canvas.height = Math.round(srcH * scale);
    canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
}

async function fileToBlob(file) {
    const bitmap = await createImageBitmap(file);
    try {
        return await drawToBlob(bitmap, bitmap.width, bitmap.height);
    } finally {
        bitmap.close?.();
    }
}

/** True when a detected face box is large enough and roughly centred in the frame. */
function faceWellFramed(box, vw, vh) {
    if (!box || !vw || !vh) return false;
    const ratio = box.width / vw;
    if (ratio < MIN_FACE_RATIO || ratio > MAX_FACE_RATIO) return false;
    const cx = (box.x + box.width / 2) / vw;
    const cy = (box.y + box.height / 2) / vh;
    return cx > 0.3 && cx < 0.7 && cy > 0.22 && cy < 0.78;
}

/**
 * Face check for a verified clock-in / clock-out. Mount only while visible.
 *
 * In the camera path the frame is captured automatically — either when the native
 * FaceDetector sees a steady, centred face, or after a short pause as a fallback —
 * and submitted without a shutter press. "Capture now" and Upload stay as manual
 * escape hatches. The image is only ever sent for the 1:1 match and is not stored.
 *
 * @param {{
 *   action: 'in'|'out',
 *   liveness: boolean,          // start with the active liveness challenge
 *   submitting: boolean,
 *   onClose: fn,
 *   onCapture: ({ blob?: Blob, livenessSessionId?: string }) => void
 * }} props
 */
export default function FaceVerifyModal({ action, liveness, submitting, onClose, onCapture }) {
    const [mode, setMode] = useState(liveness ? 'liveness' : 'photo'); // 'liveness' | 'photo'
    const [photoSource, setPhotoSource] = useState('camera'); // 'camera' | 'upload'
    const [stream, setStream] = useState(null);
    const [notice, setNotice] = useState(null);
    const [preview, setPreview] = useState(null); // { url, blob }
    const [scanMsg, setScanMsg] = useState(null); // auto-capture status shown over the video
    const videoRef = useRef(null);

    const capturingRef = useRef(false); // guards against a double capture
    const autoSubmittedRef = useRef(false); // an auto-captured frame is in flight
    const prevSubmittingRef = useRef(false);

    // Keep the latest onCapture without making the auto-capture effect depend on it
    // (the parent re-creates the callback on every render / ticker tick).
    const onCaptureRef = useRef(onCapture);
    useEffect(() => {
        onCaptureRef.current = onCapture;
    }, [onCapture]);

    const stopStream = useCallback(() => {
        setStream((current) => {
            current?.getTracks().forEach((t) => t.stop());
            return null;
        });
    }, []);

    const startCamera = useCallback(async () => {
        await Promise.resolve();
        setNotice(null);
        if (!navigator.mediaDevices?.getUserMedia) {
            setNotice('Camera needs a secure (HTTPS) connection here. Use Upload instead.');
            setPhotoSource('upload');
            return;
        }
        try {
            const s = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
            });
            setStream(s);
        } catch (err) {
            setNotice(
                err?.name === 'NotAllowedError'
                    ? 'Camera permission denied. Allow it and retry, or use Upload.'
                    : 'No camera available. Use the Upload option instead.',
            );
            setPhotoSource('upload');
        }
    }, []);

    // Camera only runs in the photo path.
    useEffect(() => {
        if (mode !== 'photo' || preview) return undefined;
        let active = true;
        const run = async () => {
            if (active) await startCamera();
        };
        run();
        return () => {
            active = false;
            stopStream();
        };
    }, [mode, preview, startCamera, stopStream]);

    useEffect(() => {
        if (stream && videoRef.current) videoRef.current.srcObject = stream;
    }, [stream, preview, photoSource, mode]);

    const runCapture = useCallback(
        async ({ auto }) => {
            if (capturingRef.current) return;
            const video = videoRef.current;
            if (!video?.videoWidth) return;
            capturingRef.current = true;
            const blob = await drawToBlob(video, video.videoWidth, video.videoHeight);
            stopStream();
            setScanMsg(null);
            setPreview({ url: URL.createObjectURL(blob), blob });
            capturingRef.current = false;
            if (auto && blob) {
                autoSubmittedRef.current = true;
                onCaptureRef.current({ blob });
            }
        },
        [stopStream],
    );

    // Auto-capture loop: active only while the live camera is showing (no preview yet).
    useEffect(() => {
        if (mode !== 'photo' || photoSource !== 'camera' || !stream || preview) return undefined;

        let cancelled = false;
        let timer;
        let stable = 0;
        let detector = null;

        if (typeof window !== 'undefined' && 'FaceDetector' in window) {
            try {
                detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 3 });
            } catch {
                detector = null;
            }
        }

        const finish = () => {
            if (!cancelled) runCapture({ auto: true });
        };

        if (!detector) {
            setScanMsg('Capturing automatically — hold still');
            timer = setTimeout(finish, AUTO_FALLBACK_MS);
            return () => {
                cancelled = true;
                clearTimeout(timer);
            };
        }

        setScanMsg('Center your face in the frame');
        const loop = async () => {
            if (cancelled) return;
            const video = videoRef.current;
            if (video?.videoWidth) {
                let faces = [];
                try {
                    faces = await detector.detect(video);
                } catch {
                    // FaceDetector gave up — fall back to a timed grab.
                    detector = null;
                    if (!cancelled) {
                        setScanMsg('Capturing automatically — hold still');
                        timer = setTimeout(finish, 800);
                    }
                    return;
                }
                if (cancelled) return;

                if (faces.length > 1) {
                    stable = 0;
                    setScanMsg('Make sure only you are in the frame');
                } else if (
                    faces.length === 1 &&
                    faceWellFramed(faces[0].boundingBox, video.videoWidth, video.videoHeight)
                ) {
                    stable += 1;
                    setScanMsg(stable >= 2 ? 'Hold still…' : 'Face detected');
                    if (stable >= STABLE_HITS) {
                        finish();
                        return;
                    }
                } else {
                    stable = 0;
                    setScanMsg(faces.length ? 'Move closer and center your face' : 'Looking for your face…');
                }
            }
            timer = setTimeout(loop, DETECT_INTERVAL_MS);
        };
        timer = setTimeout(loop, DETECT_INTERVAL_MS);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [mode, photoSource, stream, preview, runCapture]);

    // Recover from a rejected auto-capture: a successful punch unmounts this modal, so
    // if `submitting` falls back to false while we're still here, the match failed —
    // drop the frame and let the camera + auto-capture loop start over.
    useEffect(() => {
        if (prevSubmittingRef.current && !submitting && autoSubmittedRef.current && preview) {
            autoSubmittedRef.current = false;
            const t = setTimeout(() => {
                setPreview((p) => {
                    if (p?.url) URL.revokeObjectURL(p.url);
                    return null;
                });
                setNotice('Face not recognized clearly — trying again.');
            }, 600);
            prevSubmittingRef.current = submitting;
            return () => clearTimeout(t);
        }
        prevSubmittingRef.current = submitting;
        return undefined;
    }, [submitting, preview]);

    const onPickFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (!ACCEPTED.test(file.type)) {
            setNotice('Please choose a JPEG, PNG or WebP image.');
            return;
        }
        setNotice(null);
        const blob = await fileToBlob(file);
        setPreview({ url: URL.createObjectURL(blob), blob });
    };

    const retake = () => {
        autoSubmittedRef.current = false;
        setPreview((p) => {
            if (p?.url) URL.revokeObjectURL(p.url);
            return null;
        });
        if (photoSource === 'camera') startCamera();
    };

    const switchPhotoSource = (next) => {
        if (next === photoSource) return;
        setNotice(null);
        setScanMsg(null);
        if (next === 'upload') stopStream();
        setPhotoSource(next);
        if (next === 'camera' && !preview) startCamera();
    };

    const fallbackToPhoto = (message) => {
        stopStream();
        setNotice(message || 'Liveness check unavailable — take a photo instead.');
        setMode('photo');
    };

    const verb = action === 'out' ? 'Clock Out' : 'Clock In';

    const footer =
        mode === 'photo' ? (
            <>
                <CustomButton
                    size="sm"
                    onClick={onClose}
                    className="w-auto! px-4 bg-white! text-slate-600! border border-slate-200 hover:bg-slate-50!"
                >
                    Cancel
                </CustomButton>
                <CustomButton
                    size="sm"
                    onClick={() => {
                        if (!preview?.blob) return;
                        autoSubmittedRef.current = false;
                        onCapture({ blob: preview.blob });
                    }}
                    disabled={!preview}
                    isLoading={submitting}
                    icon={ScanFace}
                    iconPosition="left"
                    className="w-auto! px-5"
                >
                    {verb}
                </CustomButton>
            </>
        ) : (
            <CustomButton
                size="sm"
                onClick={onClose}
                className="w-auto! px-4 bg-white! text-slate-600! border border-slate-200 hover:bg-slate-50!"
            >
                Cancel
            </CustomButton>
        );

    return (
        <CustomModal
            isOpen
            onClose={onClose}
            title={`Face check — ${verb}`}
            size={mode === 'liveness' ? 'md' : 'sm'}
            showCloseButton
            footer={footer}
        >
            <div className="space-y-4">
                {notice && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                        <span>{notice}</span>
                    </div>
                )}

                {mode === 'liveness' ? (
                    <>
                        {submitting ? (
                            <div className="flex h-64 items-center justify-center">
                                <Loading />
                            </div>
                        ) : (
                            <Suspense
                                fallback={
                                    <div className="flex h-64 items-center justify-center">
                                        <Loading />
                                    </div>
                                }
                            >
                                <FaceLivenessCheck
                                    onComplete={(sessionId) => onCapture({ livenessSessionId: sessionId })}
                                    onError={() => fallbackToPhoto('Liveness check could not run — take a photo instead.')}
                                    onCancel={onClose}
                                />
                            </Suspense>
                        )}
                        <button
                            type="button"
                            onClick={() => fallbackToPhoto('Take a clear, front-facing photo.')}
                            className="text-xs text-slate-400 underline hover:text-slate-600"
                        >
                            Having trouble? Use a photo instead
                        </button>
                    </>
                ) : (
                    <>
                        {!preview && (
                            <div className="flex gap-2">
                                {[
                                    { key: 'camera', label: 'Camera', Icon: Camera },
                                    { key: 'upload', label: 'Upload', Icon: Upload },
                                ].map(({ key, label, Icon }) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => switchPhotoSource(key)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                            photoSource === key
                                                ? 'bg-slate-900 text-white border-slate-900'
                                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <Icon size={16} /> {label}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="relative aspect-4/3 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
                            {preview ? (
                                <>
                                    <img src={preview.url} alt="Face preview" className="w-full h-full object-cover" />
                                    {submitting && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-[1px]">
                                            <Loading />
                                        </div>
                                    )}
                                </>
                            ) : photoSource === 'camera' ? (
                                <>
                                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                    <div className="pointer-events-none absolute inset-0 flex items-end justify-center p-3">
                                        <span className="rounded-full bg-slate-900/60 px-3 py-1 text-[11px] font-medium text-white">
                                            {scanMsg || 'Starting camera…'}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <label className="flex flex-col items-center gap-2 text-slate-300 cursor-pointer text-sm p-6 text-center">
                                    <Upload size={28} />
                                    <span>Choose a photo of your face</span>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="hidden"
                                        onChange={onPickFile}
                                    />
                                </label>
                            )}
                        </div>

                        <div className="flex justify-center">
                            {preview ? (
                                <CustomButton
                                    size="sm"
                                    onClick={retake}
                                    icon={RefreshCw}
                                    iconPosition="left"
                                    className="w-auto! px-4 bg-white! text-slate-600! border border-slate-200 hover:bg-slate-50!"
                                >
                                    Retake
                                </CustomButton>
                            ) : photoSource === 'camera' && stream ? (
                                <CustomButton
                                    size="sm"
                                    onClick={() => runCapture({ auto: false })}
                                    icon={Camera}
                                    iconPosition="left"
                                    className="w-auto! px-6 bg-white! text-slate-600! border border-slate-200 hover:bg-slate-50!"
                                >
                                    Capture now
                                </CustomButton>
                            ) : null}
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed">
                            Look straight at the camera in good light — it captures on its own once your
                            face is steady. Your photo is matched against the face HR enrolled for you,
                            then discarded.
                        </p>
                    </>
                )}
            </div>
        </CustomModal>
    );
}

FaceVerifyModal.propTypes = {
    action: PropTypes.oneOf(['in', 'out']),
    liveness: PropTypes.bool,
    submitting: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    onCapture: PropTypes.func.isRequired,
};
