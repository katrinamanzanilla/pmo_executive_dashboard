der)),
  );
};

const extractSheetId = (sourceUrl: string) => {
  const match = sourceUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) {
    throw new Error('Invalid Google Sheets URL.');
  }
  return match[1];
};

const getSheetCsvUrl = (sourceUrl: string) => {
  const sheetId = extractSheetId(sourceUrl);
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
};

const normalizeDate = (value: string) => {
  if (!value) return '';

  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) {
    return direct.toISOString().slice(0, 10);
  }

  const mdYMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!mdYMatch) return '';

  const month = Number(mdYMatch[1]);
  const day = Number(mdYMatch[2]);
  const year = Number(mdYMatch[3].length === 2 ? `20${mdYMatch[3]}` : mdYMatch[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
};

const normalizeCompletion = (value: string) => {
  const numeric = Number.parseFloat(value.replace('%', '').trim());
  if (Number.isNaN(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
};

const normalizeStatus = (value: string, completion: number): Task['status'] => {
  const normalized = value.trim();
  const found = TASK_STATUS.find(
    (status) => status.toLowerCase() === normalized.toLowerCase(),
  );

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

  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const fetchTasksFromGoogleSheet = async (
  sourceUrl: string = DEFAULT_GOOGLE_SHEET_SOURCE_URL,
): Promise<Task[]> => {
  const response = await fetch(getSheetCsvUrl(sourceUrl), {
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
      const owner = indexMap.assignedPM >= 0 ? row[indexMap.assignedPM] ?? '' : '';
      const developer = indexMap.developer >= 0 ? row[indexMap.developer] ?? '' : '';
      const startDateRaw = indexMap.startDate >= 0 ? row[indexMap.startDate] ?? '' : '';
      const endDateRaw = indexMap.endDate >= 0 ? row[indexMap.endDate] ?? '' : '';
      const startDate = normalizeDate(startDateRaw);
      const endDate = normalizeDate(endDateRaw);

      if (!name || !project || !owner || !developer || !startDate || !endDate) {
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
