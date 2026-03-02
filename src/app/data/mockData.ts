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

export interface RiskItem {
  project: string;
  risk: string;
  owner: string;
  impact: 'High' | 'Medium' | 'Low';
  probability: 'High' | 'Medium' | 'Low';
  mitigation: string;
}

/*
---------------------------------------------------
UTILITIES
---------------------------------------------------
*/

export const calculateDuration = (start: string, end: string): number => {
  if (!start || !end) return 0;

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;

  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const makeTask = (task: Omit<Task, "duration">): Task => ({
  ...task,
  duration: calculateDuration(task.startDate, task.endDate)
});

export const parseCSVTasks = (csvText: string): Task[] => {

  const rows = csvText
    .split("\n")
    .slice(1)
    .filter(r => r.trim() !== "");

  return rows.map(row => {

    const [
      id,
      name,
      project,
      owner,
      developer,
      startDate,
      actualStartDate,
      endDate,
      completion,
      status
    ] = row.split(",");

    return makeTask({
      id: id?.trim(),
      name: name?.trim(),
      project: project?.trim(),
      owner: owner?.trim(),
      developer: developer?.trim(),
      startDate: startDate?.trim(),
      actualStartDate: actualStartDate?.trim() || undefined,
      endDate: endDate?.trim(),
      completion: Number(completion),
      status: status?.trim() as Task["status"]
    });

  });
};

/*
---------------------------------------------------
DATE HELPERS
---------------------------------------------------
*/

export const getDateOffset = (dateStr: string): number => {
  if (!dateStr) return 0;

  const baseDate = new Date("2025-11-01");
  const targetDate = new Date(dateStr);

  if (isNaN(targetDate.getTime())) return 0;

  const diffTime = targetDate.getTime() - baseDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
