import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { DEFAULT_GOOGLE_SHEET_SOURCE_URL, fetchTasksFromGoogleSheet } from '../data/googleSheetTasks';
import { AlertTriangle } from 'lucide-react';
import type { Task } from '../data/mockData';

// ─── Status colour helpers ────────────────────────────────────────────────────

// Bar colours per status segment (must match STATUS_COLORS keys order)
const STATUS_ORDER = ['Completed', 'On Track', 'At Risk', 'Delayed'] as const;

const STATUS_BAR_COLORS: Record<string, string> = {
  'Completed': '#1E3A8A',
  'On Track':  '#059669',
  'At Risk':   '#F59E0B',
  'Delayed':   '#DC2626',
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'On Track':  return 'bg-[#059669] text-white hover:bg-[#047857]';
    case 'Completed': return 'bg-[#1E3A8A] text-white hover:bg-[#1e40af]';
    case 'At Risk':   return 'bg-[#F59E0B] text-white hover:bg-[#D97706]';
    case 'Delayed':   return 'bg-[#DC2626] text-white hover:bg-[#B91C1C]';
    default:          return 'bg-gray-200 text-gray-600';
  }
};

// ─── "none" → dash helper ─────────────────────────────────────────────────────

const displayValue = (value: string | number | undefined | null): string => {
  if (value === undefined || value === null) return '—';
  const str = String(value).trim().toLowerCase();
  if (str === '' || str === 'none' || str === 'n/a') return '—';
  return String(value);
};

// ─── Component ────────────────────────────────────────────────────────────────

export function BoardSummary() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Load tasks from Google Sheet on mount
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setLoadError('');
      try {
        const tasks = await fetchTasksFromGoogleSheet(DEFAULT_GOOGLE_SHEET_SOURCE_URL);
        setAllTasks(tasks);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load data.');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  // ── Stacked bar: tasks per developer, segmented by status ──────────────────
  const developerChartData = useMemo(() => {
    if (!allTasks.length) return [];

    // Group by developer
    const byDev: Record<string, Record<string, number>> = {};

    for (const task of allTasks) {
      const dev = task.developer?.trim() || 'Unassigned';
      const status = task.status ?? 'On Track';

      if (!byDev[dev]) {
        byDev[dev] = { Completed: 0, 'On Track': 0, 'At Risk': 0, Delayed: 0 };
      }
      byDev[dev][status] = (byDev[dev][status] ?? 0) + 1;
    }

    return Object.entries(byDev)
      .map(([developer, counts]) => ({
        developer:
          developer.length > 18 ? developer.substring(0, 18) + '…' : developer,
        ...counts,
      }))
      .sort((a, b) => {
        const totalA = STATUS_ORDER.reduce((s, k) => s + ((a as any)[k] ?? 0), 0);
        const totalB = STATUS_ORDER.reduce((s, k) => s + ((b as any)[k] ?? 0), 0);
        return totalB - totalA;
      });
  }, [allTasks]);

  // ── Portfolio Health Table: one row per unique project ────────────────────
  const portfolioTableData = useMemo(() => {
    if (!allTasks.length) return [];

    const byProject: Record<
      string,
      { project: string; owner: string; totalTasks: number; statuses: string[] }
    > = {};

    for (const task of allTasks) {
      const proj = task.project?.trim() || 'Unknown';
      if (!byProject[proj]) {
        byProject[proj] = {
          project: proj,
          owner: task.owner ?? '',
          totalTasks: 0,
          statuses: [],
        };
      }
      byProject[proj].totalTasks += 1;
      // Collect all raw statuses from the sheet for this project
      const rawStatus = task.status?.trim() ?? '';
      if (rawStatus && rawStatus.toLowerCase() !== 'none') {
        byProject[proj].statuses.push(rawStatus);
      }
    }

    return Object.values(byProject).map((p) => ({
      project: p.project,
      owner: p.owner,
      totalTasks: p.totalTasks,
      // Unique statuses present in the sheet for this project
      statuses: Array.from(new Set(p.statuses)),
    }));
  }, [allTasks]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="bg-[#0F172A] text-white h-[88px] px-8 flex items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#DC2626] rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm text-gray-400">PMO Dashboard</div>
            <h1 className="text-xl font-semibold">Board Summary</h1>
          </div>
        </div>
      </header>

      <main className="p-8">
        {/* Loading / Error state */}
        {isLoading && (
          <div className="flex items-center justify-center h-64 text-[#6B7280]">
            Loading portfolio data…
          </div>
        )}

        {!isLoading && loadError && (
          <div className="rounded-md bg-red-50 border border-red-200 p-4 text-red-700 text-sm mb-6">
            {loadError}
          </div>
        )}

        {!isLoading && !loadError && (
          <>
            {/* ── Portfolio Health Chart ─────────────────────────────────── */}
            <Card className="mb-6 shadow-[0px_8px_24px_rgba(0,0,0,0.05)]">
              <CardHeader>
                <CardTitle>Portfolio Health — Tasks by Developer</CardTitle>
              </CardHeader>
              <CardContent>
                {developerChartData.length === 0 ? (
                  <p className="text-sm text-[#6B7280]">No developer data available.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(300, developerChartData.length * 48)}>
                    <BarChart
                      data={developerChartData}
                      layout="vertical"
                      margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="developer"
                        width={160}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#fff',
                          border: '1px solid #E5E7EB',
                          borderRadius: 8,
                          fontSize: 13,
                        }}
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: 12, fontSize: 13 }}
                      />
                      {STATUS_ORDER.map((status) => (
                        <Bar
                          key={status}
                          dataKey={status}
                          stackId="a"
                          fill={STATUS_BAR_COLORS[status]}
                          name={status}
                          radius={
                            status === 'Delayed'
                              ? [0, 4, 4, 0]
                              : status === 'Completed'
                              ? [4, 0, 0, 4]
                              : [0, 0, 0, 0]
                          }
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* ── Portfolio Health Table ─────────────────────────────────── */}
            <Card className="shadow-[0px_8px_24px_rgba(0,0,0,0.05)]">
              <CardHeader>
                <CardTitle>Portfolio Health Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-gray-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Project</TableHead>
                        <TableHead className="font-semibold">PM / Owner</TableHead>
                        <TableHead className="font-semibold text-center">Tasks</TableHead>
                        <TableHead className="font-semibold text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {portfolioTableData.map((row, idx) => (
                        <TableRow key={idx} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            {displayValue(row.project)}
                          </TableCell>
                          <TableCell>{displayValue(row.owner)}</TableCell>
                          <TableCell className="text-center">{row.totalTasks}</TableCell>
                          <TableCell className="text-center">
                            {row.statuses.length > 0 ? (
                              <div className="flex flex-wrap gap-1 justify-center">
                                {row.statuses.map((s) => (
                                  <Badge key={s} className={getStatusBadgeClass(s)}>
                                    {s}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[#9CA3AF]">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

// ─── Utility helpers (file-scoped, no export needed) ─────────────────────────

// Dynamic badge colouring — maps known statuses; falls back to gray for any
// custom status value coming from the Google Sheet.
