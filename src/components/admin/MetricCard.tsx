import React from 'react';

export const MetricCard: React.FC<{ icon: React.ReactNode, title: string, value: string | number, color: string }> = ({ icon, title, value, color }) => (
    <div className={`p-6 rounded-xl border border-white/10 shadow-lg ${color}/10 bg-zinc-900/50`}>
        <div className={`p-3 w-fit rounded-full ${color}/20 ${color}`}>
            {icon}
        </div>
        <p className="text-sm text-gray-400 mt-4">{title}</p>
        <h4 className="text-2xl font-bold text-white mt-1">{value}</h4>
    </div>
);