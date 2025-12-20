import React, { useMemo, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import NeobrutalTooltip from "@/src/components/NeobrutalTooltip.tsx";

interface Props {
    dailyMessages: Record<number, number>;
    colorClass: string;
    year: number;
}

const DAYS_LABELS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
const MONTHS_LABELS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const formatDayToDate = (dayNum: number, year: number): string => {
    const date = new Date(year, 0, dayNum);
    const day = date.getDate();
    const month = MONTHS_LABELS[date.getMonth()].toLowerCase();
    return `${day} de ${month}`;
};

const DailyActivity: React.FC<Props> = ({ dailyMessages, colorClass, year }) => {
    const [hoveredDay, setHoveredDay] = useState<number | null>(null);

    const { matrix, maxMessages, avgMessages, months } = useMemo(() => {
        const values = Object.values(dailyMessages);
        const max = Math.max(...values, 1);
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length || 0;

        const firstDayOfYear = new Date(year, 0, 1);
        const startDayOfWeek = firstDayOfYear.getDay();
        const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        const totalDays = isLeapYear ? 366 : 365;

        const rows: ({ dayNum: number; count: number; intensity: number } | null)[][] =
            Array.from({ length: 7 }, () => []);

        const monthPositions: { label: string, colIndex: number }[] = [];
        let lastMonth = -1;

        for (let i = 1; i <= totalDays + startDayOfWeek; i++) {
            const dayOfWeek = (i - 1) % 7;
            const colIndex = Math.floor((i - 1) / 7);
            const dayNum = i - startDayOfWeek;

            if (dayNum <= 0) {
                rows[dayOfWeek].push(null);
            } else if (dayNum <= totalDays) {
                const count = dailyMessages[dayNum] || 0;
                const intensity = count === 0 ? 0 : 0.2 + (count / max) * 0.8;

                rows[dayOfWeek].push({ dayNum, count, intensity });

                const date = new Date(year, 0, dayNum);
                const currentMonth = date.getMonth();
                if (currentMonth !== lastMonth) {
                    monthPositions.push({ label: MONTHS_LABELS[currentMonth], colIndex });
                    lastMonth = currentMonth;
                }
            }
        }

        return { matrix: rows, maxMessages: max, avgMessages: avg, months: monthPositions };
    }, [dailyMessages, year]);

    return (
        <section className="bg-white neobrutal-border p-6 md:p-10 neobrutal-shadow visible">
            <header className="mb-12">
                <h2 className="text-4xl font-black uppercase tracking-tighter bg-black text-white inline-block px-4 py-2 transform -rotate-1 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)]">
                    Actividad Diaria {year}
                </h2>
            </header>

            <div className="relative">
                <div className="overflow-x-auto pb-16 custom-scrollbar">
                    <div className="inline-block relative min-w-max p-6 pt-12">

                        <div className="absolute top-2 left-18 flex w-full pointer-events-none">
                            {months.map((m, i) => (
                                <div
                                    key={i}
                                    className="text-[11px] font-black text-black absolute uppercase tracking-widest border-l-2 border-black pl-1"
                                    style={{ left: `${m.colIndex * 1.655}rem` }}
                                >
                                    {m.label}
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-4">
                            <div className="flex flex-col justify-between py-1 text-[10px] font-black text-gray-400 uppercase w-8 select-none">
                                {DAYS_LABELS.map((label, i) => (
                                    <span key={i} className="h-5 leading-none flex items-center">
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
                                                    <div className="w-5 h-5 md:w-5 md:h-5" />
                                                ) : (
                                                    <div
                                                        className="relative"
                                                        style={{ zIndex: hoveredDay === day.dayNum ? 100 : 1 }}
                                                        onMouseEnter={() => setHoveredDay(day.dayNum)}
                                                        onMouseLeave={() => setHoveredDay(null)}
                                                    >
                                                        <m.div
                                                            animate={{ scale: hoveredDay === day.dayNum ? 1.4 : 1 }}
                                                            className="w-5 h-5 border-2 border-black relative bg-gray-50 cursor-crosshair"
                                                            style={{
                                                                boxShadow: hoveredDay === day.dayNum ? '4px 4px 0px 0px black' : 'none',
                                                            }}
                                                        >
                                                            {day.count > 0 && (
                                                                <div
                                                                    className={`absolute inset-0 ${colorClass}`}
                                                                    style={{ opacity: day.intensity }}
                                                                />
                                                            )}
                                                        </m.div>

                                                        <AnimatePresence>
                                                            {hoveredDay === day.dayNum && (
                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 z-[110] pointer-events-none whitespace-nowrap">
                                                                    <NeobrutalTooltip
                                                                        text={`${formatDayToDate(day.dayNum, year)}: ${day.count} mensajes`}
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
                <div className="flex items-center gap-3">
                    <span className="text-xs font-black uppercase">Menos</span>
                    <div className="flex gap-1.5 p-1 bg-white border-2 border-black shadow-[3px_3px_0px_0px_black]">
                        {[0, 0.25, 0.5, 0.75, 1].map((op, i) => (
                            <div
                                key={i}
                                className={`w-4 h-4 border border-black ${i === 0 ? 'bg-gray-100' : colorClass}`}
                                style={{ opacity: i === 0 ? 1 : op }}
                            />
                        ))}
                    </div>
                    <span className="text-xs font-black uppercase">Más</span>
                </div>

                <div className="flex gap-6">
                    <div className="text-right border-r-4 border-black pr-4">
                        <p className="text-[10px] font-black text-gray-500 uppercase leading-none">Promedio Diario</p>
                        <p className="text-2xl font-black italic">{avgMessages.toFixed(0)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-gray-500 uppercase leading-none">Pico del Año</p>
                        <p className="text-2xl font-black text-red-600">{maxMessages}</p>
                    </div>
                </div>
            </footer>
        </section>
    );
};

export default React.memo(DailyActivity);