import { Task } from './mockData';

const TASK_STATUS = ['On Track', 'At Risk', 'Delayed', 'Completed'] as const;

export const DEFAULT_GOOGLE_SHEET_SOURCE_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSZ6uHJB0V-vVYjQTtmEY-y5xFS0VbRl6UUuiH-l1UTD89Zy_BORoh0oquiirI1Uw/pub?output=csv';

const headerAliases: Record<string, string[]> = {
  id: ['id', 'task id', 'taskid'],
  name: ['name', 'task', 'task name', 'title', 'modules/features/improvements'],
  project: ['project', 'project name', 'system'],
  assignedPM: ['assigned pm', 'owner', 'pm'],
  developer: ['developer', 'assignee', 'resource'],
  startDate: ['start date', 'target start', 'planned start', 'start'],
  actualStartDate: ['actual start', 'actual start date'],
  endDate: ['end', 'target end', 'planned end', 'finish date'],
  completion: ['completion', 'progress', 'percent complete', '% complete'],
  status: ['status'],
};

const normalizeHeader = (value: string) =>
  value.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');

const csvToRows = (csv: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const next = csv[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(value.trim());
      value = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i++;
      row.push(value.trim());
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      value = '';
      continue;
    }

    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value.trim());
    if (row.some((cell) => cell.length > 0)) rows.push(row);
  }

  return rows;
};

const getColumnIndex = (headers: string[], aliases: string[]) => {
  const normalizedAliases = aliases.map(normalizeHeader);
  return headers.findIndex((header) => normalizedAliases.includes(normalizeHeader(header)));
};

const extractSheetId = (sourceUrl: string) => {
  const match = sourceUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) throw new Error('Invalid Google Sheets URL.');
  return match[1];
};

const getSheetCsvUrl = (sourceUrl: string) => {
  const sheetId = extractSheetId(sourceUrl);
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
};

const normalizeDate = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const numeric = Number(trimmed);
  if (!Number.isNaN(numeric) && /^\d+(?:\.\d+)?$/.test(trimmed)) {
    const serialDate = new Date(Date.UTC(1899, 11, 30 + Math.floor(numeric)));
    return Number.isNaN(serialDate.getTime()) ? '' : serialDate.toISOString().slice(0, 10);
  }

  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) return direct.toISOString().slice(0, 10);

  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const first = Number(slashMatch[1]);
    const second = Number(slashMatch[2]);
    const year = slashMatch[3].length === 2 ? 2000 + Number(slashMatch[3]) : Number(slashMatch[3]);
    const month = first > 12 ? second : first;
    const day = first > 12 ? first : second;
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
  }

  const dashMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if (dashMatch) {
    const first = Number(dashMatch[1]);
    const second = Number(dashMatch[2]);
    const year = dashMatch[3].length === 2 ? 2000 + Number(dashMatch[3]) : Number(dashMatch[3]);
    const month = first > 12 ? second : first;
    const day = first > 12 ? first : second;
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
  }

  return '';
};

const normalizeCompletion = (value: string) => {
  const numeric = Number.parseFloat(value.replace('%', '').trim());
  if (Number.isNaN(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
};

const normalizeStatus = (value: string, completion: number): Task['status'] => {
  const normalized = value.trim();
  const found = TASK_STATUS.find((status) => status.toLowerCase() === normalized.toLowerCase());
  if (found) return found;
  if (completion >= 100) return 'Completed';
  if (completion <= 0) return 'On Track';
  return 'At Risk';
};

const computeDuration = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
};

export const fetchTasksFromGoogleSheet = async (
  sourceUrl: string = DEFAULT_GOOGLE_SHEET_SOURCE_URL,
): Promise<Task[]> => {
  const response = await fetch(getSheetCsvUrl(sourceUrl));
  const csvText = await response.text();
  const rows = csvToRows(csvText);
  if (!rows.length) return [];

  const headerRow = rows[0];
  const indexMap: Record<keyof typeof headerAliases, number> = {} as any;

  for (const key of Object.keys(headerAliases) as (keyof typeof headerAliases)[]) {
    indexMap[key] = getColumnIndex(headerRow, headerAliases[key]);
  }

  const dataRows = rows.slice(1);

  return dataRows
    .map((row, rowIndex) => {
      const name = indexMap.name >= 0 ? row[indexMap.name] ?? '' : '';
      const project = indexMap.project >= 0 ? row[indexMap.project] ?? '' : '';

      if (!name || !project) return null;

      const owner = indexMap.assignedPM >= 0 ? row[indexMap.assignedPM] ?? '' : '';
      const developer = indexMap.developer >= 0 ? row[indexMap.developer] ?? '' : '';
      const startDateRaw = indexMap.startDate >= 0 ? row[indexMap.startDate] ?? '' : '';
      const endDateRaw = indexMap.endDate >= 0 ? row[indexMap.endDate] ?? '' : '';

      // Default start/end dates so Gantt & charts always display
      const startDate =
        normalizeDate(startDateRaw) || new Date().toISOString().slice(0, 10);
      const endDate =
        normalizeDate(endDateRaw) ||
        new Date(new Date(startDate).getTime() + 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10);

      const completionRaw = indexMap.completion >= 0 ? row[indexMap.completion] ?? '' : '';
      const completion = normalizeCompletion(completionRaw || '0');
      const statusRaw = indexMap.status >= 0 ? row[indexMap.status] ?? '' : '';
      const status = normalizeStatus(statusRaw || '', completion);

      const actualStartDateRaw =
        indexMap.actualStartDate >= 0 ? row[indexMap.actualStartDate] ?? '' : '';
      const actualStartDate = normalizeDate(actualStartDateRaw);

      const idValue = indexMap.id >= 0 ? row[indexMap.id] ?? '' : '';
      const stableRowId = `${rowIndex + 2}`;

      return {
        id: idValue ? `${idValue.trim()}-${stableRowId}` : stableRowId,
        name,
        project,
        owner,
        developer,
        startDate,
        ...(actualStartDate ? { actualStartDate } : {}),
        endDate,
        completion,
        status,
        duration: computeDuration(startDate, endDate),
      } as Task;
    })
    .filter((task): task is Task => Boolean(task));
};
