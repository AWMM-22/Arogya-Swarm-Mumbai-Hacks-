import React from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { Icons } from './ui/Icons';

const data = [
  { v: 40 }, { v: 45 }, { v: 42 }, { v: 60 }, { v: 45 }, { v: 50 }, 
  { v: 35 }, { v: 40 }, { v: 70 }, { v: 30 }, { v: 45 }, { v: 50 }, 
  { v: 55 }, { v: 45 }, { v: 40 }, { v: 42 }, { v: 45 }, { v: 50 },
  { v: 48 }, { v: 45 }
];

const HeartRateChart: React.FC = () => {
  return (
    <div className="bg-[#0F1420] rounded-3xl p-5 border border-white/5 relative overflow-hidden h-full flex flex-col justify-between">
      {/* Gradient Background Effect for Card */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

      <div className="relative z-10 flex justify-between items-start">
        <div className="flex flex-col">
           <span className="text-3xl font-bold text-white">120 <span className="text-sm font-normal text-gray-400">bpm</span></span>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
          <Icons.Heart className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      <div className="h-24 w-full -mx-2 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00C2FF" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#00C2FF" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
            <Area 
              type="monotone" 
              dataKey="v" 
              stroke="#00C2FF" 
              strokeWidth={3} 
              fill="none" 
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="relative z-10 mt-2">
        <div className="text-sm font-medium text-white">Heartbeat Monitor</div>
        <div className="text-xs text-primary uppercase tracking-wider mt-1">Design by Fluttertop</div>
      </div>
    </div>
  );
};

export default HeartRateChart;