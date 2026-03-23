import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { DEFAULT_GOOGLE_SHEET_SOURCE_URL } from '../data/googleSheetTasks';
import { DashboardHeader } from '../components/DashboardHeader';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawRow {
  project: string;
  owner: string;
  developer: string;
  status: string;
 startDate: string;
  endDate: string;
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

const normalizeDate = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const numeric = Number(trimmed);
  if (!Number.isNaN(numeric) && /^\d+(?:\.\d+)?$/.test(trimmed)) {
    const d = new Date(Date.UTC(1899, 11, 30 + Math.floor(numeric)));
    return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  }

  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) return direct.toISOString().slice(0, 10);

  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const [, a, b, y] = slashMatch.map(Number);
    const year = y < 100 ? 2000 + y : y;
    const month = a > 12 ? b : a;
    const day = a > 12 ? a : b;
    const d = new Date(Date.UTC(year, month - 1, day));
    return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  }

  const dashMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if (dashMatch) {
    const [, a, b, y] = dashMatch.map(Number);
    const year = y < 100 ? 2000 + y : y;
    const month = a > 12 ? b : a;
    const day = a > 12 ? a : b;
    const d = new Date(Date.UTC(year, month - 1, day));
    return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  }

  return '';
};

const toMonthKey = (dateStr: string): string => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
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
  const startDateCol = findCol(headers, ['start date', 'target start', 'planned start', 'start']);
  const endDateCol = findCol(headers, ['end', 'target end', 'planned end', 'finish date']);
  return rows.slice(1).map(row => ({
    project:   projectCol >= 0 ? (row[projectCol] ?? '') : '',
    owner:     ownerCol   >= 0 ? (row[ownerCol]   ?? '') : '',
    developer: (devCol >= 0 ? (row[devCol] ?? '') : '').replace(/^"|"$/g, '').trim(),
    status:    statusCol  >= 0 ? (row[statusCol]  ?? '') : '',
    startDate: normalizeDate(startDateCol >= 0 ? (row[startDateCol] ?? '') : ''),
    endDate: normalizeDate(endDateCol >= 0 ? (row[endDateCol] ?? '') : ''),
  }));
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const projectCode = (name: string): string => {
  const idx = name.indexOf(' - ');
  return idx !== -1 ? name.substring(0, idx).trim() : name.trim();
};

const isOngoing      = (s: string) => ['on going', 'ongoing', 'in progress', 'on track'].includes(s.trim().toLowerCase());
const isNotYetStarted = (s: string) => ['not yet started', 'not started'].includes(s.trim().toLowerCase());
const isDelayed      = (s: string) => s.trim().toLowerCase() === 'delayed';
const isCompleted    = (s: string) => ['completed', 'done'].includes(s.trim().toLowerCase());

// ─── Colour palette ───────────────────────────────────────────────────────────

