// googleSheetFetcher.ts
import { Task, calculateDuration, makeTask } from './mockData';

const TASK_STATUS = ['On Track', 'At Risk', 'Delayed', 'Completed'] as const;

export const fetchTasksFromGoogleSheet = async (sourceUrl: string): Promise<Task[]> => {
  const sheetIdMatch = sourceUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!sheetIdMatch) throw new Error('Invalid Google Sheets URL.');
  const sheetId = sheetIdMatch[1];
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

  const res = await fetch(csvUrl);
  const csvText = await res.text();

  const rows = csvText.split('\n').map(r => r.split(','));
  if (rows.length <= 1) return [];

  const headers = rows[0].map(h => h.trim().toLowerCase());
  const dataRows = rows.slice(1);

  return dataRows.map((row, index) => {
    const getValue = (aliases: string[]) => {
      for (const alias of aliases) {
        const idx = headers.indexOf(alias.toLowerCase());
        if (idx >= 0) return row[idx]?.trim() || '';
      }
      return '';
    };

    const name = getValue(['name', 'task name', 'title']);
    const project = getValue(['project', 'system']);
    const owner = getValue(['assigned pm', 'owner', 'pm']);
    const developer = getValue(['developer', 'assignee']);
    const startDate = getValue(['start date', 'target start']) || new Date().toISOString().slice(0, 10);
    const endDate = getValue(['end date', 'planned end']) || new Date(new Date(startDate).getTime() + 24*60*60*1000).toISOString().slice(0,10);
    const completion = parseInt(getValue(['completion', '% complete']) || '0');
    const statusRaw = getValue(['status']);
    const status: Task['status'] =
      TASK_STATUS.find(s => s.toLowerCase() === statusRaw.toLowerCase()) ||
      (completion >= 100 ? 'Completed' : completion > 0 ? 'At Risk' : 'On Track');
    const actualStartDate = getValue(['actual start date']) || undefined;

    return {
      id: `${index + 1}`,
      name,
      project,
      owner,
      developer,
      startDate,
      endDate,
      completion,
      status,
      actualStartDate,
      duration: calculateDuration(startDate, endDate),
    };
  });
};
