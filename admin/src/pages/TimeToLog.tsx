import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import api from '@/services/api';
import StatCard from '@/components/StatCard';
import ChartCard from '@/components/ChartCard';

interface TimeToLogData {
  medianMs: number;
  p95Ms: number;
  avgMs: number;
  byInputMethod: { method: string; medianMs: number; avgMs: number; count: number }[];
  trend: { date: string; avgMs: number; count: number }[];
}

function formatMs(ms: number): string {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function formatMsShort(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function capitalizeMethod(method: string): string {
  return method.charAt(0).toUpperCase() + method.slice(1);
}

export default function TimeToLog() {
  const [data, setData] = useState<TimeToLogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<TimeToLogData>('/analytics/time-to-log', { params: { period: '30d' } })
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load time-to-log data.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
        {error || 'No data available.'}
      </div>
    );
  }

  const trendData = data.trend.map((d) => ({
    date: formatDate(d.date),
    avgSeconds: Number((d.avgMs / 1000).toFixed(1)),
    count: d.count,
  }));

  const methodData = data.byInputMethod.map((d) => ({
    method: capitalizeMethod(d.method),
    medianSeconds: Number((d.medianMs / 1000).toFixed(1)),
    avgSeconds: Number((d.avgMs / 1000).toFixed(1)),
    count: d.count,
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Time to Log</h1>
        <p className="text-sm text-gray-500 mt-1">How quickly users log their meals</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <StatCard title="Median Time" value={formatMs(data.medianMs)} />
        <StatCard title="P95 Time" value={formatMs(data.p95Ms)} />
        <StatCard title="Average Time" value={formatMs(data.avgMs)} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Average Time-to-Log Trend" subtitle="Last 30 days (seconds)">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: 'Seconds', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#9ca3af' } }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: number) => [`${value}s`, 'Avg Time']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avgSeconds"
                  name="Avg Time (s)"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#22c55e' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Time by Input Method" subtitle="Median and average time per method">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={methodData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  label={{ value: 'Seconds', position: 'insideBottom', offset: -5, style: { fontSize: 12, fill: '#9ca3af' } }}
                />
                <YAxis
                  type="category"
                  dataKey="method"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: number) => [`${value}s`]}
                />
                <Legend />
                <Bar dataKey="medianSeconds" name="Median (s)" fill="#22c55e" radius={[0, 4, 4, 0]} />
                <Bar dataKey="avgSeconds" name="Avg (s)" fill="#86efac" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Method Details Table */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Input Method Details</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Median</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Average</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.byInputMethod.map((item) => (
              <tr key={item.method} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{capitalizeMethod(item.method)}</td>
                <td className="px-6 py-4 text-sm text-gray-600 text-right">{formatMsShort(item.medianMs)}</td>
                <td className="px-6 py-4 text-sm text-gray-600 text-right">{formatMsShort(item.avgMs)}</td>
                <td className="px-6 py-4 text-sm text-gray-600 text-right">{item.count.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
