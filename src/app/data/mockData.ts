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
  rawStatus: string; // exact value from Google Sheet, never normalized
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

export const tasks: Task[] = [];
export const projects: Project[] = [];
export const risks: RiskItem[] = [];

// Historical completion data — used by AnalyticsRow completion trend chart
export const completionTrend = [
  { month: 'Sep 25', completion: 35 },
  { month: 'Oct 25', completion: 42 },
  { month: 'Nov 25', completion: 48 },
  { month: 'Dec 25', completion: 52 },
  { month: 'Jan 26', completion: 58 },
  { month: 'Feb 26', completion: 62 },
];
