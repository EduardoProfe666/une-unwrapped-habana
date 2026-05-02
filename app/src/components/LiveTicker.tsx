import React, {memo, useMemo} from 'react';
import {m} from 'framer-motion';
import type {UneAnalysis} from '@/src/lib/types';

interface Props {
    data: UneAnalysis;
    primaryColorClass: string;
}

interface TickerItem {
    label: string;
    value: string;
    accent?: 'red' | 'green' | 'yellow' | 'plain';
}

const ACCENT_CLASS: Record<string, string> = {
    red: 'text-red-500',
    green: 'text-green-400',
    yellow: 'text-yellow-300',
    plain: 'text-white',
};

const LiveTicker: React.FC<Props> = ({data}) => {
    const items = useMemo<TickerItem[]>(() => {
        const out: TickerItem[] = [];

        if (data.live_grid_status === 'active_failure') {
            out.push({label: 'ESTADO SEN', value: 'EN APAGÓN', accent: 'red'});
        } else if (data.live_grid_status === 'recovering') {
            out.push({label: 'ESTADO SEN', value: 'RESTABLECIENDO', accent: 'yellow'});
        } else if (data.live_grid_status === 'normal') {
            out.push({label: 'ESTADO SEN', value: 'OK', accent: 'green'});
        }

        if (data.health_score != null) {
            out.push({
                label: 'HEALTH',
                value: `${data.health_score}/100`,
                accent: data.health_score >= 60 ? 'green' : data.health_score >= 40 ? 'yellow' : 'red',
            });
        }

        if (data.year_records?.days_since_sen_failure != null) {
            const d = data.year_records.days_since_sen_failure;
            out.push({
                label: 'DÍAS SIN APAGÓN TOTAL',
                value: `${d}`,
                accent: d > 30 ? 'green' : d > 0 ? 'yellow' : 'red',
            });
        }

        if (data.worst_day) {
            out.push({
                label: 'PEOR DÍA',
                value: data.worst_day.date,
                accent: 'red',
            });
        }

        // Peak deficit MW from power_timeline
        const peakDeficit = data.power_timeline?.reduce((max, p) => Math.max(max, p.deficit ?? 0), 0) ?? 0;
        if (peakDeficit > 0) {
            out.push({label: 'PICO DÉFICIT', value: `${peakDeficit} MW`, accent: 'red'});
        }

        // Total blocks affectations
        const totalBlockAff = (data.blocks_analysis ?? []).reduce((s, b) => s + b.declared_affectations, 0);
        if (totalBlockAff > 0) {
            out.push({label: 'AFECTACIONES BLOQUES', value: totalBlockAff.toLocaleString(), accent: 'plain'});
        }

        // Top municipality
        const topMuni = (data.affected_zones ?? [])
            .filter(z => z.kind === 'municipality')
            .sort((a, b) => b.affectations - a.affectations)[0];
        if (topMuni) {
            out.push({label: 'TOP MUNI', value: `${topMuni.name.toUpperCase()} · ${topMuni.affectations}`, accent: 'plain'});
        }

        // SEN events
        const senFails = data.sen_analysis?.total_failure_events ?? 0;
        out.push({
            label: 'CAÍDAS DEL SEN',
            value: senFails === 0 ? 'NINGUNA' : `${senFails}`,
            accent: senFails === 0 ? 'green' : 'red',
        });

        // AI confidence
        if (data.avg_ai_confidence) {
            out.push({label: 'CONFIANZA IA', value: `${Math.round(data.avg_ai_confidence * 100)}%`, accent: 'plain'});
        }

        // Total messages
        out.push({label: 'TOTAL MENSAJES', value: data.total_messages.toLocaleString(), accent: 'plain'});

        return out;
    }, [data]);

    if (items.length === 0) return null;

    // Duplicate items so the loop is seamless
    const loopItems = [...items, ...items];

    return (
        <div className="bg-black text-white border-y-4 border-black overflow-hidden relative h-10 flex items-center">
            {/* Live red dot at the start */}
            <div className="absolute left-0 top-0 bottom-0 z-10 bg-red-600 px-3 flex items-center gap-2 border-r-2 border-white">
                <m.span
                    className="w-2 h-2 bg-white rounded-full"
                    animate={{opacity: [1, 0.3, 1]}}
                    transition={{duration: 1.2, repeat: Infinity}}
                />
                <span className="font-mono text-[10px] font-black tracking-widest uppercase">LIVE</span>
            </div>

            {/* Scrolling content */}
            <div className="absolute inset-0 flex items-center pl-24 pr-4">
                <m.div
                    className="flex items-center gap-6 whitespace-nowrap"
                    animate={{x: ['0%', '-50%']}}
                    transition={{
                        duration: items.length * 4,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                >
                    {loopItems.map((item, i) => (
                        <span key={i} className="flex items-center gap-2 text-[11px] font-mono">
                            <span className="opacity-50 uppercase tracking-widest">{item.label}:</span>
                            <span className={`font-black ${ACCENT_CLASS[item.accent ?? 'plain']}`}>
                                {item.value}
                            </span>
                            <span className="text-white/30">·</span>
                        </span>
                    ))}
                </m.div>
            </div>

            {/* Right fade */}
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black to-transparent pointer-events-none z-20"/>
        </div>
    );
};

export default memo(LiveTicker);
