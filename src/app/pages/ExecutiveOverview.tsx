import { useState, useMemo, useEffect } from 'react';
import { DashboardHeader } from '../components/DashboardHeader';
import { KPIRow } from '../components/KPIRow';
import { GanttChart } from '../components/GanttChart';
import { AnalyticsRow } from '../components/AnalyticsRow';
import { DetailedTable } from '../components/DetailedTable';
import { Task } from '../data/mockData';
import { fetchTasksFromGoogleSheet } from '../data/googleSheetTasks';

export function ExecutiveOverview() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedOwner, setSelectedOwner] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('all');

  useEffect(() => {
    let active = true;

    const loadTasks = async () => {
      try {
        const sheetTasks = await fetchTasksFromGoogleSheet();
        if (active) {
          setTasks(sheetTasks);
        }
      } catch (error) {
        console.error('Unable to load tasks from Google Sheet.', error);
        if (active) {
          setTasks([]);
        }
      }
    };

    loadTasks();

    return () => {
      active = false;
    };
  }, []);

  const projectNames = useMemo(
    () => Array.from(new Set(tasks.map((task) => task.project))).sort(),
    [tasks],
  );

  const owners = useMemo(
    () => Array.from(new Set(tasks.map((task) => task.owner))).sort(),
    [tasks],
  );

  // Filter tasks based on selections
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const projectMatch = selectedProject === 'all' || task.project === selectedProject;
      const ownerMatch = selectedOwner === 'all' || task.owner === selectedOwner;
      return projectMatch && ownerMatch;
    });
  }, [tasks, selectedProject, selectedOwner]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalTasks = filteredTasks.length;
    if (totalTasks === 0) {
      return {
        totalProjects: selectedProject === 'all' ? projectNames.length : 1,
        totalTasks: 0,
        portfolioCompletion: 0,
        delayedTasks: 0
      };
    }
    const delayedTasks = filteredTasks.filter(t => t.status === 'Delayed').length;
    const avgCompletion = Math.round(
      filteredTasks.reduce((acc, t) => acc + t.completion, 0) / totalTasks
    );

    return {
      totalProjects: selectedProject === 'all' ? projectNames.length : 1,
      totalTasks,
      portfolioCompletion: avgCompletion,
      delayedTasks
    };
  }, [filteredTasks, selectedProject, projectNames.length]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <DashboardHeader
        selectedProject={selectedProject}
        selectedOwner={selectedOwner}
        selectedDateRange={selectedDateRange}
        onProjectChange={setSelectedProject}
        onOwnerChange={setSelectedOwner}
        onDateRangeChange={setSelectedDateRange}
        projects={projectNames}
        owners={owners}
      />

      <main className="p-8">
        <KPIRow
          totalProjects={kpis.totalProjects}
          totalTasks={kpis.totalTasks}
          portfolioCompletion={kpis.portfolioCompletion}
          delayedTasks={kpis.delayedTasks}
        />

        <GanttChart tasks={filteredTasks} />

        <AnalyticsRow tasks={filteredTasks} />
