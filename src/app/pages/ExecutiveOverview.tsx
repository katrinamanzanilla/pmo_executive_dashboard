import { useState, useMemo } from 'react';
import { DashboardHeader } from '../components/DashboardHeader';
import { KPIRow } from '../components/KPIRow';
import { GanttChart } from '../components/GanttChart';
import { AnalyticsRow } from '../components/AnalyticsRow';
import { DetailedTable } from '../components/DetailedTable';
import { tasks, projects, owners } from '../data/mockData';

export function ExecutiveOverview() {
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedOwner, setSelectedOwner] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('all');

  const projectNames = projects.map(p => p.name);

  // Filter tasks based on selections
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const projectMatch = selectedProject === 'all' || task.project === selectedProject;
      const ownerMatch = selectedOwner === 'all' || task.owner === selectedOwner;
      return projectMatch && ownerMatch;
    });
  }, [selectedProject, selectedOwner]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalTasks = filteredTasks.length;
    if (totalTasks === 0) {
      return {
        totalProjects: selectedProject === 'all' ? projects.length : 1,
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
      totalProjects: selectedProject === 'all' ? projects.length : 1,
      totalTasks,
      portfolioCompletion: avgCompletion,
      delayedTasks
    };
  }, [filteredTasks, selectedProject]);

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

        <DetailedTable tasks={filteredTasks} />
      </main>
    </div>
  );
}
