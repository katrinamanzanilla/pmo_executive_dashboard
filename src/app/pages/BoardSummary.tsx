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
    developer: (devCol >= 0 ? (row[devCol] ?? '') : '').replace(/^"|"$/g, '').trim(),
    status:    statusCol  >= 0 ? (row[statusCol]  ?? '') : '',
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

const COMPLETED_COLOR   = '#059669';
const ONGOING_COLOR     = '#3B82F6';
const NOT_STARTED_COLOR = '#94A3B8';
const DELAYED_COLOR     = '#DC2626';

// ─── Custom chart tooltip ─────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; fill: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  let completed = 0, ongoing = 0, notYetStarted = 0, delayed = 0;
  for (const p of payload) {
    const s = p.name.trim().toLowerCase();
    if (['completed', 'done'].includes(s))                            completed += p.value;
    else if (['on going','ongoing','in progress','on track'].includes(s)) ongoing += p.value;
    else if (['not yet started','not started'].includes(s))           notYetStarted += p.value;
    else if (s === 'delayed')                                          delayed += p.value;
  }
  const total = payload.reduce((s, p) => s + p.value, 0);

  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 14px', fontSize: 13, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', minWidth: 190 }}>
      <p style={{ fontWeight: 600, color: '#111827', marginBottom: 8 }}>{label}</p>
      <p style={{ color: '#6B7280', marginBottom: 6 }}>Total tasks: <strong style={{ color: '#111827' }}>{total}</strong></p>
      {[
        { label: 'Completed',       value: completed,     color: COMPLETED_COLOR },
        { label: 'Ongoing',         value: ongoing,       color: ONGOING_COLOR },
        { label: 'Not Yet Started', value: notYetStarted, color: NOT_STARTED_COLOR },
        { label: 'Delayed',         value: delayed,       color: DELAYED_COLOR },
      ].map(row => (
        <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: row.color }} />
            <span style={{ color: '#6B7280' }}>{row.label}</span>
          </div>
          <span style={{ fontWeight: 600, color: '#111827' }}>{row.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Count badge with smart tooltip (no clipping) ────────────────────────────

function CountBadge({ count, codes, color }: { count: number; codes: string[]; color: string }) {
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties | null>(null);
  const triggerRef = useMemo(() => ({ current: null as HTMLSpanElement | null }), []);

  const handleMouseEnter = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const estimatedHeight = codes.length * 28 + 24;
    const showAbove = rect.top > estimatedHeight + 16;
    const left = rect.left + rect.width / 2;

    setTooltipStyle({
      position: 'fixed',
      left,
      transform: 'translateX(-50%)',
      ...(showAbove
        ? { top: rect.top - 8, transform: 'translateX(-50%) translateY(-100%)' }
        : { top: rect.bottom + 8 }),
      zIndex: 99999,
      minWidth: 'max-content',
      background: '#fff',
      border: '1px solid #E5E7EB',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 13,
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      pointerEvents: 'none',
    });
  };

  if (count === 0) return <span className="text-[#9CA3AF] text-sm">—</span>;

  return (
    <div className="inline-block">
      <span
        ref={el => { triggerRef.current = el; }}
        className="inline-flex items-center justify-center min-w-[2rem] h-8 rounded-full px-2.5 text-sm font-semibold text-white cursor-default select-none"
        style={{ backgroundColor: color }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setTooltipStyle(null)}
      >
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
      else setRows(data);
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
      return projectMatches && assignedPMMatches;
    })
  ), [rows, selectedProject, selectedAssignedPM]);

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
