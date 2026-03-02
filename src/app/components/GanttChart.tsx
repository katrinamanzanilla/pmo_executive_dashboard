import React from "react";

interface Task {
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

function GanttChart({ tasks }: GanttChartProps) {
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

  const developerColors: Record<string, string> = {
    "Jane Acebuche": "#2563EB",
    "Frederick Bryan Laroya": "#DC2626",
    "John Ivan": "#16A34A",
  };

  return (
    <div className="space-y-6">
      {tasks.map((task) => {
        const start = new Date(task.startDate).getTime();
        const end = new Date(task.endDate).getTime();

        const left =
          ((start - projectStart) / totalDuration) * 100;
        const width =
          ((end - start) / totalDuration) * 100;

        const hasActual =
          task.actualStartDate &&
          !isNaN(Date.parse(task.actualStartDate));

        const devColor =
          developerColors[task.developer] || "#7C3AED";

        return (
          <div key={task.id} className="space-y-2">
            <div className="text-sm font-medium text-gray-700">
              {task.name}
            </div>

            <div className="relative h-8 w-full rounded bg-gray-200">
              <div
                className="group absolute h-full rounded flex items-center px-3 text-xs font-medium text-gray-900 shadow-sm"
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  backgroundColor: "#E5E7EB",
                }}
              >
                {hasActual && (
                  <>
                    {/* Small colored left strip */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l"
                      style={{
                        backgroundColor: devColor,
                      }}
                    />

                    {/* Tooltip */}
                    <div className="pointer-events-none absolute -top-8 left-3 hidden whitespace-nowrap rounded bg-[#0F172A] px-2 py-1 text-[10px] font-medium text-white shadow-md group-hover:block">
                      Actual Start Date:{" "}
                      {new Date(
                        task.actualStartDate!
                      ).toLocaleDateString()}
                    </div>
                  </>
                )}

                <span className="truncate">
                  {task.developer}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default GanttChart;
