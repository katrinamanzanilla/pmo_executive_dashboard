import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Task, getDateOffset } from "../data/mockData";

interface GanttChartProps {
  tasks: Task[];
}

type FilterColumn =
  | "name"
  | "project"
  | "owner"
  | "developer"
  | "status"
  | "startDate"
  | "endDate";

type MarkerType = "AS" | "TS" | "TE";

const FILTER_COLUMN_OPTIONS: { value: FilterColumn; label: string }[] = [
  { value: "project", label: "Project" },
  { value: "name", label: "Task" },
  { value: "owner", label: "Owner" },
  { value: "developer", label: "Developer" },
  { value: "status", label: "Status" },
  { value: "startDate", label: "Start Date" },
  { value: "endDate", label: "End Date" },
];

const MARKER_LABELS: Record<MarkerType, string> = {
  AS: "Actual Start",
  TS: "Target Start",
  TE: "Target End",
};

const formatFilterDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

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
  const [selectedColumn, setSelectedColumn] =
    useState<FilterColumn>("project");
  const [columnSearch, setColumnSearch] = useState("");

  const filteredTasks = useMemo(() => {
    const searchTerm = columnSearch.trim().toLowerCase();
    if (!searchTerm) return tasks;

    return tasks.filter((task) => {
      const lookup: Record<FilterColumn, string> = {
        name: task.name,
        project: task.project,
        owner: task.owner,
        developer: task.developer,
        status: task.status,
        startDate: `${task.startDate} ${formatFilterDate(task.startDate)}`,
        endDate: `${task.endDate} ${formatFilterDate(task.endDate)}`,
      };

      return lookup[selectedColumn]
        .toLowerCase()
        .includes(searchTerm);
    });
  }, [tasks, selectedColumn, columnSearch]);

  const timelineTasks = useMemo(
    () =>
      filteredTasks.map((task) => ({
        ...task,
        actualStartDate: task.startDate,
        targetStartDate: task.startDate,
        targetEndDate: task.endDate,
      })),
    [filteredTasks],
  );

  const hasProjects = timelineTasks.length > 0;

  const minDate = hasProjects
    ? new Date(
        Math.min(
          ...timelineTasks.map((task) =>
            new Date(task.targetStartDate).getTime(),
          ),
        ),
      )
    : null;

  const maxDate = hasProjects
    ? new Date(
        Math.max(
          ...timelineTasks.map((task) =>
            new Date(task.targetEndDate).getTime(),
          ),
        ),
      )
    : null;

  const minOffset = hasProjects
    ? Math.min(
        ...timelineTasks.map((task) =>
          getDateOffset(task.targetStartDate),
        ),
      )
    : 0;

  const maxOffset = hasProjects
    ? Math.max(
        ...timelineTasks.map((task) =>
          getDateOffset(task.targetEndDate),
        ),
      )
    : 0;

  const totalDays = Math.max(1, maxOffset - minOffset);

  const timelineMonths = useMemo(() => {
    if (!minDate || !maxDate) return [] as Date[];

    const months: Date[] = [];
    const cursor = startOfMonth(minDate);
    const end = startOfMonth(maxDate);

    while (cursor <= end) {
      months.push(new Date(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return months;
  }, [minDate, maxDate]);

  return (
    <Card className="mb-6 shadow-[0px_8px_24px_rgba(0,0,0,0.05)]">
      <CardHeader>
        <CardTitle className="flex flex-col gap-3">
          <span>Project Timeline</span>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={selectedColumn}
              onChange={(event) =>
                setSelectedColumn(event.target.value as FilterColumn)
              }
            >
              {FILTER_COLUMN_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm sm:w-80"
              value={columnSearch}
              onChange={(event) =>
                setColumnSearch(event.target.value)
              }
              placeholder={`Search by ${FILTER_COLUMN_OPTIONS.find((option) => option.value === selectedColumn)?.label ?? "Project"}`}
            />
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {!hasProjects ? (
          <div className="rounded-md border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-[#6B7280]">
            No projects match the selected column search.
          </div>
        ) : (
          <div>
            <div className="mb-3 flex items-center border-b border-gray-200 pb-2">
              <div className="w-64 text-xs font-semibold uppercase text-[#6B7280]">
                Tasks
              </div>

              <div className="ml-4 flex flex-1 border-x border-gray-200">
                {timelineMonths.map((month) => (
                  <div
                    key={`${month.getFullYear()}-${month.getMonth()}`}
                    className="flex-1 border-r border-gray-200 text-center text-xs font-semibold text-[#6B7280] last:border-r-0"
                  >
                    {month.toLocaleDateString("en-US", {
                      month: "short",
                    })}
                  </div>
                ))}
              </div>
            </div>

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

                const showActualStart =
                  task.actualStartDate !== task.targetStartDate;
                const developerColors = getDeveloperColors(
                  task.developer,
                );
                const completedPercent = clampPercent(
                  task.completion,
                );

                return (
                  <div key={task.id} className="flex items-center">
                    <div className="w-64 truncate pr-2 text-sm font-medium text-[#111827]">
                      {task.name}
                    </div>

                    <div className="relative ml-4 h-14 flex-1 rounded border border-gray-200 bg-gray-50">
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
                          visible: showActualStart,
                        },
                        {
                          type: "TS" as MarkerType,
                          percent: targetStartPercent,
                          date: task.targetStartDate,
                          visible: true,
                        },
                        {
                          type: "TE" as MarkerType,
                          percent: targetEndPercent,
                          date: task.targetEndDate,
                          visible: true,
                        },
                      ]).map((marker) =>
                        marker.visible ? (
                          <div
                            key={`${task.id}-${marker.type}`}
                            className="group absolute inset-y-1 z-10 w-2 -translate-x-1/2"
                            style={{ left: `${marker.percent}%` }}
                          >
                            <div
                              className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2"
                              style={{
                                backgroundColor:
                                  developerColors.solid,
                              }}
                            />

                            <div className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[#0F172A] px-2 py-1 text-[10px] font-medium text-white shadow-md group-hover:block">
                              {formatMarkerTooltip(
                                MARKER_LABELS[marker.type],
                                marker.date,
                              )}
                            </div>
                          </div>
                        ) : null,
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
