// mockData.ts
export interface Task {
  id: string;
  name: string;
  project: string;
  owner: string;
  developer: string;
  startDate: string;
  actualStartDate?: string;
  endDate: string;
  completion: number;
  status: 'On Track' | 'At Risk' | 'Delayed' | 'Completed';
  duration: number;
}

export interface Project {
  id: string;
  name: string;
  status: 'On Track' | 'At Risk' | 'Delayed' | 'Completed';
  completion: number;
  spi: number;
  cpi: number;
  riskExposure: number;
}

// Calculates how many days a task takes
export const calculateDuration = (start: string, end: string) => {
  if (!start || !end) return 0;
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// Helper for Gantt chart: days offset from a base date
export const getDateOffset = (dateStr: string, baseDateStr?: string) => {
  if (!dateStr) return 0;
  const base = new Date(baseDateStr || '2025-11-01');
  const taskDate = new Date(dateStr);
  return Math.ceil((taskDate.getTime() - base.getTime()) / (1000 * 60 * 60 * 24));
};
