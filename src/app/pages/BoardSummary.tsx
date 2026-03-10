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
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
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
import {
  DEFAULT_GOOGLE_SHEET_SOURCE_URL,
  fetchTasksFromGoogleSheet,
} from '../data/googleSheetTasks';
import { DashboardHeader } from '../components/DashboardHeader';
import type { Task } from '../data/mockData';

// ─── Colour palette for dynamic statuses ─────────────────────────────────────
// Known statuses get a fixed brand colour; any unknown value from the sheet
// gets a colour assigned from this rotating palette.

const KNOWN_STATUS_COLORS: Record<string, { bar: string; badge: string }> = {
  'on track':        { bar: '#059669', badge: 'bg-[#059669] text-white hover:bg-[#047857]' },
  'completed':       { bar: '#1E3A8A', badge: 'bg-[#1E3A8A] text-white hover:bg-[#1e40af]' },
  'at risk':         { bar: '#F59E0B', badge: 'bg-[#F59E0B] text-white hover:bg-[#D97706]' },
  'delayed':         { bar: '#DC2626', badge: 'bg-[#DC2626] text-white hover:bg-[#B91C1C]' },
  'not yet started': { bar: '#94A3B8', badge: 'bg-[#94A3B8] text-white hover:bg-[#64748B]' },
  'in progress':     { bar: '#3B82F6', badge: 'bg-[#3B82F6] text-white hover:bg-[#2563EB]' },
  'on hold':         { bar: '#8B5CF6', badge: 'bg-[#8B5CF6] text-white hover:bg-[#7C3AED]' },
  'cancelled':       { bar: '#6B7280', badge: 'bg-[#6B7280] text-white hover:bg-[#4B5563]' },
};

const FALLBACK_PALETTE = [
  '#0EA5E9', '#10B981', '#F97316', '#A855F7',
  '#EC4899', '#14B8A6', '#EAB308', '#6366F1',
];

// Assign colours dynamically for any status not in KNOWN_STATUS_COLORS
const buildStatusColorMap = (statuses: string[]): Record<string, { bar: string; badge: string }> => {
  const map: Record<string, { bar: string; badge: string }> = {};
  let fallbackIdx = 0;

  for (const status of statuses) {
    const key = status.toLowerCase();
    if (KNOWN_STATUS_COLORS[key]) {
      map[status] = KNOWN_STATUS_COLORS[key];
    } else if (!map[status]) {
      const color = FALLBACK_PALETTE[fallbackIdx % FALLBACK_PALETTE.length];
      fallbackIdx++;
      map[status] = {
        bar: color,
        badge: `bg-[${color}] text-white`,
      };
    }
  }
  return map;
};

// ─── "none" / empty → dash ────────────────────────────────────────────────────

const displayValue = (value: string | number | undefined | null): string => {
  if (value === undefined || value === null) return '—';
  const str = String(value).trim().toLowerCase();
  if (str === '' || str === 'none' || str === 'n/a') return '—';
  return String(value);
};

// ─── Component ────────────────────────────────────────────────────────────────

