import React, {useMemo, useState} from 'react';
import {AnimatePresence, m} from 'framer-motion';
import NeobrutalTooltip from "@/src/components/NeobrutalTooltip.tsx";
import {SEVERITY_BG, SEVERITY_LABEL} from '@/src/lib/constants';
import type {Severity} from '@/src/lib/types';

interface Props {
    dailySeverity?: Record<string, Severity>;
    year: number;
    accentClass: string;
}

const DAYS_LABELS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
const MONTHS_LABELS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const SEVERITIES_ORDER: Severity[] = ['low', 'medium', 'high', 'critical'];

const formatDayToDate = (dayNum: number, year: number): string => {
    const date = new Date(year, 0, dayNum);
    const day = date.getDate();
    const month = MONTHS_LABELS[date.getMonth()].toLowerCase();
    return `${day} de ${month}`;
};

const SeverityCalendar: React.FC<Props> = ({dailySeverity, year}) => {
    const [hoveredDay, setHoveredDay] = useState<number | null>(null);

    const {matrix, totals, months, worstDay} = useMemo(() => {
        const firstDayOfYear = new Date(year, 0, 1);
        const startDayOfWeek = firstDayOfYear.getDay();
        const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        const totalDays = isLeapYear ? 366 : 365;

        const rows: ({ dayNum: number; severity: Severity | null } | null)[][] =
            Array.from({length: 7}, () => []);

        const monthPositions: { label: string, colIndex: number }[] = [];
        let lastMonth = -1;

        const tally: Record<Severity, number> = {low: 0, medium: 0, high: 0, critical: 0};
        let firstCriticalDay: number | null = null;

        for (let i = 1; i <= totalDays + startDayOfWeek; i++) {
            const dayOfWeek = (i - 1) % 7;
            const colIndex = Math.floor((i - 1) / 7);
            const dayNum = i - startDayOfWeek;

            if (dayNum <= 0) {
                rows[dayOfWeek].push(null);
            } else if (dayNum <= totalDays) {
                const sev = (dailySeverity?.[String(dayNum)] ?? null) as Severity | null;
                rows[dayOfWeek].push({dayNum, severity: sev});

                if (sev) {
                    tally[sev]++;
                    if (sev === 'critical' && firstCriticalDay == null) firstCriticalDay = dayNum;
                }

                const date = new Date(year, 0, dayNum);
                const currentMonth = date.getMonth();
                if (currentMonth !== lastMonth) {
                    monthPositions.push({label: MONTHS_LABELS[currentMonth], colIndex});
                    lastMonth = currentMonth;
                }
            }
        }

        return {
            matrix: rows,
            totals: tally,
            months: monthPositions,
            worstDay: firstCriticalDay,
        };
    }, [dailySeverity, year]);

    const totalEventDays = totals.low + totals.medium + totals.high + totals.critical;

    return (
        <section className="bg-white neobrutal-border p-6 md:p-10 neobrutal-shadow visible">
            <header className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <h2 className="text-4xl font-black uppercase tracking-tighter bg-black text-white inline-block px-4 py-2 transform -rotate-1 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)]">
                    Calendario de Severidad {year}
                </h2>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest max-w-xs">
                    Cada cuadro = un día. Color = el peor evento detectado por la IA en ese día.
                </p>
            </header>

            <div className="relative">
                <div className="overflow-x-auto pb-16 custom-scrollbar">
                    <div className="inline-block relative min-w-max p-6 pt-12">

                        <div className="absolute top-2 left-18 flex w-full pointer-events-none">
                            {months.map((m, i) => (
                                <div
                                    key={i}
                                    className="text-[11px] font-black text-black absolute uppercase tracking-widest border-l-2 border-black pl-1"
                                    style={{left: `${m.colIndex * 1.95}rem`}}
                                >
                                    {m.label}
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-4">
                            <div className="flex flex-col justify-between py-1 text-[10px] font-black text-gray-400 uppercase w-8 select-none">
                                {DAYS_LABELS.map((label, i) => (
                                    <span key={i} className="h-6 leading-none flex items-center">
                                        {i % 2 !== 0 ? label : ''}
                                    </span>
                                ))}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                {matrix.map((row, rowIndex) => (
                                    <div key={rowIndex} className="flex gap-1.5">
                                        {row.map((day, colIndex) => (
                                            <div key={colIndex} className="relative">
                                                {!day ? (
                                                    <div className="w-6 h-6"/>
                                                ) : (
                                                    <div
                                                        className="relative"
                                                        style={{zIndex: hoveredDay === day.dayNum ? 100 : 1}}
                                                        onMouseEnter={() => setHoveredDay(day.dayNum)}
                                                        onMouseLeave={() => setHoveredDay(null)}
                                                    >
                                                        <m.div
                                                            animate={{scale: hoveredDay === day.dayNum ? 1.5 : 1}}
                                                            transition={{type: 'spring', stiffness: 400, damping: 18}}
                                                            className={`w-6 h-6 border-2 border-black relative cursor-crosshair ${day.severity ? SEVERITY_BG[day.severity] : 'bg-white'}`}
                                                            style={{
                                                                boxShadow: hoveredDay === day.dayNum ? '4px 4px 0px 0px black' : 'none',
                                                            }}
                                                        >
                                                            {day.severity === 'critical' && (
                                                                <div className="absolute inset-0 pointer-events-none"
                                                                     style={{
                                                                         backgroundImage:
                                                                             'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.25) 2px, rgba(0,0,0,0.25) 3px)',
                                                                     }}
                                                                />
                                                            )}
                                                        </m.div>

                                                        <AnimatePresence>
                                                            {hoveredDay === day.dayNum && (
                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 z-[110] pointer-events-none whitespace-nowrap">
                                                                    <NeobrutalTooltip
                                                                        text={
                                                                            day.severity
                                                                                ? `${formatDayToDate(day.dayNum, year)} · ${SEVERITY_LABEL[day.severity].toUpperCase()}`
                                                                                : `${formatDayToDate(day.dayNum, year)} · sin eventos`
                                                                        }
                                                                    />
                                                                </div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="mt-8 pt-6 border-t-4 border-black flex flex-wrap justify-between items-end gap-6">
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-black uppercase">Severidad</span>
                    <div className="flex gap-1.5 p-1 bg-white border-2 border-black shadow-[3px_3px_0px_0px_black]">
                        <m.div
                            whileHover={{scale: 1.2}}
                            className="w-4 h-4 border border-black bg-white"
                            title="Sin eventos"
                        />
                        {SEVERITIES_ORDER.map((sev) => (
                            <m.div
                                key={sev}
                                whileHover={{scale: 1.2}}
                                className={`w-4 h-4 border border-black ${SEVERITY_BG[sev]} cursor-help`}
                                title={SEVERITY_LABEL[sev]}
                            />
                        ))}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {SEVERITIES_ORDER.map(sev => (
                            <span
                                key={sev}
                                className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
                            >
                                <span className={`inline-block w-2 h-2 ${SEVERITY_BG[sev]} border border-black`}/>
                                {SEVERITY_LABEL[sev]} <span className="font-mono opacity-60">{totals[sev]}</span>
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex gap-6">
                    <div className="text-right border-r-4 border-black pr-4">
                        <p className="text-[10px] font-black text-gray-500 uppercase leading-none">Días con eventos</p>
                        <p className="text-2xl font-black italic">{totalEventDays}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-gray-500 uppercase leading-none">Días Críticos</p>
                        <p className="text-2xl font-black text-red-600">{totals.critical}</p>
                        {worstDay != null && (
                            <p className="text-[9px] font-mono text-gray-400 mt-0.5">
                                primer crítico · {formatDayToDate(worstDay, year)}
                            </p>
                        )}
                    </div>
                </div>
            </footer>
        </section>
    );
};

export default React.memo(SeverityCalendar);
