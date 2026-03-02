import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { Task } from "../data/mockData";

interface GanttChartProps {
  tasks: Task[];
}

const developerColorMap: Record<string, { soft: string; solid: string }> = {
  "Jane Acebuche": { soft: "#60A5FA", solid: "#2563EB" },
  "John Cruz": { soft: "#34D399", solid: "#059669" },
  "Mark Reyes": { soft: "#FBBF24", solid: "#D97706" },
  "Default": { soft: "#A78BFA", solid: "#7C3AED" },
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString();
};

export default function GanttChart({ tasks }: GanttChartProps) {
  if (!tasks.length) return null;

  const startDates = tasks.map(t => new Date(t.startDate).getTime());
  const endDates = tasks.map(t => new Date(t.endDate).getTime());

  const projectStart = Math.min(...startDates);
  const projectEnd = Math.max(...endDates);
  const totalDuration = projectEnd - projectStart;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Timeline</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {tasks.map(task => {
          const start = new Date(task.startDate).getTime();
          const end = new Date(task.endDate).getTime();

          const left = ((start - projectStart) / totalDuration) * 100;
          const width = ((end - start) / totalDuration) * 100;

          const hasValidActualStart =
            task.actualStartDate && !isNaN(Date.parse(task.actualStartDate));

          const developerColors =
            developerColorMap[task.developer] ||
            developerColorMap["Default"];

          return (
            <div key={task.id} className="space-y-1">
              <div className="text-sm font-medium">{task.name}</div>

              <div className="relative h-8 w-full rounded bg-gray-200">
                <div
                  className="group/bar absolute h-full overflow-hidden rounded px-2 text-xs font-medium text-white shadow-sm flex items-center"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    backgroundColor: developerColors.soft,
                  }}
                >
                  {/* ✅ Actual Start Indicator Strip */}
                  {hasValidActualStart && (
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l"
                      style={{ backgroundColor: developerColors.solid }}
                    />
                  )}

                  {/* Tooltip */}
                  {hasValidActualStart && (
                    <div className="pointer-events-none absolute -top-8 left-3 hidden whitespace-nowrap rounded bg-[#0F172A] px-2 py-1 text-[10px] font-medium text-white shadow-md group-hover/bar:block">
                      Actual Start: {formatDate(task.actualStartDate!)}
                    </div>
                  )}

                  {task.name}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
