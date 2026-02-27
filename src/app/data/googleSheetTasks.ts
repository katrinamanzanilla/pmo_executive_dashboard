import { Task } from './mockData';

const TASK_STATUS = ['On Track', 'At Risk', 'Delayed', 'Completed'] as const;

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
      if (char === '\r' && next === '\n') i += 1;
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
  const matched = TASK_STATUS.find((status) => status.toLowerCase() === value.trim().toLowerCase());
  if (matched) return matched;
  if (completion >= 100) return 'Completed';
  return 'On Track';
};

const extractGoogleSheetId = (urlOrId: string) => {
  const trimmed = urlOrId.trim();

  if (/^[a-zA-Z0-9-_]+$/.test(trimmed) && !trimmed.includes('/')) {
    return trimmed;
  }

  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match?.[1] ?? '';
};

const buildSheetCsvUrl = (sheetId: string, gid: string) =>
  `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

const getSheetCsvUrl = () => {
  const configuredUrl = import.meta.env.VITE_GOOGLE_SHEET_URL?.trim();

  if (configuredUrl) {
    const maybeSheetId = extractGoogleSheetId(configuredUrl);

    if (maybeSheetId) {
      const parsed = new URL(configuredUrl);
      const gid =
        import.meta.env.VITE_GOOGLE_SHEET_GID?.trim() ||
        parsed.searchParams.get('gid') ||
        '0';
      return buildSheetCsvUrl(maybeSheetId, gid);
    }

    return configuredUrl;
  }

  const sheetId = extractGoogleSheetId(
    import.meta.env.VITE_GOOGLE_SHEET_ID ?? '',
  );
  const gid = import.meta.env.VITE_GOOGLE_SHEET_GID ?? '0';

  if (!sheetId) {
    throw new Error(
      'Missing VITE_GOOGLE_SHEET_ID or VITE_GOOGLE_SHEET_URL configuration.',
    );
  }

  return buildSheetCsvUrl(sheetId, gid);
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
    startDate: getColumnIndex(headers, headerAliases.startDate),
    actualStartDate: getColumnIndex(headers, headerAliases.actualStartDate),
    endDate: getColumnIndex(headers, headerAliases.endDate),
    completion: getColumnIndex(headers, headerAliases.completion),
    status: getColumnIndex(headers, headerAliases.status),
  };

  return dataRows
    .map((row, rowIndex) => {
      const startDate = normalizeDate(row[indexMap.startDate] ?? '');
      const endDate = normalizeDate(row[indexMap.endDate] ?? '');
      const completion = normalizeCompletion(row[indexMap.completion] ?? '0');

      if (!startDate || !endDate) {
        return null;
      }

      const rawActualStart = normalizeDate(row[indexMap.actualStartDate] ?? '');
      const task: Task = {
        id: (row[indexMap.id] ?? `${rowIndex + 1}`).toString(),
        name: row[indexMap.name] ?? '',
        project: row[indexMap.project] ?? '',
        owner: row[indexMap.owner] ?? '',
        developer: row[indexMap.developer] ?? '',
        startDate,
        endDate,
        completion,
        status: normalizeStatus(row[indexMap.status] ?? '', completion),
        duration: computeDuration(startDate, endDate),
      };

      if (rawActualStart) {
        task.actualStartDate = rawActualStart;
      }

      return task;
    })
    .filter((task): task is Task => Boolean(task && task.project));
};
