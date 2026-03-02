import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export interface Task {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  developer: string;
  actualStartDate?: string;
}

interface GanttChartProps {
  tasks: Task[];
}

const developerColorMap: Record<
  string,
  { soft: string; solid: string }
> = {
  "Jane Acebuche": { soft: "#FDE68A", solid: "#D97706" },
  "Frederick Bryan Laroya": { soft: "#FCA5A5", solid: "#DC2626" },
  "John Ivan": { soft: "#BFDBFE", solid: "#2563EB" },
  Default: { soft: "#DDD6FE", solid: "#7C3AED" },
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString();
};

export function GanttChart({ tasks }: GanttChartProps) {
  if (!tasks || tasks.length === 0) return null;

  const startDates = tasks.map((t) =>
    new Date(t.startDate).getTime()
  );
  const endDates = tasks.map((t) =>
    new Date(t.endDate).getTime()
  );

  const projectStart = Math.min(...startDates);
  const projectEnd = Math.max(...endDates);
  const totalDuration = projectEnd - projectStart || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Gantt Timeline</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {tasks.map((task) => {
          const start = new Date(task.startDate).getTime();
          const end = new Date(task.endDate).getTime();

          const left =
            ((start - projectStart) / totalDuration) * 100;
          const width =
            ((end - start) / totalDuration) * 100;

          const hasValidActualStart =
            task.actualStartDate &&
            !isNaN(Date.parse(task.actualStartDate));

          const developerColors =
            developerColorMap[task.developer] ||
            developerColorMap.Default;

          return (
            <div key={task.id} className="space-y-2">
              <div className="text-sm font-medium text-gray-700">
                {task.name}
              </div>

              <div className="relative h-8 w-full rounded bg-gray-200">
                <div
                  className="group relative h-full rounded px-3 text-xs font-medium text-gray-900 shadow-sm flex items-center"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    backgroundColor: developerColors.soft,
                    position: "absolute",
                  }}
                >
                  {/* ✅ Small colored strip (only if Actual Start exists) */}
                  {hasValidActualStart && (
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l"
                      style={{
                        backgroundColor:
                          developerColors.solid,
                      }}
                    />
                  )}

                  {/* ✅ Tooltip on hover */}
                  {hasValidActualStart && (
                    <div className="pointer-events-none absolute -top-8 left-3 hidden whitespace-nowrap rounded bg-[#0F172A] px-2 py-1 text-[10px] font-medium text-white shadow-md group-hover:block">
                      Actual Start Date:{" "}
                      {formatDate(task.actualStartDate!)}
                    </div>
                  )}

                  <span className="truncate">
                    {task.developer}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
