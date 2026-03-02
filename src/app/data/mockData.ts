// Mock PMO data for dashboard

export interface Task {
  id: string;
  name: string;
  project: string;
  owner: string; // Assigned PM
  developer: string;
  startDate: string;
  actualStartDate?: string;
  endDate: string;
  completion: number;
  status: 'On Track' | 'At Risk' | 'Delayed' | 'Completed';
  duration: number; // in days
}

export interface Project {
  id: string;
  name: string;
  status: 'On Track' | 'At Risk' | 'Delayed' | 'Completed';
  completion: number;
  spi: number; // Schedule Performance Index
  cpi: number; // Cost Performance Index
  riskExposure: number;
}

export interface RiskItem {
  project: string;
  risk: string;
  owner: string;
  impact: 'High' | 'Medium' | 'Low';
  probability: 'High' | 'Medium' | 'Low';
  mitigation: string;
}

// ---------------- Helper Functions ----------------

const calculateDuration = (start: string, end: string): number => {
  if (!start || !end) return 0;

  const startDate = new Date(start);
  const endDate = new Date(end);

  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const makeTask = ({
  id,
  name,
  project,
  owner,
  developer,
  startDate,
  endDate,
  completion,
  status,
  actualStartDate,
}: Omit<Task, 'duration'>): Task => ({
  id,
  name,
  project,
  owner,
  developer,
  startDate,
  endDate,
  completion,
  status,
  ...(actualStartDate ? { actualStartDate } : {}),
  duration: calculateDuration(startDate, endDate),
});

// ---------------- Static Data ----------------

export const tasks: Task[] = [];

const uniqueProjects = Array.from(new Set(tasks.map((task) => task.project)));

export const projects: Project[] = uniqueProjects.map((projectName, index) => {
  const projectTasks = tasks.filter((task) => task.project === projectName);

  const completion = Math.round(
    projectTasks.reduce((sum, task) => sum + task.completion, 0) /
      (projectTasks.length || 1)
  );

  const hasDelayed = projectTasks.some(
    (task) => task.status === 'Delayed'
  );

  const hasAtRisk = projectTasks.some(
    (task) => task.status === 'At Risk'
  );

  const allCompleted = projectTasks.every(
    (task) => task.status === 'Completed'
  );

  const status: Project['status'] = allCompleted
    ? 'Completed'
    : hasDelayed
    ? 'Delayed'
    : hasAtRisk
    ? 'At Risk'
    : 'On Track';

  return {
    id: String(index + 1),
    name: projectName,
    status,
    completion,
    spi: 1,
    cpi: 1,
    riskExposure: projectTasks.filter(
      (task) => task.status !== 'Completed'
    ).length,
  };
});

export const risks: RiskItem[] = [
  {
    project: 'Collection System v3',
    risk: 'Resource availability constraints',
    owner: 'Karen Borsal',
    impact: 'High',
    probability: 'High',
    mitigation: 'Engage external contractors',
  },
  {
    project: 'Marketing Information System v2',
    risk: 'Third-party API dependencies',
    owner: 'Jelly Jane Tejano',
    impact: 'High',
    probability: 'Medium',
    mitigation: 'Develop fallback mechanisms',
  },
];

export const owners = [
  'Resheila Rose Hinay',
  'Rocel Estafia',
  'Karen Borsal',
  'Jerly Ibañez',
  'Jelly Jane Tejano',
  'Gerald Ballares',
  'Giovanni Diocampo',
];

// Helper function for Gantt chart
export const getDateOffset = (dateStr: string): number => {
  if (!dateStr) return 0;

  const baseDate = new Date('2025-11-01');
  const taskDate = new Date(dateStr);

  const diffTime = taskDate.getTime() - baseDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Historical completion data
export const completionTrend = [
  { month: 'Sep 25', completion: 35 },
  { month: 'Oct 25', completion: 42 },
  { month: 'Nov 25', completion: 48 },
  { month: 'Dec 25', completion: 52 },
  { month: 'Jan 26', completion: 58 },
  { month: 'Feb 26', completion: 62 },
];
