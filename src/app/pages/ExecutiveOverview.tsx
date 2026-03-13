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

const isDelayedStatus   = (s: string) => s.trim().toLowerCase() === 'delayed';
const isCompletedStatus = (s: string) => ['completed', 'done'].includes(s.trim().toLowerCase());

// "YYYY-MM" from a date string
const toMonthKey = (dateStr: string): string => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ExecutiveOverview() {
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedOwner, setSelectedOwner]     = useState('all');
  const [selectedMonth, setSelectedMonth]     = useState('all'); // '01'–'12' or 'all'
  const [selectedYear, setSelectedYear]       = useState('all'); // '2025','2026' or 'all'
  const [sheetUrl, setSheetUrl]               = useState(DEFAULT_GOOGLE_SHEET_SOURCE_URL);
  const [allTasks, setAllTasks]               = useState<Task[]>([]);
  const [isLoadingSheet, setIsLoadingSheet]   = useState(false);
  const [sheetError, setSheetError]           = useState('');

  const projectNames = useMemo(
    () => Array.from(new Set(allTasks.map(t => t.project).filter(Boolean))),
    [allTasks],
  );

  const assignedPMs = useMemo(
    () => Array.from(new Set(allTasks.map(t => t.owner).filter(Boolean))),
    [allTasks],
  );

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
        setSelectedMonth('all');
        setSelectedYear('all');
      }
    } catch (error) {
      setSheetError(error instanceof Error ? error.message : 'Failed to load Google Sheet.');
    } finally {
      setIsLoadingSheet(false);
    }
  };

  useEffect(() => { void handleLoadSheet(); }, []);

  // Build the selected month key for filtering (e.g. "2026-03")
  // If only year selected → match any month in that year
  // If only month selected → match that month in any year
  // If both → exact match
  const filteredTasks = useMemo(() => {
    return allTasks.filter(task => {
      const projectMatch = selectedProject === 'all' || task.project === selectedProject;
      const ownerMatch   = selectedOwner === 'all'   || task.owner === selectedOwner;

      let monthMatch = true;
      if (selectedMonth !== 'all' || selectedYear !== 'all') {
        const startKey = toMonthKey(task.startDate); // "YYYY-MM"
        const endKey   = toMonthKey(task.endDate);
        if (!startKey || !endKey) {
          monthMatch = true; // can't filter tasks with no dates
        } else {
          // Generate all month keys the task spans
          const taskMonths: string[] = [];
          let cur = startKey;
          while (cur <= endKey) {
            taskMonths.push(cur);
            const [y, m] = cur.split('-').map(Number);
            const next = m === 12
              ? `${y + 1}-01`
              : `${y}-${String(m + 1).padStart(2, '0')}`;
            cur = next;
            if (taskMonths.length > 36) break; // safety cap
          }

          monthMatch = taskMonths.some(key => {
            const [keyYear, keyMonth] = key.split('-');
            const yearOk  = selectedYear  === 'all' || keyYear  === selectedYear;
            const monthOk = selectedMonth === 'all' || keyMonth === selectedMonth;
            return yearOk && monthOk;
          });
        }
      }

      return projectMatch && ownerMatch && monthMatch;
    });
  }, [allTasks, selectedProject, selectedOwner, selectedMonth, selectedYear]);

  const isFiltered = selectedProject !== 'all' || selectedOwner !== 'all'
    || selectedMonth !== 'all' || selectedYear !== 'all';

  // KPIs — all derived from filtered tasks
  const kpis = useMemo(() => {
    const totalTasks    = filteredTasks.length;
    const totalProjects = new Set(filteredTasks.map(t => t.project)).size;

    if (totalTasks === 0) {
      return { totalProjects: isFiltered ? 0 : projectNames.length, totalTasks: 0, portfolioCompletion: 0, delayedTasks: 0, completedTasks: 0 };
    }

    const raw            = (t: Task) => t.rawStatus ?? t.status ?? '';
    const delayedTasks   = filteredTasks.filter(t => isDelayedStatus(raw(t))).length;
    const completedTasks = filteredTasks.filter(t => isCompletedStatus(raw(t))).length;
    const portfolioCompletion = Math.round((completedTasks / totalTasks) * 100);

    return {
      totalProjects: isFiltered ? totalProjects : projectNames.length,
      totalTasks,
      portfolioCompletion,
      delayedTasks,
      completedTasks,
    };
  }, [filteredTasks, isFiltered, projectNames.length]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <DashboardHeader
        selectedProject={selectedProject}
        selectedAssignedPM={selectedOwner}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onProjectChange={setSelectedProject}
        onAssignedPMChange={setSelectedOwner}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
        projects={projectNames}
        assignedPMs={assignedPMs}
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
