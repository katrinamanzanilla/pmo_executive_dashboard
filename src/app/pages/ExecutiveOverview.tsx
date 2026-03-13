import { useEffect, useMemo, useState } from 'react';
import { DashboardHeader } from '../components/DashboardHeader';
import { KPIRow } from '../components/KPIRow';
import { GanttChart } from '../components/GanttChart';
import { AnalyticsRow } from '../components/AnalyticsRow';
import { DetailedTable } from '../components/DetailedTable';
import { DEFAULT_GOOGLE_SHEET_SOURCE_URL, fetchTasksFromGoogleSheet } from '../data/googleSheetTasks';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import type { Task } from '../data/mockData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isDelayedStatus = (s: string) => s.trim().toLowerCase() === 'delayed';
const isCompletedStatus = (s: string) => ['completed', 'done'].includes(s.trim().toLowerCase());

// Returns "YYYY-MM" key for a date string
const toMonthKey = (dateStr: string): string => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// Format "YYYY-MM" → "Jan 2026"
const formatMonthLabel = (key: string): string => {
  const [year, month] = key.split('-');
  return new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', {
    month: 'short', year: 'numeric',
  });
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ExecutiveOverview() {
  const [selectedProject, setSelectedProject]       = useState('all');
  const [selectedOwner, setSelectedOwner]           = useState('all');
  const [selectedMonthKey, setSelectedMonthKey]     = useState('all'); // "YYYY-MM" or "all"
  const [sheetUrl, setSheetUrl]                     = useState(DEFAULT_GOOGLE_SHEET_SOURCE_URL);
  const [allTasks, setAllTasks]                     = useState<Task[]>([]);
  const [isLoadingSheet, setIsLoadingSheet]         = useState(false);
  const [sheetError, setSheetError]                 = useState('');

  const projectNames = useMemo(
    () => Array.from(new Set(allTasks.map(t => t.project).filter(Boolean))),
    [allTasks],
  );

  const assignedPMs = useMemo(
    () => Array.from(new Set(allTasks.map(t => t.owner).filter(Boolean))),
    [allTasks],
  );

  // Build sorted month options from task start/end dates
  const monthOptions = useMemo(() => {
    const keys = new Set<string>();
    for (const task of allTasks) {
      const sk = toMonthKey(task.startDate);
      const ek = toMonthKey(task.endDate);
      if (sk) keys.add(sk);
      if (ek) keys.add(ek);
    }
    return Array.from(keys).sort();
  }, [allTasks]);

  const handleLoadSheet = async () => {
    setIsLoadingSheet(true);
    setSheetError('');
    try {
      const sheetTasks = await fetchTasksFromGoogleSheet(sheetUrl);
      if (sheetTasks.length === 0) {
        setSheetError('No valid rows found in the sheet.');
      } else {
        setAllTasks(sheetTasks);
        setSelectedProject('all');
        setSelectedOwner('all');
        setSelectedMonthKey('all');
      }
    } catch (error) {
      setSheetError(error instanceof Error ? error.message : 'Failed to load Google Sheet.');
    } finally {
      setIsLoadingSheet(false);
    }
  };

  useEffect(() => { void handleLoadSheet(); }, []);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return allTasks.filter(task => {
      const projectMatch = selectedProject === 'all' || task.project === selectedProject;
      const ownerMatch   = selectedOwner === 'all'   || task.owner === selectedOwner;
      const monthMatch   = selectedMonthKey === 'all' || (
        // Task overlaps with the selected month:
        // its start month <= selected <= its end month
        toMonthKey(task.startDate) <= selectedMonthKey &&
        toMonthKey(task.endDate)   >= selectedMonthKey
      );
      return projectMatch && ownerMatch && monthMatch;
    });
  }, [allTasks, selectedProject, selectedOwner, selectedMonthKey]);

  const isFiltered = selectedProject !== 'all' || selectedOwner !== 'all' || selectedMonthKey !== 'all';

  // KPIs — all derived from live filtered tasks
  const kpis = useMemo(() => {
    const totalTasks    = filteredTasks.length;
    const totalProjects = new Set(filteredTasks.map(t => t.project)).size;

    if (totalTasks === 0) {
      return { totalProjects: isFiltered ? 0 : projectNames.length, totalTasks: 0, portfolioCompletion: 0, delayedTasks: 0, completedTasks: 0 };
    }

    const raw = (t: Task) => t.rawStatus ?? t.status ?? '';
    const delayedTasks   = filteredTasks.filter(t => isDelayedStatus(raw(t))).length;
    const completedTasks = filteredTasks.filter(t => isCompletedStatus(raw(t))).length;

    // Portfolio completion = % of tasks that are completed
    const portfolioCompletion = Math.round((completedTasks / totalTasks) * 100);

    return {
      totalProjects: isFiltered ? totalProjects : projectNames.length,
      totalTasks,
      portfolioCompletion,
      delayedTasks,
      completedTasks,
    };
  }, [filteredTasks, isFiltered, projectNames.length]);

  // Pass month options + handler into header via dateRange props
  // We repurpose selectedDateRange as the month key string
  const monthLabels = useMemo(
    () => monthOptions.map(k => ({ key: k, label: formatMonthLabel(k) })),
    [monthOptions],
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <DashboardHeader
        selectedProject={selectedProject}
        selectedAssignedPM={selectedOwner}
        selectedDateRange={selectedMonthKey}
        onProjectChange={setSelectedProject}
        onAssignedPMChange={setSelectedOwner}
        onDateRangeChange={setSelectedMonthKey}
        projects={projectNames}
        assignedPMs={assignedPMs}
        monthOptions={monthLabels}
      />

      <main className="mx-auto w-full max-w-[1320px] p-6 pt-[112px] lg:p-8 lg:pt-[120px]">
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-sm font-semibold text-slate-800">Google Sheets Source</p>
          <div className="flex gap-2">
            <Input
              value={sheetUrl}
              onChange={e => setSheetUrl(e.target.value)}
              placeholder="Paste Google Sheets URL"
            />
            <Button onClick={handleLoadSheet} disabled={isLoadingSheet}>
              {isLoadingSheet ? 'Loading...' : 'Load Sheet'}
            </Button>
          </div>
          {sheetError && <p className="mt-2 text-sm text-red-600">{sheetError}</p>}
        </div>

        <KPIRow
          totalProjects={kpis.totalProjects}
          totalTasks={kpis.totalTasks}
          portfolioCompletion={kpis.portfolioCompletion}
          delayedTasks={kpis.delayedTasks}
          completedTasks={kpis.completedTasks}
          isFiltered={isFiltered}
        />

        <GanttChart tasks={filteredTasks} />
        <AnalyticsRow tasks={filteredTasks} />
        <DetailedTable tasks={filteredTasks} />
      </main>
    </div>
  );
}
