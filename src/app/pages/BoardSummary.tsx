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
import { DEFAULT_GOOGLE_SHEET_SOURCE_URL } from '../data/googleSheetTasks';
import { DashboardHeader } from '../components/DashboardHeader';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawRow {
  project: string;
  owner: string;
  developer: string;
  status: string;
}

// ─── RFC-4180 CSV parser ──────────────────────────────────────────────────────

const csvToRows = (csv: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let i = 0;
  while (i < csv.length) {
    if (csv[i] === '"') {
      i++;
      let value = '';
      while (i < csv.length) {
        if (csv[i] === '"') {
          if (csv[i + 1] === '"') { value += '"'; i += 2; }
          else { i++; break; }
        } else { value += csv[i]; i++; }
      }
      row.push(value.trim());
      if (csv[i] === ',') i++;
      else if (csv[i] === '\r' && csv[i + 1] === '\n') { i += 2; if (row.some(c => c.length > 0)) rows.push(row); row = []; }
      else if (csv[i] === '\n' || csv[i] === '\r') { i++; if (row.some(c => c.length > 0)) rows.push(row); row = []; }
    } else {
      let value = '';
      while (i < csv.length && csv[i] !== ',' && csv[i] !== '\n' && csv[i] !== '\r') { value += csv[i]; i++; }
      row.push(value.trim());
      if (csv[i] === ',') i++;
      else if (csv[i] === '\r' && csv[i + 1] === '\n') { i += 2; if (row.some(c => c.length > 0)) rows.push(row); row = []; }
      else if (csv[i] === '\n' || csv[i] === '\r') { i++; if (row.some(c => c.length > 0)) rows.push(row); row = []; }
    }
  }
  if (row.some(c => c.length > 0)) rows.push(row);
  return rows;
};

// ─── Header matching ──────────────────────────────────────────────────────────

const normalizeHeader = (v: string) =>
  v.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');

const findCol = (headers: string[], aliases: string[]): number => {
  const norm = aliases.map(normalizeHeader);
  return headers.findIndex(h => norm.includes(normalizeHeader(h)));
};

// ─── Fetch raw rows ───────────────────────────────────────────────────────────

const fetchRawRows = async (sourceUrl: string): Promise<RawRow[]> => {
  const match = sourceUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) throw new Error('Invalid Google Sheets URL.');
  const csvUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
  const res = await fetch(csvUrl);
  const csv = await res.text();
  const rows = csvToRows(csv);
  if (rows.length < 2) return [];
  const headers = rows[0];
  const projectCol = findCol(headers, ['project', 'project name', 'system']);
  const ownerCol   = findCol(headers, ['assigned pm', 'owner', 'pm']);
  const devCol     = findCol(headers, ['developer', 'assignee', 'resource']);
  const statusCol  = findCol(headers, ['status']);
  return rows.slice(1).map(row => ({
    project:   projectCol >= 0 ? (row[projectCol] ?? '') : '',
    owner:     ownerCol   >= 0 ? (row[ownerCol]   ?? '') : '',
    developer: devCol     >= 0 ? (row[devCol]     ?? '') : '',
    status:    statusCol  >= 0 ? (row[statusCol]  ?? '') : '',
  }));
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const projectCode = (name: string): string => {
  const idx = name.indexOf(' - ');
  return idx !== -1 ? name.substring(0, idx).trim() : name.trim();
};

const isOngoing = (s: string) =>
  ['on going', 'ongoing', 'in progress', 'on track'].includes(s.trim().toLowerCase());

const isNotYetStarted = (s: string) =>
  ['not yet started', 'not started'].includes(s.trim().toLowerCase());

// ─── Colour palette ───────────────────────────────────────────────────────────

const PRESET: Record<string, string> = {
  'on track':        '#059669',
  'completed':       '#1E3A8A',
  'at risk':         '#F59E0B',
  'delayed':         '#DC2626',
  'on going':        '#3B82F6',
  'ongoing':         '#3B82F6',
  'in progress':     '#3B82F6',
  'not yet started': '#94A3B8',
  'not started':     '#94A3B8',
  'on hold':         '#8B5CF6',
  'cancelled':       '#6B7280',
  'for testing':     '#0EA5E9',
  'for review':      '#F97316',
  'done':            '#1E3A8A',
};

