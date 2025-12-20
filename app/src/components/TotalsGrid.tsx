import React, { memo } from 'react';
import { m, Variants } from 'framer-motion';
import { formatNumber } from '@/src/common/utils';
import { LucideIcon } from 'lucide-react'; // Importamos el tipo de Lucide

interface TotalItem {
    label: string;
    value: number;
    icon: LucideIcon;
    colorClass?: string;
}

interface TotalsGridProps {
    items: TotalItem[];
    containerVariants: Variants;
    itemVariants: Variants;
}

const TotalsGrid: React.FC<TotalsGridProps> = ({ items, containerVariants, itemVariants }) => {
    return (
        <m.section
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
        >
            {items.map((stat, i) => {
                const IconComponent = stat.icon;

                return (
                    <m.div
                        key={i}
                        variants={itemVariants}
                        className="bg-white border-4 border-black p-5 relative flex flex-col justify-between h-36 shadow-[6px_6px_0px_0px_black] group hover:-translate-y-2 hover:-translate-x-1 transition-transform"
                    >
                        <div className={`absolute top-0 right-0 w-8 h-8 border-l-4 border-b-4 border-black ${stat.colorClass || 'bg-black'} group-hover:w-full group-hover:h-2 transition-all duration-300`} />

                        <header className="flex flex-col gap-1">
                            <div className="bg-black text-white w-fit p-1 mb-1">
                                <IconComponent size={16} strokeWidth={3} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 leading-none">
                                {stat.label}
                            </span>
                        </header>

                        <footer className="relative">
                            <span
                                className="text-3xl md:text-5xl font-black italic tracking-tighter leading-none block truncate"
                                title={stat.value.toLocaleString('es-ES')}
                            >
                                {stat.value >= 1_000_000
                                    ? `${(stat.value / 1_000_000).toFixed(1)}M`
                                    : formatNumber(stat.value)}
                            </span>
                        </footer>
                    </m.div>
                );
            })}
        </m.section>
    );
};

export default memo(TotalsGrid);