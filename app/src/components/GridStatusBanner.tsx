import React, {memo} from 'react';
import {m} from 'framer-motion';
import {Activity, AlertOctagon, CheckCircle2, Loader2, Radio} from 'lucide-react';
import type {SenStatus} from '@/src/lib/types';

interface Props {
    status?: SenStatus;
    year: number;
}

const STATUS_META: Record<SenStatus, {
    label: string;
    sub: string;
    bg: string;
    text: string;
    border: string;
    accent: string;        // accent for the side dot
    pillBg: string;        // background of the icon pill
    Icon: React.FC<{size?: number; className?: string}>;
}> = {
    normal: {
        label: 'SEN ESTABLE',
        sub: 'último estado: NORMAL · sistema sincronizado',
        bg: 'bg-green-500',
        text: 'text-black',
        border: 'border-black',
        accent: 'bg-green-700',
        pillBg: 'bg-white',
        Icon: CheckCircle2,
    },
    active_failure: {
        label: 'SEN EN APAGÓN',
        sub: 'último estado: DESCONEXIÓN ACTIVA · trabajando en restablecimiento',
        bg: 'bg-red-600',
        text: 'text-white',
        border: 'border-black',
        accent: 'bg-red-300',
        pillBg: 'bg-white',
        Icon: AlertOctagon,
    },
    recovering: {
        label: 'RESTABLECIENDO',
        sub: 'último estado: RECUPERACIÓN EN CURSO',
        bg: 'bg-yellow-300',
        text: 'text-black',
        border: 'border-black',
        accent: 'bg-yellow-600',
        pillBg: 'bg-white',
        Icon: Loader2,
    },
    unknown: {
        label: 'SEN · ESTADO DESCONOCIDO',
        sub: 'sin lecturas IA del año seleccionado',
        bg: 'bg-gray-300',
        text: 'text-black',
        border: 'border-black',
        accent: 'bg-gray-600',
        pillBg: 'bg-white',
        Icon: Activity,
    },
};

const GridStatusBanner: React.FC<Props> = ({status = 'unknown', year}) => {
    const meta = STATUS_META[status];
    const isAlert = status === 'active_failure';
    const isRecovering = status === 'recovering';
    const isStable = status === 'normal';

    return (
        <m.div
            initial={{opacity: 0, y: -16}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.45, ease: [0.22, 1, 0.36, 1]}}
            className={`${meta.bg} ${meta.text} border-b-4 ${meta.border} px-4 py-2.5 flex items-center justify-between gap-3 relative overflow-hidden`}
        >
            {/* Always-on diagonal stripes (animated) — intensity per status */}
            <m.div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage:
                        'repeating-linear-gradient(45deg, transparent, transparent 12px, currentColor 12px, currentColor 13px)',
                    opacity: isAlert ? 0.18 : isRecovering ? 0.1 : isStable ? 0.07 : 0.05,
                }}
                animate={{backgroundPositionX: ['0px', '20px']}}
                transition={{duration: isAlert ? 1.6 : 4, repeat: Infinity, ease: 'linear'}}
            />

            {/* Top scanline accent (subtle) */}
            <m.div
                className={`absolute top-0 left-0 right-0 h-0.5 ${meta.accent} pointer-events-none`}
                initial={{scaleX: 0}}
                animate={{scaleX: 1}}
                transition={{duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1]}}
                style={{transformOrigin: 'left'}}
            />

            <div className="flex items-center gap-3 z-10 min-w-0">
                {/* Icon pill with pulse ring on alert */}
                <div className="relative flex-shrink-0">
                    {isAlert && (
                        <m.span
                            className="absolute inset-0 border-2 border-black"
                            animate={{scale: [1, 1.6], opacity: [0.7, 0]}}
                            transition={{duration: 1.4, repeat: Infinity, ease: 'easeOut'}}
                        />
                    )}
                    <m.div
                        className={`relative p-1.5 border-2 ${meta.border} ${meta.pillBg} text-black`}
                        animate={isAlert ? {scale: [1, 1.05, 1]} : isStable ? {rotate: [0, 4, 0]} : {}}
                        transition={{duration: isAlert ? 1.2 : 4, repeat: Infinity, ease: 'easeInOut'}}
                    >
                        <meta.Icon
                            size={18}
                            className={isRecovering ? 'animate-spin' : ''}
                        />
                    </m.div>
                </div>

                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm md:text-base uppercase tracking-tighter italic leading-none">
                            {meta.label}
                        </span>
                        {/* Glitch / fast tag for failure */}
                        {isAlert && (
                            <m.span
                                className="bg-black text-red-500 px-1.5 py-0.5 text-[9px] font-black font-mono uppercase tracking-widest border border-white/20 leading-none"
                                animate={{opacity: [0.6, 1, 0.6]}}
                                transition={{duration: 1, repeat: Infinity}}
                            >
                                ALERTA
                            </m.span>
                        )}
                        {isStable && (
                            <span className="bg-black text-green-300 px-1.5 py-0.5 text-[9px] font-black font-mono uppercase tracking-widest border border-white/20 leading-none">
                                OK
                            </span>
                        )}
                    </div>
                    <div className="text-[9px] md:text-[10px] font-mono opacity-80 uppercase tracking-widest leading-tight mt-0.5 truncate">
                        {meta.sub} · year_{year}
                    </div>
                </div>
            </div>

            {/* Right-side: live indicator + animated bars */}
            <div className="hidden md:flex items-center gap-3 z-10">
                {/* Mini "signal bars" indicator */}
                <div className="flex items-end gap-0.5 h-3.5">
                    {[0, 1, 2, 3].map(i => (
                        <m.span
                            key={i}
                            className={`w-0.5 ${meta.text === 'text-white' ? 'bg-white' : 'bg-black'}`}
                            animate={{
                                height: isAlert
                                    ? ['30%', '90%', '30%']
                                    : ['40%', '100%', '40%'],
                                opacity: [0.3, 1, 0.3],
                            }}
                            transition={{
                                duration: isAlert ? 0.6 : 1.4,
                                delay: i * 0.12,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                            style={{minHeight: 2}}
                        />
                    ))}
                </div>

                <div className="flex items-center gap-1.5 border-2 border-current/30 px-2 py-0.5 bg-black/10 backdrop-blur-sm">
                    <m.span
                        className={`w-2 h-2 rounded-full ${isAlert ? 'bg-white' : 'bg-black/60'}`}
                        animate={{opacity: [0.4, 1, 0.4], scale: isAlert ? [1, 1.3, 1] : [1, 1.1, 1]}}
                        transition={{duration: isAlert ? 1 : 1.6, repeat: Infinity}}
                    />
                    <span className="font-mono text-[10px] font-black uppercase tracking-widest leading-none">
                        SEN_LIVE
                    </span>
                    <Radio size={10} strokeWidth={3} className="opacity-60"/>
                </div>
            </div>
        </m.div>
    );
};

export default memo(GridStatusBanner);
