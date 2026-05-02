import React, {memo, useEffect, useRef, useState} from 'react';
import {animate, useInView, useMotionValue, useTransform} from 'framer-motion';

interface Props {
    value: number;
    className?: string;
    duration?: number;
    suffix?: string;
}

/**
 * Counts up from 0 to `value` once when scrolled into view.
 * Uses a smooth out-quint easing.
 */
const AnimatedCounter: React.FC<Props> = ({value, className, duration = 1.2, suffix = ''}) => {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, {once: true, amount: 0.5});
    const motionVal = useMotionValue(0);
    const rounded = useTransform(motionVal, (v) => Math.round(v).toLocaleString('es-CU'));
    const [display, setDisplay] = useState('0');

    useEffect(() => {
        if (!inView) return;
        const controls = animate(motionVal, value, {
            duration,
            ease: [0.16, 1, 0.3, 1],
        });
        const unsubscribe = rounded.on('change', (v) => setDisplay(v));
        return () => {
            controls.stop();
            unsubscribe();
        };
    }, [inView, motionVal, rounded, value, duration]);

    return (
        <span ref={ref} className={className}>
            {display}{suffix}
        </span>
    );
};

export default memo(AnimatedCounter);
