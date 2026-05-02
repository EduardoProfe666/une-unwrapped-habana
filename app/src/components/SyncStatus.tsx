import React, {memo, useEffect, useState} from 'react';
import {AnimatePresence, m} from 'framer-motion';

interface Props {
    syncDate: string;
}

const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * SYNC_OK indicator — top-right corner. Shows when the last sync ran and
 * a live countdown to the next one (sync workflow runs hourly via GitHub
 * Actions). Includes a real progress bar that fills over the hourly cycle.
 *
 * Extracted to its own memo'd component so the 1Hz tick doesn't re-render
 * the whole App tree.
 */
const SyncStatus: React.FC<Props> = ({syncDate}) => {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    const lastSyncMs = new Date(syncDate).getTime();
    const nextSyncMs = lastSyncMs + ONE_HOUR_MS;
    const elapsedMs = Math.max(0, now - lastSyncMs);
    const progress = Math.min(1, elapsedMs / ONE_HOUR_MS);
    const remainingMs = Math.max(0, nextSyncMs - now);
    const isOverdue = remainingMs <= 0;
    const remainingMin = Math.floor(remainingMs / 60000);
    const remainingSec = Math.floor((remainingMs % 60000) / 1000);

    // Color states across the cycle
    const isWarning = progress >= 0.85 && !isOverdue;
    const dotBg     = isOverdue ? 'bg-red-500'   : isWarning ? 'bg-yellow-300' : 'bg-green-400';
    const accentBg  = isOverdue ? 'bg-red-500'   : isWarning ? 'bg-yellow-300' : 'bg-green-400';
    const accentTxt = isOverdue ? 'text-red-400' : isWarning ? 'text-yellow-300' : 'text-green-400';
    const statusLabel = isOverdue ? 'SYNC_DUE' : 'SYNC_OK';

    const lastSyncStr = new Date(lastSyncMs).toLocaleString('es-CU');
    const nextSyncStr = new Date(nextSyncMs).toLocaleTimeString('es-CU', {hour: '2-digit', minute: '2-digit'});

    return (
        <m.div
            initial={{opacity: 0, y: -10, x: 10}}
            animate={{opacity: 0.55, y: 0, x: 0}}
            whileHover={{opacity: 1, y: 0, x: 0, scale: 1.02}}
            transition={{duration: 0.4, ease: [0.22, 1, 0.36, 1]}}
            className="fixed top-0 right-0 z-50 bg-black text-white text-[10px] font-mono border-l-2 border-b-2 border-white/20 group cursor-default overflow-hidden"
        >
            <div className="px-3 py-2 flex items-center gap-2">
                {/* Live signal indicator */}
                <span className="relative flex items-center justify-center">
                    <m.span
                        className={`absolute w-2 h-2 rounded-full ${dotBg}`}
                        animate={{scale: [1, 2, 1], opacity: [0.6, 0, 0.6]}}
                        transition={{duration: 2, repeat: Infinity, ease: 'easeOut'}}
                    />
                    <span className={`relative w-2 h-2 rounded-full ${dotBg} border border-white/30`}/>
                </span>

                <span className="font-black tracking-widest">{statusLabel}</span>
                <span className="opacity-40">:</span>
                <span className="font-black tabular-nums">{lastSyncStr}</span>

                {/* Mini signal bars on the right */}
                <div className="hidden md:flex items-end gap-0.5 h-3 ml-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    {[0, 1, 2, 3].map(i => (
                        <m.span
                            key={i}
                            className={`w-0.5 ${accentBg}`}
                            animate={{height: ['30%', '100%', '30%']}}
                            transition={{duration: 1.4, delay: i * 0.12, repeat: Infinity, ease: 'easeInOut'}}
                            style={{minHeight: 2}}
                        />
                    ))}
                </div>

                {/* Separator */}
                <span className="opacity-25 mx-0.5 hidden md:inline">|</span>

                {/* Next sync info — only on md+ to keep the bar slim on mobile */}
                <div className="hidden md:flex items-center gap-1.5">
                    <m.span
                        className={`inline-block w-1 h-1 rounded-full ${accentBg}`}
                        animate={{opacity: [1, 0.3, 1]}}
                        transition={{duration: 1.6, repeat: Infinity, ease: 'easeInOut'}}
                    />
                    <span className="opacity-60 tracking-wider">NEXT</span>
                    <span className={`font-black tabular-nums ${accentTxt}`}>{nextSyncStr}</span>

                    {/* Countdown — minutes flip with subtle slide, seconds tick smoothly */}
                    <span className="opacity-60 tabular-nums flex items-center">
                        {isOverdue ? (
                            <m.span
                                animate={{opacity: [1, 0.35, 1]}}
                                transition={{duration: 0.9, repeat: Infinity, ease: 'easeInOut'}}
                                className="text-red-300 font-black"
                            >
                                EN_BREVE
                            </m.span>
                        ) : (
                            <span className="flex items-center">
                                (
                                <AnimatePresence mode="popLayout" initial={false}>
                                    <m.span
                                        key={remainingMin}
                                        initial={{y: -4, opacity: 0}}
                                        animate={{y: 0, opacity: 1}}
                                        exit={{y: 4, opacity: 0}}
                                        transition={{duration: 0.18}}
                                        className="inline-block"
                                    >
                                        {remainingMin}
                                    </m.span>
                                </AnimatePresence>
                                <span>m&nbsp;</span>
                                <m.span
                                    key={remainingSec}
                                    initial={{color: 'rgba(253, 224, 71, 1)'}}
                                    animate={{color: 'rgba(255, 255, 255, 0.6)'}}
                                    transition={{duration: 0.4}}
                                    className="inline-block"
                                >
                                    {remainingSec.toString().padStart(2, '0')}
                                </m.span>
                                <span>s)</span>
                            </span>
                        )}
                    </span>
                </div>
            </div>

            {/* Hourly progress bar — fills 0% → 100% over the cycle */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10 overflow-hidden">
                <m.div
                    className={`h-full ${accentBg}`}
                    animate={{width: `${progress * 100}%`}}
                    transition={{duration: 1, ease: 'linear'}}
                />
                {/* Pulsing leading edge marker */}
                {!isOverdue && progress > 0.02 && progress < 0.99 && (
                    <m.span
                        className={`absolute top-0 bottom-0 w-[3px] ${accentBg} pointer-events-none`}
                        style={{
                            left: `${progress * 100}%`,
                            transform: 'translateX(-50%)',
                            boxShadow: '0 0 4px currentColor',
                        }}
                        animate={{opacity: [1, 0.3, 1]}}
                        transition={{duration: 1.2, repeat: Infinity, ease: 'easeInOut'}}
                    />
                )}
            </div>
        </m.div>
    );
};

export default memo(SyncStatus);
