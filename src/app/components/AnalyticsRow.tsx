import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Task, completionTrend } from '../data/mockData';

interface AnalyticsRowProps {
  tasks: Task[];
}

export function AnalyticsRow({ tasks }: AnalyticsRowProps) {
  // Status distribution data
  const statusData = [
    { name: 'Completed', value: tasks.filter(t => t.status === 'Completed').length, color: '#059669' },
    { name: 'On Track', value: tasks.filter(t => t.status === 'On Track').length, color: '#1E3A8A' },
    { name: 'At Risk', value: tasks.filter(t => t.status === 'At Risk').length, color: '#F59E0B' },
    { name: 'Delayed', value: tasks.filter(t => t.status === 'Delayed').length, color: '#DC2626' }
  ];

  // Tasks by owner data
  const ownerTaskCounts = tasks.reduce((acc, task) => {
    acc[task.owner] = (acc[task.owner] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const ownerData = Object.entries(ownerTaskCounts).map(([name, count]) => ({
    name: name.split(' ')[0], // First name only
    tasks: count
  }));

  return (
    <div className="grid grid-cols-3 gap-6 mb-6">
      {/* Status Distribution Donut Chart */}
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
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-[#6B7280]">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tasks by Owner Bar Chart */}
      <Card className="shadow-[0px_8px_24px_rgba(0,0,0,0.05)]">
        <CardHeader>
          <CardTitle>Tasks by Owner</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={ownerData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="tasks" fill="#1E3A8A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Completion Trend Line Chart */}
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
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="completion" 
                stroke="#059669" 
                strokeWidth={2}
                dot={{ fill: '#059669', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 text-center">
            <span className="text-sm text-[#6B7280]">
              Average completion rate: <span className="font-semibold text-[#059669]">+4.5%/month</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
