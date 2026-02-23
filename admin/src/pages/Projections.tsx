import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
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

interface ProjectionUsage {
  usersWhoCheckedPercentage: number;
  avgViewsPerWeek: number;
  usersWithActiveGoal: number;
  statusDistribution: { status: string; count: number; percentage: number }[];
  weeklyViews: { week: string; views: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  on_track: '#22c55e',
  ahead: '#3b82f6',
  behind: '#f59e0b',
  at_risk: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  on_track: 'On Track',
  ahead: 'Ahead',
  behind: 'Behind',
  at_risk: 'At Risk',
};

function formatWeek(weekStr: string): string {
  const date = new Date(weekStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Projections() {
  const [data, setData] = useState<ProjectionUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<ProjectionUsage>('/analytics/projection-usage')
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load projection data.');
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

  const pieData = data.statusDistribution.map((d) => ({
    name: STATUS_LABELS[d.status] || d.status,
    value: d.count,
    percentage: d.percentage,
    color: STATUS_COLORS[d.status] || '#9ca3af',
  }));

  const weeklyData = data.weeklyViews.map((d) => ({
    week: formatWeek(d.week),
    views: d.views,
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Projections</h1>
        <p className="text-sm text-gray-500 mt-1">Goal projection engagement and status</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="% Users Who Check"
          value={`${data.usersWhoCheckedPercentage.toFixed(1)}%`}
        />
        <StatCard
          title="Avg Views / Week"
          value={data.avgViewsPerWeek.toFixed(1)}
        />
        <StatCard
          title="Users With Active Goal"
          value={data.usersWithActiveGoal.toLocaleString()}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Projection Status Distribution" subtitle="Current status of all user projections">
          <div className="h-72 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(0)}%`}
                  labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: number, name: string) => [value.toLocaleString(), name]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Weekly Projection Views" subtitle="How often users check their projections">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="views"
                  name="Views"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#22c55e' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
