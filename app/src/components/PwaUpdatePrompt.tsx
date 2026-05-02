import React, {memo, useCallback, useState} from 'react';
import {AnimatePresence, m} from 'framer-motion';
import {CheckCircle2, RefreshCw, Sparkles, X} from 'lucide-react';
import {useRegisterSW} from 'virtual:pwa-register/react';

// Periodically poll the SW registration so users get notified about new
// versions even without a navigation. 60 min matches the hourly sync cron.
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Custom PWA update + install-ready prompt. Replaces the default browser
 * behaviour with a neobrutalist toast that lives bottom-right (above the
 * scroll-to-top button).
 *
 * vite-plugin-pwa is configured with `registerType: 'prompt'`, so the new
 * service worker stays in "waiting" until the user explicitly clicks
 * Recargar — that triggers `skipWaiting` + a page reload via
 * updateServiceWorker(true).
 */
const PwaUpdatePrompt: React.FC = () => {
    const [reloading, setReloading] = useState(false);

    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegisteredSW(_swUrl, registration) {
            if (!registration) return;
            // Periodic check for updates while the tab is open
            window.setInterval(() => {
                registration.update().catch(() => {/* network may be down */});
            }, UPDATE_CHECK_INTERVAL_MS);

            // Also check when the user comes back to the tab — fast feedback
            const onFocus = () => {
                registration.update().catch(() => {/* silent */});
            };
            window.addEventListener('focus', onFocus);
        },
        onRegisterError(error) {
            console.error('SW registration failed:', error);
        },
    });

    const handleReload = useCallback(async () => {
        setReloading(true);
        try {
            await updateServiceWorker(true);
        } catch (e) {
            console.error('SW update failed:', e);
            setReloading(false);
        }
    }, [updateServiceWorker]);

    const dismissOfflineReady = useCallback(() => setOfflineReady(false), [setOfflineReady]);
    const dismissNeedRefresh = useCallback(() => setNeedRefresh(false), [setNeedRefresh]);

    const showUpdate = needRefresh;
    const showOfflineReady = offlineReady && !needRefresh;

    return (
        <AnimatePresence>
            {showUpdate && (
                <m.div
                    key="update"
                    initial={{opacity: 0, y: 30, x: 20, scale: 0.92}}
                    animate={{opacity: 1, y: 0, x: 0, scale: 1}}
                    exit={{opacity: 0, y: 20, scale: 0.95}}
                    transition={{type: 'spring', stiffness: 280, damping: 22}}
                    className="fixed bottom-24 right-4 md:right-8 z-[150] w-[calc(100vw-2rem)] max-w-sm bg-white text-black border-4 border-black shadow-[8px_8px_0px_0px_black] overflow-hidden"
                    role="alertdialog"
                    aria-labelledby="pwa-update-title"
                    aria-describedby="pwa-update-desc"
                >
                    {/* Animated diagonal stripe header */}
                    <div className="bg-orange-400 border-b-4 border-black px-4 py-2 relative overflow-hidden flex items-center gap-2">
                        <m.div
                            className="absolute inset-0 pointer-events-none opacity-20"
                            style={{
                                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, #000 8px, #000 10px)',
                            }}
                            animate={{backgroundPositionX: ['0px', '18px']}}
                            transition={{duration: 1.4, repeat: Infinity, ease: 'linear'}}
                        />
                        <m.span
                            className="relative inline-block"
                            animate={{rotate: reloading ? 360 : [0, -12, 12, -8, 8, 0]}}
                            transition={reloading
                                ? {duration: 0.8, repeat: Infinity, ease: 'linear'}
                                : {duration: 1.6, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.6}
                            }
                        >
                            <Sparkles size={18} strokeWidth={3}/>
                        </m.span>
                        <span id="pwa-update-title" className="relative font-black text-[11px] tracking-widest uppercase flex-1">
                            Nueva versión disponible
                        </span>
                        <button
                            onClick={dismissNeedRefresh}
                            disabled={reloading}
                            className="relative cursor-pointer bg-white border-2 border-black p-1 hover:rotate-12 transition-transform disabled:opacity-50"
                            aria-label="Cerrar"
                        >
                            <X size={12} strokeWidth={3}/>
                        </button>
                    </div>

                    <div className="p-4 space-y-3">
                        <p id="pwa-update-desc" className="text-[12px] font-mono leading-snug">
                            Hay datos más recientes del SEN listos para descargar. Recarga para ver los últimos cambios.
                        </p>

                        <div className="flex items-stretch gap-2">
                            <m.button
                                onClick={handleReload}
                                disabled={reloading}
                                whileTap={!reloading ? {scale: 0.97} : undefined}
                                className={`flex-1 relative overflow-hidden border-2 border-black px-3 py-2 text-[11px] font-black uppercase tracking-widest shadow-[3px_3px_0px_0px_black] transition-all flex items-center justify-center gap-2
                                    ${reloading ? 'bg-yellow-300 cursor-wait' : 'bg-black text-white cursor-pointer hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px]'}`}
                            >
                                {reloading && (
                                    <m.div
                                        className="absolute inset-y-0 w-1/3 bg-yellow-400/70 pointer-events-none"
                                        animate={{x: ['-110%', '350%']}}
                                        transition={{duration: 1.2, repeat: Infinity, ease: 'easeInOut'}}
                                    />
                                )}
                                <m.span
                                    animate={reloading ? {rotate: 360} : {rotate: 0}}
                                    transition={reloading ? {duration: 0.7, repeat: Infinity, ease: 'linear'} : {duration: 0}}
                                    className="relative inline-block"
                                >
                                    <RefreshCw size={12} strokeWidth={3}/>
                                </m.span>
                                <span className="relative">{reloading ? 'Recargando…' : 'Recargar'}</span>
                            </m.button>

                            <button
                                onClick={dismissNeedRefresh}
                                disabled={reloading}
                                className="bg-white border-2 border-black px-3 py-2 text-[11px] font-black uppercase tracking-widest cursor-pointer hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                                Después
                            </button>
                        </div>
                    </div>
                </m.div>
            )}

            {showOfflineReady && (
                <m.div
                    key="offline"
                    initial={{opacity: 0, y: 30, x: 20, scale: 0.92}}
                    animate={{opacity: 1, y: 0, x: 0, scale: 1}}
                    exit={{opacity: 0, y: 20, scale: 0.95}}
                    transition={{type: 'spring', stiffness: 280, damping: 22}}
                    className="fixed bottom-24 right-4 md:right-8 z-[150] w-[calc(100vw-2rem)] max-w-sm bg-white text-black border-4 border-black shadow-[6px_6px_0px_0px_black] overflow-hidden"
                    role="status"
                >
                    <div className="bg-emerald-400 border-b-4 border-black px-4 py-2 flex items-center gap-2">
                        <m.span
                            initial={{scale: 0, rotate: -90}}
                            animate={{scale: 1, rotate: 0}}
                            transition={{type: 'spring', stiffness: 320, damping: 14}}
                            className="inline-block"
                        >
                            <CheckCircle2 size={18} strokeWidth={3}/>
                        </m.span>
                        <span className="font-black text-[11px] tracking-widest uppercase flex-1">
                            Listo para usar offline
                        </span>
                        <button
                            onClick={dismissOfflineReady}
                            className="bg-white border-2 border-black p-1 hover:rotate-12 transition-transform cursor-pointer"
                            aria-label="Cerrar"
                        >
                            <X size={12} strokeWidth={3}/>
                        </button>
                    </div>
                    <div className="p-3">
                        <p className="text-[11px] font-mono opacity-80 leading-snug">
                            La app quedó cacheada en tu dispositivo. Puedes seguir viéndola sin conexión.
                        </p>
                    </div>
                </m.div>
            )}
        </AnimatePresence>
    );
};

export default memo(PwaUpdatePrompt);
