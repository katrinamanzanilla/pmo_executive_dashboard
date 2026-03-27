import { Task } from './mockData';

const TASK_STATUS = ['On Track', 'At Risk', 'Delayed', 'Completed'] as const;

export const DEFAULT_GOOGLE_SHEET_SOURCE_URL =
  'https://docs.google.com/spreadsheets/d/1HAZYTluN6KdsfQJdl5tYQdmhFgSmB_iT/edit?gid=1587098703#gid=1587098703';

const headerAliases: Record<string, string[]> = {
  id:             ['id', 'task id', 'taskid'],
  name:           ['name', 'task', 'task name', 'title', 'modules/features/improvements'],
  project:        ['project', 'project name', 'system'],
  assignedPM:     ['assigned pm', 'owner', 'pm'],
  developer:      ['developer', 'assignee', 'resource'],
  startDate:      ['start date', 'target start', 'planned start', 'start'],
  actualStartDate:['actual start', 'actual start date'],
  endDate:        ['end', 'target end', 'planned end', 'finish date'],
  completion:     ['completion', 'progress', 'percent complete', '% complete'],
  status:         ['status'],
};

const normalizeHeader = (v: string) =>
  v.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');

// RFC-4180 CSV parser — handles quoted fields with commas and embedded newlines
const csvToRows = (csv: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let i = 0;

  while (i < csv.length) {
    if (csv[i] === '"') {
      i++;
      let value = '';
      while (i < csv.length) {
        if (csv[i] === '"') {
          if (csv[i + 1] === '"') { value += '"'; i += 2; }
          else { i++; break; }
        } else { value += csv[i]; i++; }
      }
      row.push(value.trim());
      if (csv[i] === ',') i++;
      else if (csv[i] === '\r' && csv[i + 1] === '\n') { i += 2; if (row.some(c => c.length > 0)) rows.push(row); row = []; }
      else if (csv[i] === '\n' || csv[i] === '\r')     { i++;    if (row.some(c => c.length > 0)) rows.push(row); row = []; }
    } else {
      let value = '';
      while (i < csv.length && csv[i] !== ',' && csv[i] !== '\n' && csv[i] !== '\r') { value += csv[i]; i++; }
      row.push(value.trim());
      if (csv[i] === ',') i++;
      else if (csv[i] === '\r' && csv[i + 1] === '\n') { i += 2; if (row.some(c => c.length > 0)) rows.push(row); row = []; }
      else if (csv[i] === '\n' || csv[i] === '\r')     { i++;    if (row.some(c => c.length > 0)) rows.push(row); row = []; }
    }
  }
  if (row.some(c => c.length > 0)) rows.push(row);
  return rows;
};

const getColumnIndex = (headers: string[], aliases: string[]) => {
  const norm = aliases.map(normalizeHeader);
  return headers.findIndex(h => norm.includes(normalizeHeader(h)));
};

const getSheetCsvUrl = (sourceUrl: string) => {
  const match = sourceUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) throw new Error('Invalid Google Sheets URL.');
  return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
};

const normalizeDate = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const numeric = Number(trimmed);
  if (!Number.isNaN(numeric) && /^\d+(?:\.\d+)?$/.test(trimmed)) {
    const d = new Date(Date.UTC(1899, 11, 30 + Math.floor(numeric)));
    return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  }

  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) return direct.toISOString().slice(0, 10);

  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const [, a, b, y] = slashMatch.map(Number);
    const year = y < 100 ? 2000 + y : y;
    const month = a > 12 ? b : a;
    const day   = a > 12 ? a : b;
    const d = new Date(Date.UTC(year, month - 1, day));
    return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  }

  const dashMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if (dashMatch) {
    const [, a, b, y] = dashMatch.map(Number);
    const year = y < 100 ? 2000 + y : y;
    const month = a > 12 ? b : a;
    const day   = a > 12 ? a : b;
    const d = new Date(Date.UTC(year, month - 1, day));
    return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  }

  return '';
};

const normalizeCompletion = (value: string) => {
  const n = Number.parseFloat(value.replace('%', '').trim());
  return Number.isNaN(n) ? 0 : Math.max(0, Math.min(100, Math.round(n)));
};

// Maps raw sheet status → Task['status'] for Gantt/KPI use.
// Original value is preserved in rawStatus.
const normalizeStatus = (value: string, completion: number): Task['status'] => {
  const s = value.trim().toLowerCase();
  const found = TASK_STATUS.find(t => t.toLowerCase() === s);
  if (found) return found;
  if (['ongoing', 'on going', 'in progress', 'not yet started', 'not started'].includes(s)) return 'On Track';
  if (['completed', 'done'].includes(s))      return 'Completed';
  if (['on hold', 'cancelled'].includes(s))   return 'Delayed';
  if (completion >= 100) return 'Completed';
  if (completion <= 0)   return 'On Track';
  return 'At Risk';
};

const computeDuration = (start: string, end: string) => {
  const s = new Date(start), e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0;
  return Math.max(0, Math.ceil((e.getTime() - s.getTime()) / 86400000));
};

export const fetchTasksFromGoogleSheet = async (
  sourceUrl: string = DEFAULT_GOOGLE_SHEET_SOURCE_URL,
): Promise<Task[]> => {
  const response = await fetch(getSheetCsvUrl(sourceUrl));
  const csvText  = await response.text();
  const rows     = csvToRows(csvText);
  if (!rows.length) return [];

  const headerRow = rows[0];
  const idx: Record<keyof typeof headerAliases, number> = {} as any;
  for (const key of Object.keys(headerAliases) as (keyof typeof headerAliases)[]) {
    idx[key] = getColumnIndex(headerRow, headerAliases[key]);
  }

  const col = (row: string[], key: keyof typeof headerAliases) =>
    idx[key] >= 0 ? (row[idx[key]] ?? '') : '';

  return rows.slice(1).map((row, i) => {
    const startDate  = normalizeDate(col(row, 'startDate'))  || new Date().toISOString().slice(0, 10);
    const endDate    = normalizeDate(col(row, 'endDate'))    ||
      new Date(new Date(startDate).getTime() + 86400000).toISOString().slice(0, 10);
    const completion = normalizeCompletion(col(row, 'completion') || '0');
    const statusRaw  = col(row, 'status');
    const actualStartDate = normalizeDate(col(row, 'actualStartDate'));
    const idValue    = col(row, 'id');

    return {
      id:         idValue ? `${idValue.trim()}-${i + 2}` : `${i + 2}`,
      name:       col(row, 'name'),
      project:    col(row, 'project'),
      owner:      col(row, 'assignedPM'),
      developer:  col(row, 'developer'),
      startDate,
      endDate,
      ...(actualStartDate ? { actualStartDate } : {}),
      completion,
      status:     normalizeStatus(statusRaw, completion),
      rawStatus:  statusRaw.trim() || '—',
      duration:   computeDuration(startDate, endDate),
    } as Task;
  });
};
