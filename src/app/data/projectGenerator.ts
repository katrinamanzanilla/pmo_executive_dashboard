// projectGenerator.ts
import { Task, Project } from './mockData';

// Generate projects dynamically from tasks
export const generateProjectsFromTasks = (tasks: Task[]): Project[] => {
  const uniqueProjects = Array.from(new Set(tasks.map(t => t.project)));

  return uniqueProjects.map((projectName, index) => {
    const projectTasks = tasks.filter(t => t.project === projectName);
    const completion = projectTasks.reduce((sum, t) => sum + t.completion, 0) / projectTasks.length;

    const allCompleted = projectTasks.every(t => t.status === 'Completed');
    const hasDelayed = projectTasks.some(t => t.status === 'Delayed');
    const hasAtRisk = projectTasks.some(t => t.status === 'At Risk');

    const status: Project['status'] = allCompleted ? 'Completed' : hasDelayed ? 'Delayed' : hasAtRisk ? 'At Risk' : 'On Track';

    return {
      id: String(index + 1),
      name: projectName,
      status,
      completion: Math.round(completion),
      spi: 1,
      cpi: 1,
      riskExposure: projectTasks.filter(t => t.status !== 'Completed').length,
    };
  });
};

// Compute dynamic completion trends for charts
export const computeCompletionTrend = (tasks: Task[]): { month: string; completion: number }[] => {
  const monthlyMap: Record<string, number[]> = {};
  tasks.forEach(task => {
    const month = task.startDate.slice(0, 7); // YYYY-MM
    if (!monthlyMap[month]) monthlyMap[month] = [];
    monthlyMap[month].push(task.completion);
  });

  return Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, completions]) => ({
      month,
      completion: Math.round(completions.reduce((sum, c) => sum + c, 0) / completions.length),
    }));
};
