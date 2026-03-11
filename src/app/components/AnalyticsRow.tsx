import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Task, completionTrend } from '../data/mockData';

interface AnalyticsRowProps {
  tasks: Task[];
}

// ─── Bucket raw sheet statuses into the 3 display groups ─────────────────────

const isCompleted = (s: string) =>
  ['completed', 'done'].includes(s.trim().toLowerCase());

const isOngoing = (s: string) =>
  ['ongoing', 'on going', 'in progress', 'on track', 'at risk', 'delayed']
    .includes(s.trim().toLowerCase());

const isNotYetStarted = (s: string) =>
  ['not yet started', 'not started'].includes(s.trim().toLowerCase());

const STATUS_BUCKETS = [
  { name: 'Completed',       color: '#1E3A8A', match: isCompleted      },
  { name: 'Ongoing',         color: '#3B82F6', match: isOngoing        },
  { name: 'Not Yet Started', color: '#94A3B8', match: isNotYetStarted  },
] as const;

export function AnalyticsRow({ tasks }: AnalyticsRowProps) {

  // ── Status distribution — reads rawStatus so sheet values pass through ────
  const statusData = STATUS_BUCKETS.map(bucket => ({
    name:  bucket.name,
    color: bucket.color,
    value: tasks.filter(t => bucket.match(t.rawStatus ?? t.status ?? '')).length,
  }));

  // ── Tasks by PM ───────────────────────────────────────────────────────────
  const pmCounts = tasks.reduce((acc, task) => {
    const pm = task.owner?.trim();
    if (pm) acc[pm] = (acc[pm] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const assignedPMData = Object.entries(pmCounts).map(([name, count]) => ({
    name: name.split(' ')[0],
    tasks: count,
  }));

  return (
    <div className="grid grid-cols-3 gap-6 mb-6">

      {/* Status Distribution Donut */}
      <Card className="shadow-[0px_8px_24px_rgba(0,0,0,0.05)]">
        <CardHeader>
          <CardTitle>Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: 8,
                  fontSize: 13,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 mt-4">
            {statusData.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-[#6B7280]">{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-[#111827]">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tasks by Assigned PM */}
      <Card className="shadow-[0px_8px_24px_rgba(0,0,0,0.05)]">
        <CardHeader>
          <CardTitle>Tasks by Assigned PM</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={assignedPMData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: 8,
                  fontSize: 13,
                }}
              />
              <Bar dataKey="tasks" fill="#1E3A8A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Portfolio Completion Trend */}
      <Card className="shadow-[0px_8px_24px_rgba(0,0,0,0.05)]">
        <CardHeader>
          <CardTitle>Portfolio Completion Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={completionTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: 8,
                  fontSize: 13,
                }}
              />
              <Line
                type="monotone"
                dataKey="completion"
                stroke="#059669"
                strokeWidth={3}
                dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

    </div>
  );
}
