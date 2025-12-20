import React, {useMemo, useState} from 'react';
import {Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {UneAnalysis} from '../common/types.ts';

interface Props {
  data: UneAnalysis;
  color: string;
}

type ChartType = 'views' | 'replies' | 'reactions' | 'messages';

const CHART_TYPE_MAPPER: Record<string, string> = {
  'views': 'Vistas',
  'replies': 'Comentarios',
  'reactions': 'Reacciones',
  'messages': 'Mensajes',
}

const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const MONTHS_MAPPER: Record<string, string> = {
  'ene': 'Enero',
  'feb': 'Febrero',
  'mar': 'Marzo',
  'abr': 'Abril',
  'may': 'Mayo',
  'jun': 'Junio',
  'jul': 'Julio',
  'ago': 'Agosto',
  'sep': 'Septiembre',
  'oct': 'Octubre',
  'nov': 'Noviembre',
  'dic': 'Diciembre',
}

const COLOR_MAP: Record<string, string> = {
  orange: '#f97316',
  blue: '#3b82f6',
  green: '#22c55e',
  purple: '#a855f7',
  default: '#a855f7'
};

const CHART_LABELS: Record<ChartType, string> = {
  views: 'Vistas',
  replies: 'Comentarios',
  reactions: 'Reacciones',
  messages: 'Mensajes'
};

const ChartSection: React.FC<Props> = ({ data, color }) => {
  const [chartType, setChartType] = useState<ChartType>('views');

  const chartData = useMemo(() => {
    return Object.keys(data.monthly_views).map(monthKey => {
      const index = parseInt(monthKey) - 1;
      return {
        name: MONTHS_ES[index].toUpperCase() || monthKey,
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

  const tooltipContentStyle = useMemo(() => ({
    border: '2px solid black',
    borderRadius: '0px',
    boxShadow: '4px 4px 0px 0px black'
  }), []);

  const tooltipItemStyle = useMemo(() => ({
    fontWeight: 'bold',
    color: activeColorHex
  }), [activeColorHex]);

  return (
      <div className="w-full">
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {(Object.keys(CHART_LABELS) as ChartType[]).map((type) => (
              <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={`px-4 py-2 font-bold uppercase border-2 border-black transition-all ${
                      chartType === type
                          ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] -translate-x-[2px] -translate-y-[2px]'
                          : 'bg-white text-black hover:bg-gray-100'
                  }`}
              >
                {CHART_LABELS[type]}
              </button>
          ))}
        </div>

        <div className="h-[300px] w-full bg-white neobrutal-border p-2 neobrutal-shadow">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fontWeight: 'bold' }}
                  stroke="#000"
              />
              <YAxis hide />
              <Tooltip
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={tooltipContentStyle}
                  itemStyle={tooltipItemStyle}
                  labelFormatter={(label: string) => {
                    return MONTHS_MAPPER[label.toLowerCase()].toUpperCase() || label.toUpperCase();
                  }}
                  formatter={(value: number, name: string) => {
                    const translatedName = CHART_TYPE_MAPPER[name] || name;
                    const formattedValue = new Intl.NumberFormat('es-ES').format(value);
                    return [formattedValue, translatedName];
                  }}
              />
              <Bar
                  dataKey={chartType}
                  radius={[4, 4, 0, 0]}
                  animationDuration={500}
              >
                {chartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={activeColorHex} stroke="black" strokeWidth={2} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
  );
};

export default React.memo(ChartSection);