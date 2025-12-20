import React, {useMemo, useState} from 'react';
import {Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {UneAnalysis} from '../common/types.ts';

interface Props {
    data: UneAnalysis;
    color: string;
}

type ChartType = 'views' | 'replies' | 'reactions' | 'messages';

const CHART_LABELS: Record<ChartType, string> = {
    views: 'Vistas',
    replies: 'Comentarios',
    reactions: 'Reacciones',
    messages: 'Mensajes'
};

const MONTHS_MAPPER: Record<string, string> = {
    'ENE': 'Enero', 'FEB': 'Febrero', 'MAR': 'Marzo', 'ABR': 'Abril',
    'MAY': 'Mayo', 'JUN': 'Junio', 'JUL': 'Julio', 'AGO': 'Agosto',
    'SEP': 'Septiembre', 'OCT': 'Octubre', 'NOV': 'Noviembre', 'DIC': 'Diciembre',
};

const COLOR_MAP: Record<string, string> = {
    orange: '#f97316',
    blue: '#3b82f6',
    green: '#22c55e',
    purple: '#a855f7',
    default: '#000000'
};

const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
};

const ChartSection: React.FC<Props> = ({data, color}) => {
    const [chartType, setChartType] = useState<ChartType>('views');

    const chartData = useMemo(() => {
        const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        return Object.keys(data.monthly_views).map(monthKey => {
            const index = parseInt(monthKey) - 1;
            return {
                name: months[index].toUpperCase(),
                views: data.monthly_views[monthKey],
                replies: data.monthly_replies[monthKey],
                reactions: data.monthly_reactions[monthKey],
                messages: data.monthly_messages[monthKey],
            };
        });
    }, [data]);

    const activeColorHex = useMemo(() => {
        const foundKey = Object.keys(COLOR_MAP).find(k => color.includes(k));
        return foundKey ? COLOR_MAP[foundKey] : COLOR_MAP.default;
    }, [color]);

    return (
        <div className="w-full space-y-8">
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                {(Object.keys(CHART_LABELS) as ChartType[]).map((type) => (
                    <button
                        key={type}
                        onClick={() => setChartType(type)}
                        className={`group relative px-6 py-2 font-black uppercase tracking-tighter border-4 border-black transition-all ${
                            chartType === type
                                ? `${color} text-black shadow-[4px_4px_0px_0px_black]`
                                : 'bg-white text-black hover:bg-gray-50 shadow-[2px_2px_0px_0px_black]'
                        }`}
                    >
                        <span className="relative z-10">{CHART_LABELS[type]}</span>
                        {chartType === type && (
                            <div
                                className="absolute -top-2 -right-2 w-4 h-4 bg-black rounded-full animate-ping opacity-20"/>
                        )}
                    </button>
                ))}
            </div>

            <div
                className="h-[400px] w-full bg-white border-4 border-black p-6 shadow-[12px_12px_0px_0px_black] relative overflow-hidden">
                <div
                    className="absolute inset-0 opacity-[0.05] pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)',
                        backgroundSize: '24px 24px'
                    }}
                />

                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{top: 20, right: 10, left: -20, bottom: 0}}>
                        <CartesianGrid
                            strokeDasharray="0"
                            vertical={false}
                            stroke="#f0f0f0"/>
                        <XAxis
                            dataKey="name"
                            tick={{fontSize: 11, fontWeight: 900, fill: '#000'}}
                            axisLine={{strokeWidth: 4, stroke: '#000'}}
                            tickLine={false}
                            dy={10}
                        />
                        <YAxis
                            tickFormatter={formatYAxis}
                            tick={{fontSize: 10, fontWeight: 700, fill: '#9ca3af'}}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            cursor={{fill: '#000', fillOpacity: 0.05}}
                            content={({active, payload, label}) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div
                                            className="bg-black text-white p-3 border-2 border-white shadow-[4px_4px_0px_0px_black] min-w-[140px]">
                                            <p className="text-[10px] font-black uppercase opacity-60 mb-1 border-b border-white/20 pb-1">
                                                {MONTHS_MAPPER[label] || label}
                                            </p>
                                            <p className="text-xl font-black italic">
                                                {new Intl.NumberFormat('es-ES').format(payload[0].value as number)}
                                            </p>
                                            <p className="text-[9px] font-bold uppercase tracking-widest">{CHART_LABELS[chartType]}</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar
                            dataKey={chartType}
                            animationDuration={500}
                            animationEasing="ease-out"
                            maxBarSize={60}
                        >
                            {chartData.map((_entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={activeColorHex}
                                    stroke="black"
                                    strokeWidth={3}
                                    className="hover:opacity-80 transition-opacity cursor-pointer"
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="flex justify-between items-center px-2">
                <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-8 h-1 bg-black" style={{opacity: (i + 1) * 0.2}}/>
                    ))}
                </div>
                <span className="text-[10px] font-mono font-black uppercase text-gray-400">
                Data_Source: Telegram_API // Scale: Linear
            </span>
            </div>
        </div>
    );
};

export default React.memo(ChartSection);