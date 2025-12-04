import React, { useEffect, useState } from 'react';
import { Card } from '@/src/components/ui/card';


interface Log {
    timestamp: number;
    type: string;
    prompt?: string;
    criticVerdict?: string;
    duration?: number;
}

export default function QADashboard() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [stats, setStats] = useState({ total: 0, successRate: 0, avgTime: 0 });

    useEffect(() => {
        fetch('http://localhost:3001/api/admin/qa-logs')
            .then(res => res.json())
            .then((data: { logs: Log[] }) => {
                const logs = data.logs.reverse(); // Newest first
                setLogs(logs);

                const total = logs.length;
                const success = logs.filter(l => l.type === 'GENERATION').length;
                const rate = total ? (success / total) * 100 : 0;
                const times = logs.filter(l => typeof l.duration === 'number').map(l => l.duration as number);
                const avg = times.reduce((a, b) => a + b, 0) / (times.length || 1);

                setStats({ total, successRate: rate, avgTime: avg / 1000 });
            })
            .catch(err => console.error('Failed to fetch logs', err));
    }, []);

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                🤖 AI Quality Assurance Dashboard
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="p-6 bg-zinc-900 border-zinc-800">
                    <h3 className="text-gray-400 mb-2">Total Generations</h3>
                    <p className="text-4xl font-bold">{stats.total}</p>
                </Card>
                <Card className="p-6 bg-zinc-900 border-zinc-800">
                    <h3 className="text-gray-400 mb-2">Success Rate</h3>
                    <p className={`text-4xl font-bold ${stats.successRate > 80 ? 'text-green-500' : 'text-red-500'}`}>
                        {stats.successRate.toFixed(1)}%
                    </p>
                </Card>
                <Card className="p-6 bg-zinc-900 border-zinc-800">
                    <h3 className="text-gray-400 mb-2">Avg Speed</h3>
                    <p className="text-4xl font-bold">{stats.avgTime.toFixed(1)}s</p>
                </Card>
            </div>

            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
                <h2 className="text-xl font-semibold mb-4 text-white">Live Incident Log</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-gray-500 border-b border-zinc-700">
                            <tr>
                                <th className="p-4">Time</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">Prompt</th>
                                <th className="p-4">Verdict</th>
                                <th className="p-4">Duration</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {logs.map((log, i) => (
                                <tr key={i} className="hover:bg-zinc-800/50 text-gray-300">
                                    <td className="p-4 text-sm font-mono text-gray-500">
                                        {new Date(log.timestamp).toLocaleTimeString()}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs ${log.type === 'ERROR' ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'}`}>
                                            {log.type}
                                        </span>
                                    </td>
                                    <td className="p-4 truncate max-w-xs" title={log.prompt}>
                                        {log.prompt || '-'}
                                    </td>
                                    <td className="p-4">
                                        {log.criticVerdict || '-'}
                                    </td>
                                    <td className="p-4 text-sm font-mono">
                                        {log.duration ? `${(log.duration / 1000).toFixed(1)}s` : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
