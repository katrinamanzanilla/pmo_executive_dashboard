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

export const tasks: Task[] = [
  makeTask({ id: '1', project: 'After-Sales Integrated System v2', name: 'a. Takeout Module. Enhancement of Move-In', developer: 'Jane Acebuche', owner: 'Jelly Jane Tejano, Resheila Rose Hinay', startDate: '2026-01-16', endDate: '2026-07-15', actualStartDate: '2026-01-16', completion: 100, status: 'Completed' }),
  makeTask({ id: '2', project: 'After-Sales Integrated System v3', name: 'a. Mobile App. Integration with Homeowner', developer: 'Jane Acebuche', owner: 'Jelly Jane Tejano, Resheila Rose Hinay', startDate: '2026-07-16', endDate: '2026-12-29', completion: 0, status: 'On Track' }),
  makeTask({ id: '3', project: 'Central Warehouse System v2', name: 'a. Project Damage Management', developer: 'Frederick Bryan Laroya', owner: 'Rocel Estafia', startDate: '2026-01-14', endDate: '2026-09-30', actualStartDate: '2026-01-14', completion: 15, status: 'On Track' }),
  makeTask({ id: '4', project: 'Collection System v2', name: 'Accounting Collection Report Generator', developer: 'John Ivan Eunil Barrios', owner: 'Karen Borsal', startDate: '2026-01-26', endDate: '2026-03-02', actualStartDate: '2026-01-26', completion: 80, status: 'On Track' }),
  makeTask({ id: '5', project: 'Collection System v3', name: 'Full NEP and Full TCP Monitoring', developer: 'John Ivan Eunil Barrios', owner: 'Karen Borsal', startDate: '2026-02-05', endDate: '2026-02-28', completion: 60, status: 'At Risk' }),
  makeTask({ id: '6', project: "Contractor's Billing System", name: 'Service Entrance Post (SEP) - Additional Labor', developer: 'Frederick Bryan Laroya', owner: 'Rocel Estafia', startDate: '2026-01-26', endDate: '2026-03-12', actualStartDate: '2026-01-26', completion: 40, status: 'On Track' }),
  makeTask({ id: '7', project: "Contractor's Worker App", name: 'a. Manpower Registration', developer: 'John Ivan Eunil Barrios', owner: 'Resheila Rose Hinay', startDate: '2026-01-19', endDate: '2026-03-15', actualStartDate: '2026-01-19', completion: 35, status: 'On Track' }),
  makeTask({ id: '8', project: 'CWC Module in Procurement System', name: 'a. Job Order Encoding. Job Order Budgeting', developer: 'Manuel L. Robles, Jr.', owner: 'Jerly Ibañez', startDate: '2026-01-30', endDate: '2026-07-15', actualStartDate: '2026-01-30', completion: 10, status: 'On Track' }),
  makeTask({ id: '9', project: 'Docs Listing and Tracking System', name: 'Engineering Clearance Module', developer: 'John Ivan Eunil Barrios', owner: 'Karen Borsal', startDate: '2026-01-13', endDate: '2026-02-14', actualStartDate: '2026-01-13', completion: 95, status: 'Completed' }),
  makeTask({ id: '10', project: "Homeowner's Online v1", name: 'a. Payment details summary. b. Announcement', developer: 'Frytz Albert De Guzman', owner: 'Resheila Rose Hinay', startDate: '2026-01-15', endDate: '2026-06-30', completion: 25, status: 'On Track' }),
  makeTask({ id: '11', project: "Homeowner's Online v1 (Front-end)", name: 'a. Payment details summary. b. Announcement', developer: 'Mark Ian Reyes', owner: 'Resheila Rose Hinay', startDate: '2026-01-15', endDate: '2026-06-30', completion: 25, status: 'On Track' }),
  makeTask({ id: '12', project: "Homeowner's Online v1 (Back-end)", name: 'a. Payment details summary. b. Announcement', developer: 'John Rosh Birador', owner: 'Resheila Rose Hinay', startDate: '2026-01-15', endDate: '2026-06-30', completion: 25, status: 'On Track' }),
  makeTask({ id: '13', project: "Homeowner's Online v2", name: 'a. DLTS connection / Requirements submission', developer: 'Frytz Albert De Guzman', owner: 'Resheila Rose Hinay', startDate: '2026-07-01', endDate: '2026-11-30', completion: 0, status: 'On Track' }),
  makeTask({ id: '14', project: "Homeowner's Online v2 (Front-end)", name: 'a. DLTS connection / Requirements submission', developer: 'Mark Ian Reyes', owner: 'Resheila Rose Hinay', startDate: '2026-07-01', endDate: '2026-11-30', completion: 0, status: 'On Track' }),
  makeTask({ id: '15', project: "Homeowner's Online v2 (Back-end)", name: 'a. DLTS connection / Requirements submission', developer: 'John Rosh Birador', owner: 'Resheila Rose Hinay', startDate: '2026-07-01', endDate: '2026-11-30', completion: 0, status: 'On Track' }),
  makeTask({ id: '16', project: 'Insights v1', name: 'Sales & Inventory', developer: 'Frytz Albert De Guzman', owner: 'Resheila Rose Hinay', startDate: '2026-08-01', endDate: '2026-09-01', completion: 0, status: 'On Track' }),
  makeTask({ id: '17', project: 'Insights v2', name: 'Takeout', developer: 'Frytz Albert De Guzman', owner: 'Resheila Rose Hinay', startDate: '2026-09-01', endDate: '2026-10-01', completion: 0, status: 'On Track' }),
  makeTask({ id: '18', project: 'Insights v3', name: 'Warehouse', developer: 'Frytz Albert De Guzman', owner: 'Resheila Rose Hinay', startDate: '2026-10-01', endDate: '2026-11-01', completion: 0, status: 'On Track' }),
  makeTask({ id: '19', project: 'Marketing Information System v1', name: "Special Character in broker's name", developer: 'Steven Rey Enales', owner: 'Jelly Jane Tejano', startDate: '2025-12-08', endDate: '2026-01-10', completion: 100, status: 'Completed' }),
  makeTask({ id: '20', project: 'Marketing Information System v2', name: 'RA with No Dash', developer: 'Steven Rey Enales', owner: 'Jelly Jane Tejano', startDate: '2025-11-13', endDate: '2026-03-07', completion: 90, status: 'At Risk' }),
  makeTask({ id: '21', project: 'Online Billing System v2', name: 'a. Enhancement of Web App (improve UI and UX)', developer: 'Jerald Aparri', owner: 'Jelly Jane Tejano, Gerald Ballares', startDate: '2025-12-15', endDate: '2026-04-20', completion: 65, status: 'Delayed' }),
  makeTask({ id: '22', project: 'Procurement System v2', name: 'a. Backcharge Request Module. Billing Approval', developer: 'Manuel L. Robles, Jr.', owner: 'Jerly Ibañez', startDate: '2025-12-01', endDate: '2026-01-19', completion: 100, status: 'Completed' }),
  makeTask({ id: '23', project: 'Procurement System v3', name: 'a. Prime Materials Request. Prime Materials', developer: 'Manuel L. Robles, Jr.', owner: 'Jerly Ibañez', startDate: '2026-01-02', endDate: '2026-02-11', completion: 100, status: 'Completed' }),
  makeTask({ id: '24', project: 'Procurement System v4', name: 'a. Prime Materials - Auto withdraw', developer: 'Manuel L. Robles, Jr.', owner: 'Jerly Ibañez', startDate: '2026-02-02', endDate: '2026-03-24', completion: 40, status: 'On Track' }),
  makeTask({ id: '25', project: 'Procurement System v5', name: 'a. Weekly Inventory Count. b. Report', developer: 'Manuel L. Robles, Jr.', owner: 'Jerly Ibañez', startDate: '2026-02-03', endDate: '2026-05-05', completion: 20, status: 'On Track' }),
  makeTask({ id: '26', project: 'Procurement System v6', name: 'a. Stock Allocation Module. Zero and Critical', developer: 'Manuel L. Robles, Jr.', owner: 'Jerly Ibañez', startDate: '2026-02-13', endDate: '2026-03-15', completion: 30, status: 'At Risk' }),
  makeTask({ id: '27', project: 'Procurement System v7', name: 'a. Material Recovery. Borrow Module', developer: 'Manuel L. Robles, Jr.', owner: 'Jerly Ibañez', startDate: '2026-05-16', endDate: '2026-08-08', completion: 0, status: 'On Track' }),
  makeTask({ id: '28', project: 'Procurement System v8', name: 'a. Adjustment Module', developer: 'Manuel L. Robles, Jr.', owner: 'Jerly Ibañez', startDate: '2026-06-16', endDate: '2026-09-07', completion: 0, status: 'On Track' }),
  makeTask({ id: '29', project: 'Procurement System v9', name: 'Modular Withdrawal Module', developer: 'Manuel L. Robles, Jr.', owner: 'Resheila Rose Hinay', startDate: '2026-06-01', endDate: '2026-12-29', completion: 0, status: 'On Track' }),
  makeTask({ id: '30', project: "Seller's App", name: 'a. Notifications. b. Automation for cancelled tagging', developer: 'Frytz Albert De Guzman', owner: 'Resheila Rose Hinay', startDate: '2026-07-01', endDate: '2026-12-29', completion: 0, status: 'On Track' }),
  makeTask({ id: '31', project: "Seller's App (Front-end)", name: 'a. Notifications. b. Automation for cancelled tagging', developer: 'Mark Ian Reyes', owner: 'Resheila Rose Hinay', startDate: '2026-07-01', endDate: '2026-12-29', completion: 0, status: 'On Track' }),
  makeTask({ id: '32', project: "Seller's App (Back-end)", name: 'a. Notifications. b. Automation for cancelled tagging', developer: 'John Rosh Birador', owner: 'Resheila Rose Hinay', startDate: '2026-07-01', endDate: '2026-12-29', completion: 0, status: 'On Track' }),
  makeTask({ id: '33', project: 'TITLE System', name: 'a. Raw Land Title Payment. b. Transfer of Title', developer: 'John Rosh Birador', owner: 'Jelly Jane Tejano', startDate: '2026-01-16', endDate: '2026-10-16', completion: 15, status: 'On Track' }),
  makeTask({ id: '34', project: 'Warehouse Mobile App v2', name: 'a. Weekly Inventory Count. Delivery Module', developer: 'Manuel L. Robles, Jr.', owner: 'Jerly Ibañez', startDate: '2026-02-03', endDate: '2026-05-05', completion: 15, status: 'On Track' }),
  makeTask({ id: '35', project: 'Warehouse Mobile App v3', name: 'a. Releasing Module. Report', developer: 'Manuel L. Robles, Jr.', owner: 'Jerly Ibañez', startDate: '2026-03-17', endDate: '2026-06-08', completion: 0, status: 'On Track' }),
  makeTask({ id: '36', project: 'Warehouse Mobile App v4', name: 'a. Add to Cart', developer: 'Manuel L. Robles, Jr.', owner: 'Jerly Ibañez', startDate: '2026-07-17', endDate: '2026-10-08', completion: 0, status: 'On Track' }),
  makeTask({ id: '37', project: 'Warehouse Audit Module', name: 'Warehouse Audit Module', developer: 'Manuel L. Robles, Jr.', owner: 'Jerly Ibañez, Resheila Rose Hinay', startDate: '2026-09-01', endDate: '2026-10-01', completion: 0, status: 'On Track' }),
  makeTask({ id: '38', project: 'Warehouse Audit Mobile App', name: 'Warehouse Audit Mobile App', developer: 'Manuel L. Robles, Jr.', owner: 'Jerly Ibañez', startDate: '2026-09-15', endDate: '2026-10-15', completion: 0, status: 'On Track' }),
  makeTask({ id: '39', project: 'CCTV Upgrades', name: 'CCTV Upgrades', developer: 'Developer', owner: 'Giovanni Diocampo', startDate: '2026-07-17', endDate: '2026-10-08', completion: 0, status: 'On Track' }),
  makeTask({ id: '40', project: 'Plate Number Recognition and Barrier', name: 'Plate Number Recognition and Barrier', developer: 'Developer', owner: 'Giovanni Diocampo', startDate: '2026-07-17', endDate: '2026-10-08', completion: 0, status: 'On Track' }),
  makeTask({ id: '41', project: 'Additional Security Tech', name: 'Additional Security Tech', developer: 'Developer', owner: 'Giovanni Diocampo', startDate: '2026-07-17', endDate: '2026-10-08', completion: 0, status: 'On Track' }),
  makeTask({ id: '42', project: 'IT Infrastructure Upgrade', name: 'IT Infrastructure Upgrade', developer: 'Developer', owner: 'Giovanni Diocampo', startDate: '2026-07-17', endDate: '2026-10-08', completion: 0, status: 'On Track' }),
];

