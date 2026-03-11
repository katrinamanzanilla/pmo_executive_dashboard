import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  LineChart, Line, Legend, Tooltip,
} from 'recharts';
import { Task, completionTrend } from '../data/mockData';

interface AnalyticsRowProps {
  tasks: Task[];
}

// ─── Status buckets ───────────────────────────────────────────────────────────

const isCompleted     = (s: string) => ['completed', 'done'].includes(s.trim().toLowerCase());
const isOngoing       = (s: string) => ['ongoing', 'on going', 'in progress', 'on track', 'at risk', 'delayed'].includes(s.trim().toLowerCase());
const isNotYetStarted = (s: string) => ['not yet started', 'not started'].includes(s.trim().toLowerCase());

const STATUS_BUCKETS = [
  { name: 'Completed',       color: '#1E3A8A', match: isCompleted      },
  { name: 'Ongoing',         color: '#3B82F6', match: isOngoing        },
  { name: 'Not Yet Started', color: '#94A3B8', match: isNotYetStarted  },
] as const;

// ─── Soft, eye-friendly PM colors ────────────────────────────────────────────
// Assigned per unique full name so the same PM always gets the same color.

const PM_PALETTE = [
  '#7EB8D4', // soft blue
  '#85C9A5', // sage green
  '#F0A8A0', // dusty rose
  '#B5A9D4', // soft lavender
  '#F5C87A', // warm amber
  '#89C9C9', // teal mist
  '#F0B87A', // soft peach
  '#A8C4A2', // muted green
  '#C4A8C4', // soft mauve
  '#A8B8D4', // periwinkle
];

const buildPmColorMap = (pmNames: string[]): Record<string, string> => {
  const map: Record<string, string> = {};
  pmNames.forEach((name, i) => {
    map[name] = PM_PALETTE[i % PM_PALETTE.length];
  });
  return map;
};

// ─── Custom tooltip for Tasks by PM chart ────────────────────────────────────

interface PmTooltipProps {
  active?: boolean;
  payload?: { payload: PmBarEntry }[];
}

interface PmBarEntry {
  fullName: string;
  tasks: number;
  completed: number;
  ongoing: number;
  notYetStarted: number;
  color: string;
}

function PmTooltip({ active, payload }: PmTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E5E7EB',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 13,
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      minWidth: 190,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: d.color, flexShrink: 0 }} />
        <span style={{ fontWeight: 600, color: '#111827' }}>{d.fullName}</span>
      </div>
      <div style={{ color: '#6B7280', marginBottom: 6 }}>
        Total tasks: <strong style={{ color: '#111827' }}>{d.tasks}</strong>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[
          { label: 'Completed',       value: d.completed,     color: '#1E3A8A' },
          { label: 'Ongoing',         value: d.ongoing,       color: '#3B82F6' },
          { label: 'Not Yet Started', value: d.notYetStarted, color: '#94A3B8' },
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: row.color }} />
              <span style={{ color: '#6B7280' }}>{row.label}</span>
            </div>
            <span style={{ fontWeight: 600, color: '#111827' }}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AnalyticsRow({ tasks }: AnalyticsRowProps) {

  // Status distribution
  const statusData = STATUS_BUCKETS.map(bucket => ({
    name:  bucket.name,
    color: bucket.color,
    value: tasks.filter(t => bucket.match(t.rawStatus ?? t.status ?? '')).length,
  }));

  // Unique PMs — full name, deduped, preserving order of first appearance
  const uniquePMs = Array.from(
    new Map(
      tasks
        .map(t => t.owner?.trim())
        .filter(Boolean)
        .map(name => [name, name])
    ).values()
  ) as string[];

  const pmColorMap = buildPmColorMap(uniquePMs);

  // Build per-PM bar data
  const pmBarData: PmBarEntry[] = uniquePMs.map(fullName => {
    const pmTasks = tasks.filter(t => t.owner?.trim() === fullName);
    const raw = (t: Task) => t.rawStatus ?? t.status ?? '';
    return {
      fullName,
      // Show first name only on the X axis label
      name:          fullName.split(' ')[0],
      tasks:         pmTasks.length,
      completed:     pmTasks.filter(t => isCompleted(raw(t))).length,
      ongoing:       pmTasks.filter(t => isOngoing(raw(t))).length,
      notYetStarted: pmTasks.filter(t => isNotYetStarted(raw(t))).length,
      color:         pmColorMap[fullName],
    };
  });

  return (
    <div className="grid grid-cols-3 gap-6 mb-6">

      {/* Status Distribution Donut */}
      <Card className="shadow-[0px_8px_24px_rgba(0,0,0,0.05)]">
        <CardHeader><CardTitle>Status Distribution</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%" cy="50%"
                innerRadius={60} outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 mt-4">
            {statusData.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
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
        <CardHeader><CardTitle>Tasks by Assigned PM</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={pmBarData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} allowDecimals={false} />
              <Tooltip content={<PmTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Bar dataKey="tasks" radius={[4, 4, 0, 0]}>
                {pmBarData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* PM color legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
            {pmBarData.map(pm => (
              <div key={pm.fullName} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: pm.color }} />
                <span className="text-xs text-[#6B7280]">{pm.fullName.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Completion Trend */}
      <Card className="shadow-[0px_8px_24px_rgba(0,0,0,0.05)]">
        <CardHeader><CardTitle>Portfolio Completion Trend</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={completionTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }} />
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
