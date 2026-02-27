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
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};

export const tasks: Task[] = [
  { id: '1', name: 'After-Sales Integrated System v2', project: 'After-Sales Integrated System v2', owner: 'After-Sales Integrated System v2', developer: 'Jane Acebuche', startDate: '2026-01-16', endDate: '2026-07-15', completion: 20, status: 'Completed', duration: 180 },
  { id: '2', name: 'After-Sales Integrated System v3', project: 'After-Sales Integrated System v3', owner: 'After-Sales Integrated System v3', developer: 'Jane Acebuche', startDate: '2026-07-16', actualStartDate: '2026-07-20', endDate: '2026-12-29', completion: 0, status: 'On Track', duration: 166 },
  { id: '3', name: 'Central Warehouse System v2', project: 'Central Warehouse System v2', owner: 'Central Warehouse System v2', developer: 'Frederick Bryan Laroya', startDate: '2026-01-14', actualStartDate: '2026-01-20', endDate: '2026-09-30', completion: 15, status: 'On Track', duration: 259 },
  { id: '4', name: 'Collection System v2', project: 'Collection System v2', owner: 'Collection System v2', developer: 'John Ivan Eunil Barrios', startDate: '2026-01-26', actualStartDate: '2026-01-29', endDate: '2026-03-02', completion: 80, status: 'On Track', duration: 35 },
  { id: '5', name: 'Collection System v3', project: 'Collection System v3', owner: 'Collection System v3', developer: 'John Ivan Eunil Barrios', startDate: '2026-02-05', actualStartDate: '2026-02-10', endDate: '2026-02-28', completion: 60, status: 'At Risk', duration: 23 },
  { id: '6', name: "Contractor's Billing System", project: "Contractor's Billing System", owner: "Contractor's Billing System", developer: 'Frederick Bryan Laroya', startDate: '2026-01-26', actualStartDate: '2026-01-30', endDate: '2026-03-12', completion: 40, status: 'On Track', duration: 45 },
  { id: '7', name: "Contractor's Worker App", project: "Contractor's Worker App", owner: "Contractor's Worker App", developer: 'John Ivan Eunil Barrios', startDate: '2026-01-19', actualStartDate: '2026-01-24', endDate: '2026-03-15', completion: 35, status: 'On Track', duration: 55 },
  { id: '8', name: 'CWCC Module in Procurement System', project: 'CWCC Module in Procurement System', owner: 'CWCC Module in Procurement System', developer: 'Manuel L. Robles, Jr.', startDate: '2026-01-30', actualStartDate: '2026-02-05', endDate: '2026-07-15', completion: 10, status: 'On Track', duration: 166 },
  { id: '9', name: 'Docs Listing and Tracking System', project: 'Docs Listing and Tracking System', owner: 'Docs Listing and Tracking System', developer: 'John Ivan Eunil Barrios', startDate: '2026-01-13', actualStartDate: '2026-01-18', endDate: '2026-02-14', completion: 95, status: 'Completed', duration: 32 },
  { id: '10', name: "Homeowner's Online v1", project: "Homeowner's Online v1", owner: "Homeowner's Online v1", developer: 'Frytz Albert De Guzman', startDate: '2026-01-15', endDate: '2026-06-30', completion: 25, status: 'On Track', duration: 166 },
  { id: '11', name: "Homeowner's Online v1", project: "Homeowner's Online v1", owner: "Homeowner's Online v1", developer: 'Mark Ian Reyes', startDate: '2026-01-15', endDate: '2026-06-30', completion: 25, status: 'On Track', duration: 166 },
  { id: '12', name: "Homeowner's Online v1", project: "Homeowner's Online v1", owner: "Homeowner's Online v1", developer: 'John Rosh Birador', startDate: '2026-01-15', endDate: '2026-06-30', completion: 25, status: 'On Track', duration: 166 },
  { id: '13', name: "Homeowner's Online v2", project: "Homeowner's Online v2", owner: "Homeowner's Online v2", developer: 'Frytz Albert De Guzman', startDate: '2026-07-01', endDate: '2026-11-30', completion: 0, status: 'On Track', duration: 152 },
  { id: '14', name: "Homeowner's Online v2", project: "Homeowner's Online v2", owner: "Homeowner's Online v2", developer: 'Mark Ian Reyes', startDate: '2026-07-01', endDate: '2026-11-30', completion: 0, status: 'On Track', duration: 152 },
  { id: '15', name: "Homeowner's Online v2", project: "Homeowner's Online v2", owner: "Homeowner's Online v2", developer: 'John Rosh Birador', startDate: '2026-07-01', endDate: '2026-11-30', completion: 0, status: 'On Track', duration: 152 },
  { id: '16', name: 'Insights v1', project: 'Insights v1', owner: 'Insights v1', developer: 'Frytz Albert De Guzman', startDate: '2026-08-01', endDate: '2026-09-01', completion: 0, status: 'On Track', duration: 31 },
  { id: '17', name: 'Insights v2', project: 'Insights v2', owner: 'Insights v2', developer: 'Frytz Albert De Guzman', startDate: '2026-09-01', endDate: '2026-10-01', completion: 0, status: 'On Track', duration: 30 },
  { id: '18', name: 'Insights v3', project: 'Insights v3', owner: 'Insights v3', developer: 'Frytz Albert De Guzman', startDate: '2026-10-01', endDate: '2026-11-01', completion: 0, status: 'On Track', duration: 31 },
  { id: '19', name: 'Marketing Information System v1', project: 'Marketing Information System v1', owner: 'Marketing Information System v1', developer: 'Steven Rey Enales', startDate: '2025-12-08', endDate: '2026-01-10', completion: 100, status: 'Completed', duration: 33 },
  { id: '20', name: 'Marketing Information System v2', project: 'Marketing Information System v2', owner: 'Marketing Information System v2', developer: 'Steven Rey Enales', startDate: '2025-11-13', endDate: '2026-03-07', completion: 90, status: 'At Risk', duration: 114 },
  { id: '21', name: 'Online Billing System v2', project: 'Online Billing System v2', owner: 'Online Billing System v2', developer: 'Jerald Aparri', startDate: '2025-12-15', endDate: '2026-04-20', completion: 65, status: 'Delayed', duration: 126 },
  { id: '22', name: 'Procurement System v2', project: 'Procurement System v2', owner: 'Procurement System v2', developer: 'Manuel L. Robles, Jr.', startDate: '2025-12-01', endDate: '2026-01-19', completion: 100, status: 'Completed', duration: 49 },
  { id: '23', name: 'Procurement System v3', project: 'Procurement System v3', owner: 'Procurement System v3', developer: 'Manuel L. Robles, Jr.', startDate: '2026-01-02', endDate: '2026-02-11', completion: 100, status: 'Completed', duration: 40 },
  { id: '24', name: 'Procurement System v4', project: 'Procurement System v4', owner: 'Procurement System v4', developer: 'Manuel L. Robles, Jr.', startDate: '2026-02-02', endDate: '2026-03-24', completion: 40, status: 'On Track', duration: 50 },
  { id: '25', name: 'Procurement System v5', project: 'Procurement System v5', owner: 'Procurement System v5', developer: 'Manuel L. Robles, Jr.', startDate: '2026-02-03', endDate: '2026-05-05', completion: 20, status: 'On Track', duration: 91 },
  { id: '26', name: 'Procurement System v6', project: 'Procurement System v6', owner: 'Procurement System v6', developer: 'Manuel L. Robles, Jr.', startDate: '2026-02-13', endDate: '2026-03-15', completion: 30, status: 'At Risk', duration: 30 },
  { id: '27', name: 'Procurement System v7', project: 'Procurement System v7', owner: 'Procurement System v7', developer: 'Manuel L. Robles, Jr.', startDate: '2026-05-16', endDate: '2026-08-08', completion: 0, status: 'On Track', duration: 84 },
  { id: '28', name: 'Procurement System v8', project: 'Procurement System v8', owner: 'Procurement System v8', developer: 'Manuel L. Robles, Jr.', startDate: '2026-06-16', endDate: '2026-09-07', completion: 0, status: 'On Track', duration: 83 },
  { id: '29', name: 'Procurement System v9', project: 'Procurement System v9', owner: 'Procurement System v9', developer: 'Manuel L. Robles, Jr.', startDate: '2026-06-01', endDate: '2026-12-29', completion: 0, status: 'On Track', duration: 211 },
  { id: '30', name: "Seller's App", project: "Seller's App", owner: "Seller's App", developer: 'Frytz Albert De Guzman', startDate: '2026-07-01', endDate: '2026-12-29', completion: 0, status: 'On Track', duration: 181 },
  { id: '31', name: "Seller's App (Front-end)", project: "Seller's App (Front-end)", owner: "Seller's App (Front-end)", developer: 'Mark Ian Reyes', startDate: '2026-07-01', endDate: '2026-12-29', completion: 0, status: 'On Track', duration: 181 },
  { id: '32', name: "Seller's App (Back-end)", project: "Seller's App (Back-end)", owner: "Seller's App (Back-end)", developer: 'John Rosh Birador', startDate: '2026-07-01', endDate: '2026-12-29', completion: 0, status: 'On Track', duration: 181 },
  { id: '33', name: 'TITLE System', project: 'TITLE System', owner: 'TITLE System', developer: 'John Rosh Birador', startDate: '2026-01-16', endDate: '2026-10-16', completion: 15, status: 'On Track', duration: 273 },
  { id: '34', name: 'Warehouse Mobile App v2', project: 'Warehouse Mobile App v2', owner: 'Warehouse Mobile App v2', developer: 'Manuel L. Robles, Jr.', startDate: '2026-02-03', endDate: '2026-05-05', completion: 15, status: 'On Track', duration: 91 },
  { id: '35', name: 'Warehouse Mobile App v3', project: 'Warehouse Mobile App v3', owner: 'Warehouse Mobile App v3', developer: 'Manuel L. Robles, Jr.', startDate: '2026-03-17', endDate: '2026-06-08', completion: 0, status: 'On Track', duration: 83 },
  { id: '36', name: 'Warehouse Mobile App v4', project: 'Warehouse Mobile App v4', owner: 'Warehouse Mobile App v4', developer: 'Manuel L. Robles, Jr.', startDate: '2026-07-17', endDate: '2026-10-08', completion: 0, status: 'On Track', duration: 83 },
  { id: '37', name: 'Warehouse Audit Module', project: 'Warehouse Audit Module', owner: 'Warehouse Audit Module', developer: 'Manuel L. Robles, Jr.', startDate: '2026-09-01', endDate: '2026-10-01', completion: 0, status: 'On Track', duration: 30 },
  { id: '38', name: 'Warehouse Audit Mobile App', project: 'Warehouse Audit Mobile App', owner: 'Warehouse Audit Mobile App', developer: 'Manuel L. Robles, Jr.', startDate: '2026-09-15', endDate: '2026-10-15', completion: 0, status: 'On Track', duration: 30 },
  { id: '39', name: 'CCTV Upgrades', project: 'CCTV Upgrades', owner: 'CCTV Upgrades', developer: 'External Developer', startDate: '2026-07-17', endDate: '2026-10-08', completion: 0, status: 'On Track', duration: 83 },
  { id: '40', name: 'Plate Number Recognition and Barrier', project: 'Plate Number Recognition and Barrier', owner: 'Plate Number Recognition and Barrier', developer: 'External Developer', startDate: '2026-07-17', endDate: '2026-10-08', completion: 0, status: 'On Track', duration: 83 },
  { id: '41', name: 'Additional Security Tech', project: 'Additional Security Tech', owner: 'Additional Security Tech', developer: 'External Developer', startDate: '2026-07-17', endDate: '2026-10-08', completion: 0, status: 'On Track', duration: 83 },
  { id: '42', name: 'IT Infrastructure Upgrade', project: 'IT Infrastructure Upgrade', owner: 'IT Infrastructure Upgrade', developer: 'External Developer', startDate: '2026-07-17', endDate: '2026-10-08', completion: 0, status: 'On Track', duration: 83 }
];
