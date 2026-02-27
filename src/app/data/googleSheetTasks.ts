import { Task } from './mockData';

const TASK_STATUS = ['On Track', 'At Risk', 'Delayed', 'Completed'] as const;

const GOOGLE_SHEET_SOURCE_URL =
  'https://docs.google.com/spreadsheets/d/1ird1GflQtFKbc_kVr2_RhqMmOyaRwoQd/edit?usp=sharing&ouid=111053509787740026380&rtpof=true&sd=true';

const headerAliases: Record<string, string[]> = {
  id: ['id', 'task id', 'taskid'],
  name: ['name', 'task', 'task name', 'title', 'modules/features/improvements'],
  project: ['project', 'project name', 'system'],
  assignedPM: ['assigned pm', 'owner', 'pm'],
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

  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    const next = csv[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i += 1;
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
      if (char === '\r' && next === '\n') {
        i += 1;
      }
      row.push(value.trim());
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      value = '';
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
@@ -111,27 +141,74 @@ const getSheetCsvUrl = () => {

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
    assignedPM: getColumnIndex(headers, headerAliases.assignedPM),
    developer: getColumnIndex(headers, headerAliases.developer),
    startDate: getColumnIndex(headers, headerAliases.startDate),
    actualStartDate: getColumnIndex(headers, headerAliases.actualStartDate),
    endDate: getColumnIndex(headers, headerAliases.endDate),
    completion: getColumnIndex(headers, headerAliases.completion),
    status: getColumnIndex(headers, headerAliases.status),
  };

  return dataRows
    .map((row, rowIndex) => {
      const name = indexMap.name >= 0 ? row[indexMap.name] ?? '' : '';
      const project = indexMap.project >= 0 ? row[indexMap.project] ?? '' : '';
      const assignedPM = indexMap.assignedPM >= 0 ? row[indexMap.assignedPM] ?? '' : '';
      const developer = indexMap.developer >= 0 ? row[indexMap.developer] ?? '' : '';
      const startDateRaw = indexMap.startDate >= 0 ? row[indexMap.startDate] ?? '' : '';
      const endDateRaw = indexMap.endDate >= 0 ? row[indexMap.endDate] ?? '' : '';
      const startDate = normalizeDate(startDateRaw);
      const endDate = normalizeDate(endDateRaw);

      if (!name || !project || !assignedPM || !developer || !startDate || !endDate) {
        return null;
      }

      const completionRaw = indexMap.completion >= 0 ? row[indexMap.completion] ?? '' : '';
      const completion = normalizeCompletion(completionRaw);
      const statusRaw = indexMap.status >= 0 ? row[indexMap.status] ?? '' : '';
      const status = normalizeStatus(statusRaw, completion);
      const actualStartDateRaw =
        indexMap.actualStartDate >= 0 ? row[indexMap.actualStartDate] ?? '' : '';
      const actualStartDate = normalizeDate(actualStartDateRaw);
      const idValue = indexMap.id >= 0 ? row[indexMap.id] ?? '' : '';

      return {
        id: idValue || `${rowIndex + 1}`,
        name,
        project,
        assignedPM,
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
