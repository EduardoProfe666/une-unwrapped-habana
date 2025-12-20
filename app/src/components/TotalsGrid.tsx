import React, {memo} from 'react';
import {m, Variants} from 'framer-motion';
import {formatNumber} from '@/src/common/utils';

interface TotalItem {
    label: string;
    value: number;
    icon: React.ReactNode;
}

interface TotalsGridProps {
    items: TotalItem[];
    containerVariants: Variants;
    itemVariants: Variants;
}

const TotalsGrid: React.FC<TotalsGridProps> = ({
                                                   items,
                                                   containerVariants,
                                                   itemVariants
                                               }) => {
    return (
        <m.section
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
            {items.map((stat, i) => (
                <m.div
                    key={i}
                    variants={itemVariants}
                    className="bg-white neobrutal-border p-4 neobrutal-shadow flex flex-col justify-between h-32 transition-transform hover:-translate-y-1"
                >
                    <div className="flex justify-between items-start text-gray-500">
                        <span className="text-xs font-bold uppercase">
                            {stat.label}
                        </span>
                        {stat.icon}
                    </div>

                    <span
                        className="text-2xl md:text-4xl font-black truncate"
                        title={stat.value.toLocaleString('es-ES')}
                    >
                        {stat.value >= 1_000_000
                            ? `${(stat.value / 1_000_000).toFixed(1)}M`
                            : formatNumber(stat.value)}
                    </span>
                </m.div>
            ))}
        </m.section>
    );
};

export default memo(TotalsGrid);