const PRESET: Record<string, string> = {
  'on track':        '#059669',
  'completed':       '#1E3A8A',
  'at risk':         '#F59E0B',
  'delayed':         '#DC2626',
  'on going':        '#3B82F6',
  'ongoing':         '#3B82F6',
  'in progress':     '#3B82F6',
@@ -224,147 +272,191 @@ function CountBadge({ count, codes, color }: { count: number; codes: string[]; c
        {count}
      </span>
      {tooltipStyle && (
        <div style={tooltipStyle}>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {codes.map(code => (
              <li key={code} style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                <span style={{ color: '#111827', fontWeight: 500 }}>{code}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BoardSummary() {
  const [sheetUrl, setSheetUrl] = useState(DEFAULT_GOOGLE_SHEET_SOURCE_URL);
  const [rows, setRows] = useState<RawRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sheetError, setSheetError] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedAssignedPM, setSelectedAssignedPM] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');

  const projectNames = useMemo(() => Array.from(new Set(rows.map(r => r.project).filter(Boolean))), [rows]);
  const assignedPMs  = useMemo(() => Array.from(new Set(rows.map(r => r.owner).filter(Boolean))), [rows]);

  const handleLoad = async () => {
    setIsLoading(true);
    setSheetError('');
    try {
      const data = await fetchRawRows(sheetUrl);
      if (data.length === 0) setSheetError('No valid rows found in the sheet.');
      else {
        setRows(data);
        setSelectedProject('all');
        setSelectedAssignedPM('all');
        setSelectedMonth('all');
        setSelectedYear('all');
      }
    } catch (err) {
      setSheetError(err instanceof Error ? err.message : 'Failed to load Google Sheet.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void handleLoad(); }, []);

  const filteredRows = useMemo(() => (
    rows.filter((row) => {
      const projectMatches = selectedProject === 'all' || row.project === selectedProject;
      const assignedPMMatches = selectedAssignedPM === 'all' || row.owner === selectedAssignedPM;

      let monthMatches = true;
      if (selectedMonth !== 'all' || selectedYear !== 'all') {
        const startKey = toMonthKey(row.startDate);
        const endKey = toMonthKey(row.endDate);

        if (startKey && endKey) {
          const monthKeys: string[] = [];
          let cursor = startKey;
          while (cursor <= endKey) {
            monthKeys.push(cursor);
            const [year, month] = cursor.split('-').map(Number);
            cursor = month === 12
              ? `${year + 1}-01`
              : `${year}-${String(month + 1).padStart(2, '0')}`;
            if (monthKeys.length > 36) break;
          }

          monthMatches = monthKeys.some((key) => {
            const [year, month] = key.split('-');
            const yearMatches = selectedYear === 'all' || year === selectedYear;
            const monthFilterMatches = selectedMonth === 'all' || month === selectedMonth;
            return yearMatches && monthFilterMatches;
          });
        }
      }

      return projectMatches && assignedPMMatches && monthMatches;
    })
  ), [rows, selectedProject, selectedAssignedPM, selectedMonth, selectedYear]);

  const chartData = useMemo(() => {
    if (!filteredRows.length) return [];
    const byDev: Record<string, { Completed: number; Ongoing: number; 'Not Yet Started': number; Delayed: number }> = {};
    for (const r of filteredRows) {
      const dev = r.developer?.trim() || 'Unassigned';
      const status = r.status?.trim() ?? '';
      if (!status || status.toLowerCase() === 'none') continue;
      if (!byDev[dev]) byDev[dev] = { Completed: 0, Ongoing: 0, 'Not Yet Started': 0, Delayed: 0 };
      if (isCompleted(status))      byDev[dev].Completed += 1;
      else if (isOngoing(status))   byDev[dev].Ongoing += 1;
      else if (isNotYetStarted(status)) byDev[dev]['Not Yet Started'] += 1;
      else if (isDelayed(status))   byDev[dev].Delayed += 1;
    }
    return Object.entries(byDev)
      .map(([developer, counts]) => ({ developer, ...counts }))
      .sort((a, b) => {
        const sum = (x: typeof a) => x.Completed + x.Ongoing + x['Not Yet Started'] + x.Delayed;
        return sum(b) - sum(a);
      });
  }, [filteredRows]);

  const yAxisWidth = useMemo(() => {
    const longest = chartData.reduce((max, row) => Math.max(max, row.developer.length), 0);
    return Math.max(220, longest * 8 + 24);
  }, [chartData]);

  const tableData = useMemo(() => {
    if (!filteredRows.length) return [];
    const byDev: Record<string, {
      developer: string;
      totalTasks: number;
      completedCodes: Set<string>;
      ongoingCodes: Set<string>;
      notStartedCodes: Set<string>;
      delayedCodes: Set<string>;
    }> = {};

    for (const r of filteredRows) {
      const dev    = r.developer?.trim() || 'Unassigned';
      const status = r.status?.trim() ?? '';
      const code   = r.project?.trim() ? projectCode(r.project.trim()) : '';

      if (!byDev[dev]) byDev[dev] = { developer: dev, totalTasks: 0, completedCodes: new Set(), ongoingCodes: new Set(), notStartedCodes: new Set(), delayedCodes: new Set() };

      byDev[dev].totalTasks += 1;
      if (code) {
        if (isCompleted(status))     byDev[dev].completedCodes.add(code);
        if (isOngoing(status))       byDev[dev].ongoingCodes.add(code);
        if (isNotYetStarted(status)) byDev[dev].notStartedCodes.add(code);
        if (isDelayed(status))       byDev[dev].delayedCodes.add(code);
      }
    }

    return Object.values(byDev)
      .map(d => ({
        developer:       d.developer,
        totalTasks:      d.totalTasks,
        completedCodes:  Array.from(d.completedCodes).sort(),
        ongoingCodes:    Array.from(d.ongoingCodes).sort(),
        notStartedCodes: Array.from(d.notStartedCodes).sort(),
        delayedCodes:    Array.from(d.delayedCodes).sort(),
      }))
      .sort((a, b) => b.totalTasks - a.totalTasks);
  }, [filteredRows]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <DashboardHeader
        selectedProject={selectedProject}
        selectedAssignedPM={selectedAssignedPM}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onProjectChange={setSelectedProject}
        onAssignedPMChange={setSelectedAssignedPM}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <DashboardHeader
        selectedProject={selectedProject}
        selectedAssignedPM={selectedAssignedPM}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onProjectChange={setSelectedProject}
        onAssignedPMChange={setSelectedAssignedPM}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
        projects={projectNames}
        assignedPMs={assignedPMs}
      />

      <main className="mx-auto w-full max-w-[1320px] p-6 pt-[112px] lg:p-8 lg:pt-[120px]">

        {/* Google Sheets source */}
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-sm font-semibold text-slate-800">Google Sheets Source</p>
          <div className="flex gap-2">
            <Input value={sheetUrl} onChange={e => setSheetUrl(e.target.value)} placeholder="Paste Google Sheets URL" />
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
              <CardHeader><CardTitle>Portfolio Health — Tasks by Developer</CardTitle></CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <p className="text-sm text-[#6B7280]">No developer data available.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 52)}>
                    <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 24, left: 16, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                      <YAxis type="category" dataKey="developer" width={yAxisWidth} tick={{ fill: '#6B7280', fontSize: 12 }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend
                        content={() => (
                          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', paddingTop: 12, fontSize: 13 }}>
                            {[
                              { label: 'Completed',       color: COMPLETED_COLOR },
                              { label: 'Ongoing',         color: ONGOING_COLOR },
                              { label: 'Not Yet Started', color: NOT_STARTED_COLOR },
                              { label: 'Delayed',         color: DELAYED_COLOR },
                            ].map(({ label, color }) => (
                              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: color }} />
                                <span style={{ color: '#6B7280' }}>{label}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      />
                      <Bar dataKey="Completed"       stackId="a" fill={COMPLETED_COLOR}   name="Completed"       radius={[4,0,0,4]} />
                      <Bar dataKey="Ongoing"         stackId="a" fill={ONGOING_COLOR}     name="Ongoing"         radius={[0,0,0,0]} />
                      <Bar dataKey="Not Yet Started" stackId="a" fill={NOT_STARTED_COLOR} name="Not Yet Started" radius={[0,0,0,0]} />
                      <Bar dataKey="Delayed"         stackId="a" fill={DELAYED_COLOR}     name="Delayed"         radius={[0,4,4,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Portfolio Health Table */}
            <Card className="shadow-[0px_8px_24px_rgba(0,0,0,0.05)]">
              <CardHeader><CardTitle>Portfolio Health Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="rounded-md border border-gray-200" style={{ overflow: 'visible' }}>
                  <Table style={{ overflow: 'visible' }}>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold w-[28rem] whitespace-normal">Developer</TableHead>
                        <TableHead className="font-semibold text-center w-24">Tasks</TableHead>
                        <TableHead className="font-semibold text-center w-36">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: COMPLETED_COLOR }} />
                            Completed
                          </div>
                        </TableHead>
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
                        <TableHead className="font-semibold text-center w-32">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: DELAYED_COLOR }} />
                            Delayed
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-sm text-[#6B7280] py-8">
                            No data loaded yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        tableData.map((row, idx) => (
                          <TableRow key={idx} className="hover:bg-gray-50" style={{ overflow: 'visible' }}>
                            <TableCell className="font-medium text-[#111827] py-3 whitespace-normal break-words">
                              {row.developer}
                            </TableCell>
                            <TableCell className="text-center py-3">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-sm font-semibold text-[#111827]">
                                {row.totalTasks}
                              </span>
                            </TableCell>
                            <TableCell className="text-center py-3" style={{ overflow: 'visible' }}>
                              <CountBadge count={row.completedCodes.length} codes={row.completedCodes} color={COMPLETED_COLOR} />
                            </TableCell>
                            <TableCell className="text-center py-3" style={{ overflow: 'visible' }}>
                              <CountBadge count={row.ongoingCodes.length} codes={row.ongoingCodes} color={ONGOING_COLOR} />
                            </TableCell>
                            <TableCell className="text-center py-3" style={{ overflow: 'visible' }}>
                              <CountBadge count={row.notStartedCodes.length} codes={row.notStartedCodes} color={NOT_STARTED_COLOR} />
                            </TableCell>
                            <TableCell className="text-center py-3" style={{ overflow: 'visible' }}>
                              <CountBadge count={row.delayedCodes.length} codes={row.delayedCodes} color={DELAYED_COLOR} />
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
