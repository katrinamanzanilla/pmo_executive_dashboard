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

export function ExecutiveOverview() {
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedOwner, setSelectedOwner] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('all');
  const [sheetUrl, setSheetUrl] = useState(DEFAULT_GOOGLE_SHEET_SOURCE_URL);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [sheetError, setSheetError] = useState('');

  const projectNames = useMemo(
    () => Array.from(new Set(allTasks.map((task) => task.project))),
    [allTasks],
  );

  const assignedPMs = useMemo(
    () => Array.from(new Set(allTasks.map((task) => task.owner))),
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
      }
    } catch (error) {
      setSheetError(error instanceof Error ? error.message : 'Failed to load Google Sheet.');
    } finally {
      setIsLoadingSheet(false);
    }
  };

  useEffect(() => {
    void handleLoadSheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter tasks based on selections
  const filteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
      const projectMatch = selectedProject === 'all' || task.project === selectedProject;
      const ownerMatch = selectedOwner === 'all' || task.owner === selectedOwner;
      return projectMatch && ownerMatch;
    });
  }, [allTasks, selectedProject, selectedOwner]);

  const totalProjects = useMemo(
    () => new Set(filteredTasks.map((task) => task.project)).size,
    [filteredTasks],
  );

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalTasks = filteredTasks.length;
    if (totalTasks === 0) {
      return {
        totalProjects: selectedProject === 'all' ? projectNames.length : 1,
        totalTasks: 0,
        portfolioCompletion: 0,
        delayedTasks: 0,
      };
    }
    const delayedTasks = filteredTasks.filter((t) => t.status === 'Delayed').length;
    const avgCompletion = Math.round(
      filteredTasks.reduce((acc, t) => acc + t.completion, 0) / totalTasks,
    );

    return {
      totalProjects: selectedProject === 'all' ? projectNames.length : totalProjects,
      totalTasks,
      portfolioCompletion: avgCompletion,
      delayedTasks,
    };
  }, [filteredTasks, selectedProject, projectNames.length, totalProjects]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <DashboardHeader
        selectedProject={selectedProject}
        selectedAssignedPM={selectedOwner}
        selectedDateRange={selectedDateRange}
        onProjectChange={setSelectedProject}
        onAssignedPMChange={setSelectedOwner}
        onDateRangeChange={setSelectedDateRange}
        projects={projectNames}
        assignedPMs={assignedPMs}
      />

      <main className="mx-auto w-full max-w-[1320px] p-6 lg:p-8">
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-sm font-semibold text-slate-800">Google Sheets Source</p>
          <div className="flex gap-2">
            <Input
              value={sheetUrl}
              onChange={(event) => setSheetUrl(event.target.value)}
              placeholder="Paste Google Sheets URL"
            />
            <Button onClick={handleLoadSheet} disabled={isLoadingSheet}>
              {isLoadingSheet ? 'Loading...' : 'Load Sheet'}
            </Button>
          </div>
          {sheetError ? <p className="mt-2 text-sm text-red-600">{sheetError}</p> : null}
        </div>

        <KPIRow
          totalProjects={kpis.totalProjects}
          totalTasks={kpis.totalTasks}
          portfolioCompletion={kpis.portfolioCompletion}
          delayedTasks={kpis.delayedTasks}
        />

        <GanttChart tasks={filteredTasks} />

        <AnalyticsRow tasks={filteredTasks} />

        <DetailedTable tasks={filteredTasks} />
      </main>
    </div>
  );
}
