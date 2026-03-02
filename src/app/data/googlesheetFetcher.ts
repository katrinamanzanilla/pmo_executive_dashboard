import { Task } from "./mockData";

const calculateDuration = (start: string, end: string) => {
  if (!start || !end) return 0;

  const s = new Date(start);
  const e = new Date(end);

  return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
};

export const fetchTasksFromSheet = async (
  csvUrl: string
): Promise<Task[]> => {
  const response = await fetch(csvUrl);
  const csvText = await response.text();

  const rows = csvText.split("\n").slice(1);

  return rows
    .filter((row) => row.trim() !== "")
    .map((row) => {
      const [
        id,
        name,
        project,
        owner,
        developer,
        startDate,
        actualStartDate,
        endDate,
        completion,
        status
      ] = row.split(",");

      return {
        id: id?.trim(),
        name: name?.trim(),
        project: project?.trim(),
        owner: owner?.trim(),
        developer: developer?.trim(),
        startDate: startDate?.trim(),
        actualStartDate: actualStartDate?.trim() || undefined,
        endDate: endDate?.trim(),
        completion: Number(completion),
        status: status?.trim() as Task["status"],
        duration: calculateDuration(startDate, endDate)
      };
    });
};
