// src/components/InstallBanner.jsx
import React from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function InstallBanner() {
    const { isInstallable, installApp } = usePWAInstall();

    // Do not render anything if the app isn't installable or is already installed
    if (!isInstallable) return null;

    return (
        <div style={styles.banner}>
            <div>
                <p style={styles.title}>Install HRIS App</p>
                <p style={styles.subtitle}>Install on your home screen for fast access and offline support.</p>
            </div>
            <button onClick={installApp} style={styles.button}>
                Install
            </button>
        </div>
    );
}

const styles = {
    banner: {
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        right: '20px',
        maxWidth: '450px',
        margin: '0 auto',
        backgroundColor: '#1e293b',
        color: '#ffffff',
        padding: '16px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
        zIndex: 9999,
    },
    title: {
        margin: 0,
        fontWeight: '600',
        fontSize: '14px',
    },
    subtitle: {
        margin: '4px 0 0 0',
        fontSize: '12px',
        color: '#94a3b8',
    },
    button: {
        backgroundColor: '#2563eb',
        color: '#ffffff',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '8px',
        fontWeight: '600',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
    },
};