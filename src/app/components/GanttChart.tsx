import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Task, getDateOffset } from "../data/mockData";

interface GanttChartProps {
  tasks: Task[];
}

type MarkerType = "AS" | "TS" | "TE";

const MARKER_LABELS: Record<MarkerType, string> = {
  AS: "Actual Start",
  TS: "Target Start",
  TE: "Target End",
};

const MARKER_COLORS: Record<MarkerType, string> = {
  AS: "#2563EB",
  TS: "#7C3AED",
  TE: "#DC2626",
};

const clampPercent = (value: number) =>
  Math.max(0, Math.min(100, value));

const stringToHue = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = value.charCodeAt(index) + ((hash << 5) - hash);
  }

  return Math.abs(hash) % 360;
};

const getDeveloperColors = (developer: string) => {
  const hue = stringToHue(developer);

  return {
    solid: `hsl(${hue} 72% 42%)`,
    soft: `hsl(${hue} 72% 90%)`,
  };
};

const formatMarkerTooltip = (label: string, dateStr: string) => {
  const fullDate = new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return `${label} — ${fullDate}`;
};

export function GanttChart({ tasks }: GanttChartProps) {
  const timelineTasks = useMemo(
    () =>
      tasks.map((task) => ({
        ...task,
        actualStartDate: task.startDate,
        targetStartDate: task.startDate,
        targetEndDate: task.endDate,
      })),
    [tasks],
  );

  const hasTasks = timelineTasks.length > 0;

  const minOffset = hasTasks
    ? Math.min(
        ...timelineTasks.map((task) =>
          getDateOffset(task.targetStartDate),
        ),
      )
    : 0;

  const maxOffset = hasTasks
    ? Math.max(
        ...timelineTasks.map((task) =>
          getDateOffset(task.targetEndDate),
        ),
      )
    : 0;

  const totalDays = Math.max(1, maxOffset - minOffset);

  return (
    <Card className="mb-6 shadow-[0px_8px_24px_rgba(0,0,0,0.05)]">
      <CardHeader>
        <CardTitle>Project Timeline</CardTitle>
      </CardHeader>

      <CardContent>
        {!hasTasks ? (
          <div className="rounded-md border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-[#6B7280]">
            No tasks to display.
          </div>
        ) : (
          <div className="space-y-4">
            {timelineTasks.map((task) => {
              const targetStartOffset =
                getDateOffset(task.targetStartDate) -
                minOffset;
              const actualStartOffset =
                getDateOffset(task.actualStartDate) -
                minOffset;
              const targetEndOffset =
                getDateOffset(task.targetEndDate) -
                minOffset;

              const leftPercent =
                (targetStartOffset / totalDays) * 100;
              const widthPercent =
                (task.duration / totalDays) * 100;
              const actualStartPercent = clampPercent(
                (actualStartOffset / totalDays) * 100,
              );
              const targetStartPercent = clampPercent(
                (targetStartOffset / totalDays) * 100,
              );
              const targetEndPercent = clampPercent(
                (targetEndOffset / totalDays) * 100,
              );

              const developerColors = getDeveloperColors(
                task.developer,
              );
              const completedPercent = clampPercent(
                task.completion,
              );

              return (
                <div
                  key={task.id}
                  className="flex flex-col gap-2 md:flex-row md:items-center"
                >
                  <div className="md:w-64 truncate pr-2 text-sm font-medium text-[#111827]">
                    {task.name}
                  </div>

                  <div className="relative h-14 flex-1 rounded border border-gray-200 bg-gray-50">
                    <div
                      className="absolute top-1/2 z-20 h-8 -translate-y-1/2 overflow-hidden rounded px-2 text-xs font-medium text-white shadow-sm transition-all duration-700 ease-out"
                      style={{
                        left: `${leftPercent}%`,
                        width: `${Math.max(widthPercent, 10)}%`,
                        backgroundColor: developerColors.soft,
                      }}
                    >
                      <div
                        className="absolute inset-y-0 left-0 transition-all duration-700 ease-out"
                        style={{
                          width: `${completedPercent}%`,
                          backgroundColor: developerColors.solid,
                        }}
                      />

                      <div className="relative z-10 flex w-full items-center justify-between gap-2 px-1">
                        <span className="truncate text-[#0F172A] mix-blend-multiply">
                          {task.developer}
                        </span>
                        <span className="shrink-0 text-[#0F172A]">
                          {task.completion}%
                        </span>
                      </div>
                    </div>

                    {([
                      {
                        type: "AS" as MarkerType,
                        percent: actualStartPercent,
                        date: task.actualStartDate,
                      },
                      {
                        type: "TS" as MarkerType,
                        percent: targetStartPercent,
                        date: task.targetStartDate,
                      },
                      {
                        type: "TE" as MarkerType,
                        percent: targetEndPercent,
                        date: task.targetEndDate,
                      },
                    ]).map((marker) => (
                      <div
                        key={`${task.id}-${marker.type}`}
                        className="group absolute inset-y-1 z-10 w-2 -translate-x-1/2 transition-all duration-700 ease-out"
                        style={{ left: `${marker.percent}%` }}
                      >
                        <div
                          className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2"
                          style={{
                            backgroundColor:
                              MARKER_COLORS[marker.type],
                          }}
                        />

                        <div className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[#0F172A] px-2 py-1 text-[10px] font-medium text-white shadow-md group-hover:block">
                          {formatMarkerTooltip(
                            MARKER_LABELS[marker.type],
                            marker.date,
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