const uniqueProjects = Array.from(new Set(tasks.map((task) => task.project)));

export const projects: Project[] = uniqueProjects.map((projectName, index) => {
  const projectTasks = tasks.filter((task) => task.project === projectName);
  const completion = Math.round(
    projectTasks.reduce((sum, task) => sum + task.completion, 0) / projectTasks.length,
  );

  const hasDelayed = projectTasks.some((task) => task.status === 'Delayed');
  const hasAtRisk = projectTasks.some((task) => task.status === 'At Risk');
  const allCompleted = projectTasks.every((task) => task.status === 'Completed');

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
    riskExposure: projectTasks.filter((task) => task.status !== 'Completed').length,
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
  {
    project: 'Online Billing System v2',
    risk: 'UX requirements changes',
    owner: 'Gerald Ballares',
    impact: 'Medium',
    probability: 'High',
    mitigation: 'Weekly stakeholder review meetings',
  },
  {
    project: "Contractor's Billing System",
    risk: 'Data quality concerns',
    owner: 'Rocel Estafia',
    impact: 'High',
    probability: 'Medium',
    mitigation: 'Implement data validation pipeline',
  },
  {
    project: 'TITLE System',
    risk: 'Security compliance gaps',
    owner: 'Jelly Jane Tejano',
    impact: 'Medium',
    probability: 'Low',
    mitigation: 'Enhanced security protocols',
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
  'Jelly Jane Tejano, Resheila Rose Hinay',
  'Jelly Jane Tejano, Gerald Ballares',
  'Jerly Ibañez, Resheila Rose Hinay',
];

// Helper function to calculate date offsets for Gantt chart
export const getDateOffset = (dateStr: string): number => {
  if (!dateStr) return 0;
  const baseDate = new Date('2025-11-01');
  const taskDate = new Date(dateStr);
  const diffTime = taskDate.getTime() - baseDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Historical completion data for trend chart
export const completionTrend = [
  { month: 'Sep 25', completion: 35 },
  { month: 'Oct 25', completion: 42 },
  { month: 'Nov 25', completion: 48 },
  { month: 'Dec 25', completion: 52 },
  { month: 'Jan 26', completion: 58 },
  { month: 'Feb 26', completion: 62 },
];
