import React, { useMemo, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { BlockAnalysis } from '../common/types'; // Asegúrate de que la ruta sea correcta
import { formatDuration } from '../common/utils'; // Usamos tu función mejorada
import { Calendar, Clock, BarChart3, AlertOctagon } from 'lucide-react';

interface Props {
    blocks: BlockAnalysis[];
    year: number;
}

const DAYS = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];
const FULL_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

type ViewMode = 'total' | 'average';

const WeeklyBlockMatrix: React.FC<Props> = ({ blocks, year }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('total');
    const [hoveredCell, setHoveredCell] = useState<{ block: number, day: number } | null>(null);

    const { maxVal, matrixData } = useMemo(() => {
        let max = 0;
        const data = blocks.map(block => {
            const rowData = Array.from({ length: 7 }).map((_, dayIndex) => {
                const val = viewMode === 'total'
                    ? block.weekday_off_seconds[dayIndex] || 0
                    : block.weekday_off_avg_seconds[dayIndex] || 0;

                if (val > max) max = val;
                return val;
            });
            return { blockNumber: block.number, values: rowData };
        });
        return { maxVal: max, matrixData: data };
    }, [blocks, viewMode]);

    const getIntensityStyles = (val: number) => {
        const intensity = maxVal > 0 ? val / maxVal : 0;

        if (intensity === 0) return 'bg-gray-50';
        if (intensity < 0.2) return 'bg-yellow-100';
        if (intensity < 0.4) return 'bg-yellow-300';
        if (intensity < 0.6) return 'bg-orange-400';
        if (intensity < 0.8) return 'bg-red-500 text-white';
        return 'bg-black text-white pattern-diagonal-lines'; // El más alto
    };

    return (
        <section className="mt-20 relative">
            <div className="absolute top-0 right-0 -z-10 opacity-10">
                <Calendar size={200} strokeWidth={1} />
            </div>

            <div className="bg-white border-4 border-black p-4 md:p-8 shadow-[12px_12px_0px_0px_black]">

                {/* HEADER & CONTROLS */}
                <header className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6 border-b-4 border-black pb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-black text-white text-[10px] px-2 py-0.5 font-bold uppercase tracking-widest">
                                Matrix_Module_V2
                            </span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none">
                            Patrón Semanal<br/>de Afectaciones
                        </h2>
                    </div>

                    <div className="flex bg-gray-100 p-1 border-2 border-black gap-1 shadow-[4px_4px_0px_0px_black]">
                        <button
                            onClick={() => setViewMode('total')}
                            className={`px-4 py-2 text-xs font-black uppercase transition-all border-2 ${viewMode === 'total' ? 'bg-black text-white border-black shadow-md' : 'bg-transparent text-gray-400 border-transparent hover:text-black'}`}
                        >
                            Acumulado Total
                        </button>
                        <button
                            onClick={() => setViewMode('average')}
                            className={`px-4 py-2 text-xs font-black uppercase transition-all border-2 ${viewMode === 'average' ? 'bg-yellow-400 text-black border-black shadow-md' : 'bg-transparent text-gray-400 border-transparent hover:text-black'}`}
                        >
                            Promedio Diario
                        </button>
                    </div>
                </header>

                <div className="relative overflow-x-auto pb-4">
                    <div className="min-w-[600px]">
                        {/* Header Row (Days) */}
                        <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-2 mb-2">
                            <div className="flex items-end justify-center pb-2">
                                <span className="font-mono text-[10px] font-black opacity-30 -rotate-12">BLOQUE</span>
                            </div>
                            {DAYS.map((day, i) => (
                                <div key={i} className="text-center">
                                    <span className="text-sm font-black uppercase tracking-widest">{day}</span>
                                    <div className="h-1 w-full bg-black mt-1"></div>
                                </div>
                            ))}
                        </div>

                        {/* Data Rows */}
                        <div className="space-y-2">
                            {matrixData.map((row) => (
                                <div key={row.blockNumber} className="grid grid-cols-[80px_repeat(7,1fr)] gap-2 group/row">
                                    {/* Block Label */}
                                    <div className="flex items-center justify-center bg-black text-white border-2 border-black font-black text-xl shadow-[2px_2px_0px_0px_gray]">
                                        {row.blockNumber}
                                    </div>

                                    {/* Day Cells */}
                                    {row.values.map((val, dayIndex) => (
                                        <m.div
                                            key={dayIndex}
                                            layout
                                            onMouseEnter={() => setHoveredCell({ block: row.blockNumber, day: dayIndex })}
                                            onMouseLeave={() => setHoveredCell(null)}
                                            className={`
                                                relative h-12 border-2 border-black transition-colors duration-300 cursor-crosshair
                                                flex items-center justify-center group/cell overflow-hidden
                                                ${getIntensityStyles(val)}
                                            `}
                                        >
                                            {/* Bar Indicator (Height based on value) */}
                                            <m.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${(val / maxVal) * 100}%` }}
                                                transition={{ duration: 0.5 }}
                                                className="absolute bottom-0 left-0 w-full bg-black/10 pointer-events-none"
                                            />

                                            {/* Hover State: Border highlight */}
                                            <div className="absolute inset-0 border-2 border-white opacity-0 group-hover/cell:opacity-100 transition-opacity z-20" />
                                        </m.div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* DETAIL PANEL (SENSOR READOUT) */}
                <div className="mt-8 border-t-4 border-black pt-4 min-h-[100px] flex items-center justify-center bg-gray-50 relative overflow-hidden">
                    {/* Background noise/grid */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                    <AnimatePresence mode="wait">
                        {hoveredCell ? (
                            <m.div
                                key="active"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="z-10 text-center w-full"
                            >
                                <div className="flex justify-center items-center gap-4 mb-2">
                                    <div className="bg-black text-white px-3 py-1 text-sm font-black uppercase -rotate-2 shadow-lg">
                                        Bloque {hoveredCell.block}
                                    </div>
                                    <span className="text-xl font-black uppercase text-gray-400">×</span>
                                    <div className="bg-yellow-400 border-2 border-black px-3 py-1 text-sm font-black uppercase rotate-2 shadow-lg">
                                        {FULL_DAYS[hoveredCell.day]}
                                    </div>
                                </div>

                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] font-mono uppercase tracking-widest opacity-60 mb-1">
                                        {viewMode === 'total' ? 'Tiempo Total de Afectación' : 'Promedio Histórico'}
                                    </span>
                                    <span className="text-3xl md:text-5xl font-mono font-black tracking-tighter">
                                        {formatDuration(
                                            viewMode === 'total'
                                                ? blocks.find(b => b.number === hoveredCell.block)?.weekday_off_seconds[hoveredCell.day] || 0
                                                : blocks.find(b => b.number === hoveredCell.block)?.weekday_off_avg_seconds[hoveredCell.day] || 0
                                        )}
                                    </span>
                                </div>
                            </m.div>
                        ) : (
                            <m.div
                                key="idle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center opacity-30 gap-2"
                            >
                                <AlertOctagon size={32} />
                                <p className="text-xs font-black uppercase tracking-widest">
                                    Pasa el cursor por la matriz para ver detalles
                                </p>
                            </m.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Legend */}
                <div className="flex justify-end gap-2 mt-4 text-[9px] font-bold uppercase tracking-widest opacity-60">
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-50 border border-black"/> Baja</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-400 border border-black"/> Media</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-black border border-white"/> Crítica</div>
                </div>
            </div>
        </section>
    );
};

export default React.memo(WeeklyBlockMatrix);