import { Task } from './mockData';

const TASK_STATUS = ['On Track', 'At Risk', 'Delayed', 'Completed'] as const;

const GOOGLE_SHEET_SOURCE_URL =
  'https://docs.google.com/spreadsheets/d/1ird1GflQtFKbc_kVr2_RhqMmOyaRwoQd/edit?usp=sharing&ouid=111053509787740026380&rtpof=true&sd=true';

const headerAliases: Record<string, string[]> = {
  id: ['id', 'task id', 'taskid'],
  name: ['name', 'task', 'task name', 'title'],
  project: ['project', 'project name', 'system'],
  owner: ['owner', 'assigned pm', 'pm'],
  developer: ['developer', 'assignee', 'resource'],
  startDate: ['start date', 'target start', 'planned start', 'start'],
  actualStartDate: ['actual start', 'actual start date'],
  endDate: ['end date', 'target end', 'planned end', 'finish date', 'end'],
  completion: ['completion', 'progress', 'percent complete', '% complete'],
  status: ['status'],
};

const normalizeHeader = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

const csvToRows = (csv: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let inQuotes = false;
@@ -59,121 +62,104 @@ const csvToRows = (csv: string): string[][] => {
      continue;
    }

    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value.trim());
    if (row.some((cell) => cell.length > 0)) {
      rows.push(row);
    }
  }

  return rows;
};

const getColumnIndex = (headers: string[], aliases: string[]) => {
  const normalizedAliases = aliases.map(normalizeHeader);
  return headers.findIndex((header) =>
    normalizedAliases.includes(normalizeHeader(header)),
  );
};

const normalizeDate = (value: string) => {
  if (!value) return '';

  const sheetSerialDate = Number(value);
  if (!Number.isNaN(sheetSerialDate) && Number.isFinite(sheetSerialDate)) {
    const date = new Date(Date.UTC(1899, 11, 30) + sheetSerialDate * 86400000);
    const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
    const day = `${date.getUTCDate()}`.padStart(2, '0');
    return `${date.getUTCFullYear()}-${month}-${day}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  const month = `${parsed.getMonth() + 1}`.padStart(2, '0');
  const day = `${parsed.getDate()}`.padStart(2, '0');
  return `${parsed.getFullYear()}-${month}-${day}`;
};

const computeDuration = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const normalizeCompletion = (value: string) => {
  const numeric = Number.parseFloat(value.replace('%', ''));
  if (Number.isNaN(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
};

const normalizeStatus = (value: string, completion: number): Task['status'] => {
  const matched = TASK_STATUS.find(
    (status) => status.toLowerCase() === value.trim().toLowerCase(),
  );
  if (matched) return matched;
  if (completion >= 100) return 'Completed';
  return 'On Track';
};

const getSheetCsvUrl = () => {
  const parsed = new URL(GOOGLE_SHEET_SOURCE_URL);
  const match = parsed.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);

  if (!match) {
    throw new Error('Invalid Google Sheet URL configured for task source.');
  }

  const sheetId = match[1];
  const gid = parsed.searchParams.get('gid');

  if (gid) {
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  }

  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
};

export const fetchTasksFromGoogleSheet = async (): Promise<Task[]> => {
  const response = await fetch(getSheetCsvUrl(), {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Google Sheet request failed: ${response.status}`);
  }

  const csv = await response.text();
  const rows = csvToRows(csv);
  const [headers, ...dataRows] = rows;

  if (!headers || headers.length === 0) {
    return [];
  }

  const indexMap = {
    id: getColumnIndex(headers, headerAliases.id),
    name: getColumnIndex(headers, headerAliases.name),
    project: getColumnIndex(headers, headerAliases.project),
    owner: getColumnIndex(headers, headerAliases.owner),
    developer: getColumnIndex(headers, headerAliases.developer),
