import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness';
import '@aws-amplify/ui-react/styles.css';
import Loading from '../Loading';
import { faceLivenessService } from '../../services/faceLivenessServices';

/**
 * Runs one AWS Rekognition Face Liveness challenge.
 *  - fetches a session (id + region + short-lived creds) from our backend
 *  - hands them to Amplify's <FaceLivenessDetector>, which streams to AWS directly
 *  - on completion, calls onComplete(sessionId); the caller verifies server-side
 *  - any setup/stream failure calls onError so the modal can fall back to a photo
 *
 * Lazy-import this component so the Amplify bundle only loads when a check starts.
 */
export default function FaceLivenessCheck({ onComplete, onError, onCancel }) {
    const [session, setSession] = useState(null);
    const doneRef = useRef(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await faceLivenessService.createSession();
                if (cancelled) return;
                if (res?.success) setSession(res.data);
                else onError?.(new Error(res?.message || 'Could not start the liveness check.'));
            } catch (err) {
                if (!cancelled) {
                    onError?.(new Error(err?.response?.data?.message || 'Could not start the liveness check.'));
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [onError]);

    const credentialProvider = useMemo(() => {
        const c = session?.credentials;
        if (!c) return undefined;
        return async () => ({
            accessKeyId: c.accessKeyId,
            secretAccessKey: c.secretAccessKey,
            sessionToken: c.sessionToken,
            expiration: c.expiration ? new Date(c.expiration) : undefined,
        });
    }, [session]);

    if (!session) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loading />
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl">
            <FaceLivenessDetector
                sessionId={session.sessionId}
                region={session.region}
                config={{ credentialProvider }}
                disableStartScreen={false}
                onAnalysisComplete={async () => {
                    if (doneRef.current) return;
                    doneRef.current = true;
                    await onComplete(session.sessionId);
                }}
                onError={(err) => onError?.(err)}
                onUserCancel={() => onCancel?.()}
            />
        </div>
    );
}

FaceLivenessCheck.propTypes = {
    onComplete: PropTypes.func.isRequired,
    onError: PropTypes.func,
    onCancel: PropTypes.func,
};
