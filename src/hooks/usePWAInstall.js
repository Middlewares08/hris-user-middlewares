import { useState, useEffect } from 'react';

export function usePWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            // 1. Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            
            // 2. Stash the event so it can be triggered later
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        const handleAppInstalled = () => {
            // Clear prompt and hide button when app is successfully installed
            setDeferredPrompt(null);
            setIsInstallable(false);
            console.log('PWA was installed successfully');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const installApp = async () => {
        if (!deferredPrompt) return;

        // Show the native browser install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We no longer need the prompt, clear it out
        setDeferredPrompt(null);
        setIsInstallable(false);
    };

    return { isInstallable, installApp };
}