export function BoardSummary() {
  const [sheetUrl, setSheetUrl] = useState(DEFAULT_GOOGLE_SHEET_SOURCE_URL);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sheetError, setSheetError] = useState('');

  const projectNames = useMemo(
    () => Array.from(new Set(allTasks.map((t) => t.project))),
    [allTasks],
  );
  const assignedPMs = useMemo(
    () => Array.from(new Set(allTasks.map((t) => t.owner))),
    [allTasks],
  );

  const handleLoadSheet = async () => {
    setIsLoading(true);
    setSheetError('');
    try {
      const tasks = await fetchTasksFromGoogleSheet(sheetUrl);
      if (tasks.length === 0) {
        setSheetError('No valid rows found in the sheet.');
      } else {
        setAllTasks(tasks);
      }
    } catch (err) {
      setSheetError(err instanceof Error ? err.message : 'Failed to load Google Sheet.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void handleLoadSheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Collect every unique status present in the sheet ─────────────────────
  const allStatuses = useMemo(() => {
    const seen = new Set<string>();
    for (const task of allTasks) {
      const s = task.status?.trim() ?? '';
      if (s && s.toLowerCase() !== 'none') seen.add(s);
    }
    return Array.from(seen);
  }, [allTasks]);

  // ── Build colour map from real sheet statuses ─────────────────────────────
  const statusColorMap = useMemo(
    () => buildStatusColorMap(allStatuses),
    [allStatuses],
  );

  // ── Stacked bar: task count per developer, one segment per sheet status ───
  const developerChartData = useMemo(() => {
    if (!allTasks.length) return [];

    const byDev: Record<string, Record<string, number>> = {};

    for (const task of allTasks) {
      const dev = task.developer?.trim() || 'Unassigned';
      const status = task.status?.trim() || '';
      if (!status || status.toLowerCase() === 'none') continue;

      if (!byDev[dev]) {
        // Initialise all known statuses to 0 so Recharts renders every segment
        byDev[dev] = Object.fromEntries(allStatuses.map((s) => [s, 0]));
      }
      byDev[dev][status] = (byDev[dev][status] ?? 0) + 1;
    }

    return Object.entries(byDev)
      .map(([developer, counts]) => ({
        developer: developer.length > 18 ? developer.substring(0, 18) + '…' : developer,
        ...counts,
      }))
      .sort((a, b) => {
        const total = (x: Record<string, unknown>) =>
          allStatuses.reduce((s, k) => s + ((x[k] as number) ?? 0), 0);
        return total(b) - total(a);
      });
  }, [allTasks, allStatuses]);

  // ── Table: one row per project, unique statuses from sheet ───────────────
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
      const rawStatus = task.status?.trim() ?? '';
      if (rawStatus && rawStatus.toLowerCase() !== 'none') {
        byProject[proj].statuses.push(rawStatus);
      }
    }

    return Object.values(byProject).map((p) => ({
      ...p,
      statuses: Array.from(new Set(p.statuses)),
    }));
  }, [allTasks]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <DashboardHeader
        selectedProject="all"
        selectedAssignedPM="all"
        selectedDateRange="all"
        onProjectChange={() => {}}
        onAssignedPMChange={() => {}}
        onDateRangeChange={() => {}}
        projects={projectNames}
        assignedPMs={assignedPMs}
      />

      <main className="mx-auto w-full max-w-[1320px] p-6 lg:p-8">

        {/* Google Sheets source — same pattern as ExecutiveOverview */}
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-sm font-semibold text-slate-800">Google Sheets Source</p>
          <div className="flex gap-2">
            <Input
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="Paste Google Sheets URL"
            />
            <Button onClick={handleLoadSheet} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Load Sheet'}
            </Button>
          </div>
          {sheetError && <p className="mt-2 text-sm text-red-600">{sheetError}</p>}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center h-64 text-[#6B7280] text-sm">
            Loading portfolio data…
          </div>
        )}

        {!isLoading && (
          <>
            {/* Portfolio Health Chart — bars built from real sheet statuses */}
            <Card className="mb-6 shadow-[0px_8px_24px_rgba(0,0,0,0.05)]">
              <CardHeader>
                <CardTitle>Portfolio Health — Tasks by Developer</CardTitle>
              </CardHeader>
              <CardContent>
                {developerChartData.length === 0 ? (
                  <p className="text-sm text-[#6B7280]">No developer data available.</p>
                ) : (
                  <ResponsiveContainer
                    width="100%"
                    height={Math.max(300, developerChartData.length * 52)}
                  >
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
                      <Legend wrapperStyle={{ paddingTop: 12, fontSize: 13 }} />

                      {/* One <Bar> per unique status found in the sheet */}
                      {allStatuses.map((status, i) => (
                        <Bar
                          key={status}
                          dataKey={status}
                          stackId="a"
                          fill={statusColorMap[status]?.bar ?? FALLBACK_PALETTE[i % FALLBACK_PALETTE.length]}
                          name={status}
                          radius={
                            i === 0
                              ? [4, 0, 0, 4]
                              : i === allStatuses.length - 1
                              ? [0, 4, 4, 0]
                              : [0, 0, 0, 0]
                          }
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Portfolio Health Table */}
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
                      {portfolioTableData.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center text-sm text-[#6B7280] py-8"
                          >
                            No data loaded yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        portfolioTableData.map((row, idx) => (
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
                                    <Badge
                                      key={s}
                                      className={
                                        statusColorMap[s]?.badge ?? 'bg-gray-200 text-gray-600'
                                      }
                                      style={
                                        // Fallback colours assigned at runtime won't be in
                                        // Tailwind's purged CSS, so apply them inline instead
                                        !KNOWN_STATUS_COLORS[s.toLowerCase()]
                                          ? {
                                              backgroundColor:
                                                statusColorMap[s]?.bar ?? '#6B7280',
                                              color: '#fff',
                                            }
                                          : undefined
                                      }
                                    >
                                      {s}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[#9CA3AF]">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
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