const PALETTE = [
  '#3B82F6', '#10B981', '#F97316', '#A855F7',
  '#EC4899', '#14B8A6', '#EAB308', '#6366F1',
  '#0EA5E9', '#84CC16', '#F43F5E', '#06B6D4',
];

const buildColorMap = (statuses: string[]): Record<string, string> => {
  const map: Record<string, string> = {};
  let idx = 0;
  for (const s of statuses) {
    map[s] = PRESET[s.toLowerCase()] ?? PALETTE[idx++ % PALETTE.length];
  }
  return map;
};

const ONGOING_COLOR     = '#3B82F6';
const NOT_STARTED_COLOR = '#94A3B8';

// ─── Hover count badge with tooltip ──────────────────────────────────────────

function CountBadge({ count, codes, color }: { count: number; codes: string[]; color: string }) {
  if (count === 0) return <span className="text-[#9CA3AF] text-sm">—</span>;
  return (
    <div className="relative inline-block group">
      {/* Count pill */}
      <span
        className="inline-flex items-center justify-center min-w-[2rem] h-8 rounded-full px-2.5 text-sm font-semibold text-white cursor-default select-none"
        style={{ backgroundColor: color }}
      >
        {count}
      </span>

      {/* Tooltip — appears on hover, anchored above */}
      <div className="
        pointer-events-none absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2
        hidden group-hover:block
        min-w-[120px] rounded-lg bg-[#0F172A] px-3 py-2 shadow-xl
      ">
        {/* Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
          border-l-4 border-r-4 border-t-4
          border-l-transparent border-r-transparent border-t-[#0F172A]"
        />
        <ul className="space-y-1">
          {codes.map(code => (
            <li key={code} className="flex items-center gap-1.5 whitespace-nowrap">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs font-medium text-white">{code}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BoardSummary() {
  const [sheetUrl, setSheetUrl] = useState(DEFAULT_GOOGLE_SHEET_SOURCE_URL);
  const [rows, setRows] = useState<RawRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sheetError, setSheetError] = useState('');

  const projectNames = useMemo(
    () => Array.from(new Set(rows.map(r => r.project).filter(Boolean))),
    [rows],
  );
  const assignedPMs = useMemo(
    () => Array.from(new Set(rows.map(r => r.owner).filter(Boolean))),
    [rows],
  );

  const handleLoad = async () => {
    setIsLoading(true);
    setSheetError('');
    try {
      const data = await fetchRawRows(sheetUrl);
      if (data.length === 0) {
        setSheetError('No valid rows found in the sheet.');
      } else {
        setRows(data);
      }
    } catch (err) {
      setSheetError(err instanceof Error ? err.message : 'Failed to load Google Sheet.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void handleLoad(); }, []);

  const allStatuses = useMemo(() => {
    const seen = new Set<string>();
    for (const r of rows) {
      const s = r.status?.trim();
      if (s && s.toLowerCase() !== 'none') seen.add(s);
    }
    return Array.from(seen);
  }, [rows]);

  const colorMap = useMemo(() => buildColorMap(allStatuses), [allStatuses]);

  // ── Chart data ────────────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    if (!rows.length) return [];
    const byDev: Record<string, Record<string, number>> = {};
    for (const r of rows) {
      const dev = r.developer?.trim() || 'Unassigned';
      const status = r.status?.trim();
      if (!status || status.toLowerCase() === 'none') continue;
      if (!byDev[dev]) byDev[dev] = Object.fromEntries(allStatuses.map(s => [s, 0]));
      byDev[dev][status] = (byDev[dev][status] ?? 0) + 1;
    }
    return Object.entries(byDev)
      .map(([developer, counts]) => ({
        developer,
        ...counts,
      }))
      .sort((a, b) => {
        const sum = (x: Record<string, unknown>) =>
          allStatuses.reduce((s, k) => s + (Number(x[k]) || 0), 0);
        return sum(b) - sum(a);
      });
  }, [rows, allStatuses]);

  const yAxisWidth = useMemo(() => {
    const longestNameLength = chartData.reduce(
      (max, row) => Math.max(max, row.developer.length),
      0,
    );

    return Math.max(220, longestNameLength * 8 + 24);
  }, [chartData]);

  // ── Table data ────────────────────────────────────────────────────────────
  const tableData = useMemo(() => {
    if (!rows.length) return [];

    const byDev: Record<string, {
      developer: string;
      totalTasks: number;
      ongoingCodes: Set<string>;
      notStartedCodes: Set<string>;
    }> = {};

    for (const r of rows) {
      const dev    = r.developer?.trim() || 'Unassigned';
      const status = r.status?.trim() ?? '';
      const code   = r.project?.trim() ? projectCode(r.project.trim()) : '';

      if (!byDev[dev]) {
        byDev[dev] = {
          developer: dev,
          totalTasks: 0,
          ongoingCodes: new Set(),
          notStartedCodes: new Set(),
        };
      }

      byDev[dev].totalTasks += 1;
      if (code) {
        if (isOngoing(status))       byDev[dev].ongoingCodes.add(code);
        if (isNotYetStarted(status)) byDev[dev].notStartedCodes.add(code);
      }
    }

    return Object.values(byDev)
      .map(d => ({
        developer:       d.developer,
        totalTasks:      d.totalTasks,
        ongoingCodes:    Array.from(d.ongoingCodes).sort(),
        notStartedCodes: Array.from(d.notStartedCodes).sort(),
      }))
      .sort((a, b) => b.totalTasks - a.totalTasks);
  }, [rows]);

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

      <main className="mx-auto w-full max-w-[1320px] p-6 pt-[112px] lg:p-8 lg:pt-[120px]">

        {/* Google Sheets source */}
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-sm font-semibold text-slate-800">Google Sheets Source</p>
          <div className="flex gap-2">
            <Input
              value={sheetUrl}
              onChange={e => setSheetUrl(e.target.value)}
              placeholder="Paste Google Sheets URL"
            />
            <Button onClick={handleLoad} disabled={isLoading}>
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
            {/* Portfolio Health Chart */}
            <Card className="mb-6 shadow-[0px_8px_24px_rgba(0,0,0,0.05)]">
              <CardHeader>
                <CardTitle>Portfolio Health — Tasks by Developer</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <p className="text-sm text-[#6B7280]">No developer data available.</p>
                ) : (
                  <ResponsiveContainer
                    width="100%"
                    height={Math.max(300, chartData.length * 52)}
                  >
                    <BarChart
                      data={chartData}
                      layout="vertical"
                      margin={{ top: 4, right: 24, left: 16, bottom: 4 }}
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
                        width={yAxisWidth}
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
                      {allStatuses.map((status, i) => (
                        <Bar
                          key={status}
                          dataKey={status}
                          stackId="a"
                          fill={colorMap[status]}
                          name={status}
                          radius={
                            i === 0 ? [4, 0, 0, 4]
                            : i === allStatuses.length - 1 ? [0, 4, 4, 0]
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
                        <TableHead className="font-semibold w-[28rem] whitespace-normal">Developer</TableHead>
                        <TableHead className="font-semibold text-center w-24">Tasks</TableHead>
                        <TableHead className="font-semibold text-center w-36">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: ONGOING_COLOR }} />
                            Ongoing
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-center w-40">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: NOT_STARTED_COLOR }} />
                            Not Yet Started
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-sm text-[#6B7280] py-8">
                            No data loaded yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        tableData.map((row, idx) => (
                          <TableRow key={idx} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-[#111827] py-3 whitespace-normal break-words">
                              {row.developer}
                            </TableCell>
                            <TableCell className="text-center py-3">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-sm font-semibold text-[#111827]">
                                {row.totalTasks}
                              </span>
                            </TableCell>
                            <TableCell className="text-center py-3">
                              <CountBadge
                                count={row.ongoingCodes.length}
                                codes={row.ongoingCodes}
                                color={ONGOING_COLOR}
                              />
                            </TableCell>
                            <TableCell className="text-center py-3">
                              <CountBadge
                                count={row.notStartedCodes.length}
                                codes={row.notStartedCodes}
                                color={NOT_STARTED_COLOR}
                              />
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
