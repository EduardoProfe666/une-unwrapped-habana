import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { UneAnalysis } from '../types';

interface Props {
  data: UneAnalysis;
  color: string;
}

type ChartType = 'views' | 'replies' | 'reactions' | 'messages';

export const ChartSection: React.FC<Props> = ({ data, color }) => {
  const [chartType, setChartType] = useState<ChartType>('views');

  const chartData = Object.keys(data.monthly_views).map(month => ({
    name: new Date(2000, parseInt(month) - 1, 1).toLocaleString('es-ES', { month: 'short' }),
    views: data.monthly_views[month],
    replies: data.monthly_replies[month],
    reactions: data.monthly_reactions[month],
    messages: data.monthly_messages[month],
  }));

  const getActiveData = (item: any) => item[chartType];
  const colorHex = color.includes('orange') ? '#f97316' : 
                   color.includes('blue') ? '#3b82f6' : 
                   color.includes('green') ? '#22c55e' : '#a855f7';

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        {['views', 'replies', 'reactions', 'messages'].map((type) => (
          <button
            key={type}
            onClick={() => setChartType(type as ChartType)}
            className={`px-4 py-2 font-bold uppercase border-2 border-black transition-all ${
              chartType === type 
                ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] translate-x-[-2px] translate-y-[-2px]' 
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            {type === 'views' ? 'Vistas' : type === 'replies' ? 'Comentarios' : type === 'reactions' ? 'Reacciones' : 'Mensajes'}
          </button>
        ))}
      </div>

      <div className="h-[300px] w-full bg-white neobrutal-border p-2 neobrutal-shadow">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 'bold' }} stroke="#000" />
            <YAxis hide />
            <Tooltip 
                contentStyle={{ border: '2px solid black', borderRadius: '0px', boxShadow: '4px 4px 0px 0px black' }}
                itemStyle={{ fontWeight: 'bold', color: colorHex }}
                formatter={(value: number) => new Intl.NumberFormat('es-ES').format(value)}
            />
            <Bar dataKey={chartType} radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colorHex} stroke="black" strokeWidth={2} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};