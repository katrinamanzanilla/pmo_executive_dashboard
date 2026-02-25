
import { useMemo, useState } from "react";
import { useMemo } from "react";
import {
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Task, getDateOffset } from "../data/mockData";
import { Task, getDateOffset } from "../data/mockData";


interface GanttChartProps {
interface GanttChartProps {
  tasks: Task[];
  tasks: Task[];
}
}


type FilterColumn =
type MarkerType = "TS" | "TE";
  | "name"
  | "project"
  | "owner"
  | "developer"
  | "status"
  | "startDate"
  | "endDate";


type MarkerType = "AS" | "TS" | "TE";
const MARKER_LABELS: Record<MarkerType, string> = {

  TS: "Target Start",
const DAY_MS = 1000 * 60 * 60 * 24;
  TE: "Target End",
};


const MARKER_COLORS: Record<MarkerType, string> = {
const MARKER_COLORS: Record<MarkerType, string> = {
  AS: "#0EA5E9",
  TS: "#7C3AED",
  TS: "#8B5CF6",
  TE: "#DC2626",
  TE: "#DC2626",
};
};


const formatFilterDate = (dateStr: string) => {
const MARKER_ORDER: MarkerType[] = ["TS", "TE"];
  const date = new Date(dateStr);

  return date.toLocaleDateString("en-US", {
const MARKER_X_OFFSET: Record<MarkerType, number> = {
    month: "short",
  TS: -2,
    day: "numeric",
  TE: 2,
    year: "numeric",
  });
};
};


const clampPercent = (value: number) =>
  Math.max(0, Math.min(100, value));

const startOfMonth = (date: Date) =>
const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);
  new Date(date.getFullYear(), date.getMonth(), 1);


const clampPercent = (value: number) =>
const DEVELOPER_COLOR_PALETTE = [
  Math.max(0, Math.min(100, value));
  { solid: "#2563EB", soft: "#DBEAFE" },
  { solid: "#DC2626", soft: "#FEE2E2" },
  { solid: "#059669", soft: "#D1FAE5" },
  { solid: "#D97706", soft: "#FEF3C7" },
  { solid: "#7C3AED", soft: "#EDE9FE" },
  { solid: "#0F766E", soft: "#CCFBF1" },
  { solid: "#BE185D", soft: "#FCE7F3" },
  { solid: "#1D4ED8", soft: "#DBEAFE" },
  { solid: "#65A30D", soft: "#ECFCCB" },
  { solid: "#C2410C", soft: "#FFEDD5" },
  { solid: "#4338CA", soft: "#E0E7FF" },
  { solid: "#B91C1C", soft: "#FEE2E2" },
];


const stringToHue = (value: string) => {
const getDeveloperColors = (developer: string) => {
  let hash = 0;
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
  for (let index = 0; index < developer.length; index += 1) {
    hash = value.charCodeAt(index) + ((hash << 5) - hash);
    hash = developer.charCodeAt(index) + ((hash << 5) - hash);
  }
  }


  return Math.abs(hash) % 360;
  const colorIndex =
};
    Math.abs(hash) % DEVELOPER_COLOR_PALETTE.length;


const getDeveloperColors = (developer: string) => {
  return DEVELOPER_COLOR_PALETTE[colorIndex];
  const hue = stringToHue(developer);

  return {
    solid: `hsl(${hue} 72% 42%)`,
    soft: `hsl(${hue} 72% 90%)`,
  };
};
};


const formatMarkerTooltip = (label: string, dateStr: string) => {
const formatMarkerTooltip = (type: MarkerType, dateStr: string) => {
  const fullDate = new Date(dateStr).toLocaleDateString("en-US", {
  const fullDate = new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    month: "long",
    day: "numeric",
    day: "numeric",
    year: "numeric",
    year: "numeric",
  });
  });


  return `${label} — ${fullDate}`;
  return `${MARKER_LABELS[type]} (${type}) — ${fullDate}`;
};
};


const MARKER_LABELS: Record<MarkerType, string> = {
const formatActualStartTooltip = (dateStr: string) => {
  AS: "Actual Start",
  const fullDate = new Date(dateStr).toLocaleDateString("en-US", {
  TS: "Target Start",
    weekday: "short",
  TE: "Target End",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return `Actual Start (AS) — ${fullDate}`;
};
};


export function GanttChart({ tasks }: GanttChartProps) {
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
  const timelineTasks = useMemo(
    () =>
    () =>
      filteredTasks.map((task) => ({
      tasks.map((task) => ({
        ...task,
        ...task,
        actualStartDate: task.startDate,
        actualStartDate: task.actualStartDate,
        targetStartDate: task.startDate,
        targetStartDate: task.startDate,
        targetEndDate: task.endDate,
        targetEndDate: task.endDate,
      })),
      })),
    [filteredTasks],
    [tasks],
  );
  );


  const hasProjects = timelineTasks.length > 0;
  const hasTasks = timelineTasks.length > 0;


  const minDate = hasProjects
  const minDate = hasTasks
    ? new Date(
    ? new Date(
        Math.min(
        Math.min(
          ...timelineTasks.map((task) =>
          ...timelineTasks.map((task) =>
            new Date(task.targetStartDate).getTime(),
            new Date(task.targetStartDate).getTime(),
          ),
          ),
        ),
        ),
      )
      )
    : null;
    : null;
  const maxDate = hasProjects

  const maxDate = hasTasks
    ? new Date(
    ? new Date(
        Math.max(
        Math.max(
          ...timelineTasks.map((task) =>
          ...timelineTasks.map((task) =>
            new Date(task.targetEndDate).getTime(),
            new Date(task.targetEndDate).getTime(),
          ),
          ),
        ),
        ),
      )
      )
    : null;
    : null;


  const minOffset = hasProjects
  const minOffset = hasTasks
    ? Math.min(
    ? Math.min(
        ...timelineTasks.map((task) =>
        ...timelineTasks.map((task) =>
          getDateOffset(task.targetStartDate),
          getDateOffset(task.targetStartDate),
        ),
        ),
      )
      )
    : 0;
    : 0;
  const maxOffset = hasProjects

  const maxOffset = hasTasks
    ? Math.max(
    ? Math.max(
        ...timelineTasks.map((task) =>
        ...timelineTasks.map((task) =>
          getDateOffset(task.targetEndDate),
          getDateOffset(task.targetEndDate),
        ),
        ),
      )
      )
    : 0;
    : 0;


  const totalDays = Math.max(1, maxOffset - minOffset);
  const totalDays = Math.max(1, maxOffset - minOffset);


  const timelineMonths = useMemo(() => {
  const timelineMonths = useMemo(() => {
    if (!minDate || !maxDate) return [] as Date[];
    if (!minDate || !maxDate) return [] as Date[];


    const months: Date[] = [];
    const months: Date[] = [];
    const cursor = startOfMonth(minDate);
    const cursor = startOfMonth(minDate);
    const end = startOfMonth(maxDate);
    const end = startOfMonth(maxDate);


    while (cursor <= end) {
    while (cursor <= end) {
      months.push(new Date(cursor));
      months.push(new Date(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
      cursor.setMonth(cursor.getMonth() + 1);
    }
    }


    return months;
    return months;
  }, [minDate, maxDate]);
  }, [minDate, maxDate]);


  return (
  return (
    <Card className="mb-6 shadow-[0px_8px_24px_rgba(0,0,0,0.05)]">
    <Card className="mb-6 shadow-[0px_8px_24px_rgba(0,0,0,0.05)]">
      <CardHeader>
      <CardHeader>
        <CardTitle className="flex flex-col gap-3">
        <CardTitle className="flex flex-col gap-2">
@@ -320,125 +243,148 @@ export function GanttChart({ tasks }: GanttChartProps) {
          <span>Project Timeline</span>
        {!hasProjects ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium text-[#4B5563]">
            {MARKER_ORDER.map((markerType) => (
              <div
                key={markerType}
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1"
              >
                <span
                  className="h-3 w-[3px] rounded"
                  style={{
                    backgroundColor: MARKER_COLORS[markerType],
                  }}
                />
                <span>{MARKER_LABELS[markerType]}</span>
              </div>
            ))}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {!hasTasks ? (
          <div className="rounded-md border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-[#6B7280]">
          <div className="rounded-md border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-[#6B7280]">
            No projects match the selected column search.
            No tasks to display.
          </div>
          </div>
        ) : (
        ) : (
          <div>
          <div>
            <div className="mb-3 flex items-center border-b border-gray-200 pb-2">
            <div className="mb-3 flex items-center border-b border-gray-200 pb-2">
              <div className="w-64 text-xs font-semibold uppercase text-[#6B7280]">
              <div className="w-64 text-xs font-semibold uppercase text-[#6B7280]">
                Tasks
                Tasks
              </div>
              </div>

              <div className="ml-4 flex flex-1 border-x border-gray-200">
              <div className="ml-4 flex flex-1 border-x border-gray-200">
                {timelineMonths.map((month) => (
                {timelineMonths.map((month) => (
                  <div
                  <div
                    key={`${month.getFullYear()}-${month.getMonth()}`}
                    key={`${month.getFullYear()}-${month.getMonth()}`}
                    className="flex-1 border-r border-gray-200 text-center text-xs font-semibold text-[#6B7280] last:border-r-0"
                    className="flex-1 border-r border-gray-200 text-center text-xs font-semibold text-[#6B7280] last:border-r-0"
                  >
                  >
                    {month.toLocaleDateString("en-US", {
                    {month.toLocaleDateString("en-US", {
                      month: "short",
                      month: "short",
                    })}
                    })}
                  </div>
                  </div>
                ))}
                ))}
              </div>
              </div>
            </div>
            </div>


            <div className="space-y-4">
            <div className="space-y-4">
              {timelineTasks.map((task) => {
              {timelineTasks.map((task) => {
                const targetStartOffset =
                const targetStartOffset =
                  getDateOffset(task.targetStartDate) -
                  getDateOffset(task.targetStartDate) -
                  minOffset;
                  minOffset;
                const actualStartOffset =
                const actualStartOffset =
                  getDateOffset(task.actualStartDate) -
                  getDateOffset(
                  minOffset;
                    task.actualStartDate ?? task.targetStartDate,
                  ) - minOffset;
                const targetEndOffset =
                const targetEndOffset =
                  getDateOffset(task.targetEndDate) -
                  getDateOffset(task.targetEndDate) -
                  minOffset;
                  minOffset;


                const barStartOffset =
                  task.actualStartDate
                    ? actualStartOffset
                    : targetStartOffset;
                const barDurationDays = Math.max(
                  1,
                  targetEndOffset - barStartOffset,
                );

                const leftPercent =
                const leftPercent =
                  (targetStartOffset / totalDays) * 100;
                  (barStartOffset / totalDays) * 100;
                const widthPercent =
                const widthPercent =
                  (task.duration / totalDays) * 100;
                  (barDurationDays / totalDays) * 100;
                const actualStartPercent = clampPercent(
                  (actualStartOffset / totalDays) * 100,
                );
                const targetStartPercent = clampPercent(
                const targetStartPercent = clampPercent(
                  (targetStartOffset / totalDays) * 100,
                  (targetStartOffset / totalDays) * 100,
                );
                );
                const targetEndPercent = clampPercent(
                const targetEndPercent = clampPercent(
                  (targetEndOffset / totalDays) * 100,
                  (targetEndOffset / totalDays) * 100,
                );
                );
                const showActualStart =

                  task.actualStartDate !== task.targetStartDate;
                const developerColors = getDeveloperColors(
                const developerColors = getDeveloperColors(
                  task.developer,
                  task.developer,
                );
                );
                const completedPercent = clampPercent(
                const completedPercent = clampPercent(
                  task.completion,
                  task.completion,
                );
                );


                return (
                return (
                  <div
                  <div
                    key={task.id}
                    key={task.id}
                    className="flex items-center"
                    className="flex flex-col gap-2 md:flex-row md:items-center"
                  >
                  >
                    <div className="w-64 truncate pr-2 text-sm font-medium text-[#111827]">
                    <div className="md:w-64 truncate pr-2 text-sm font-medium text-[#111827]">
                      {task.name}
                      {task.name}
                    </div>
                    </div>


                    <div className="relative ml-4 h-14 flex-1 rounded border border-gray-200 bg-gray-50">
                    <div className="relative h-14 flex-1 rounded border border-gray-200 bg-gray-50 md:ml-4">
                      <div
                      <div
                        className="absolute top-1/2 z-20 h-8 -translate-y-1/2 overflow-hidden rounded px-2 text-xs font-medium text-white shadow-sm transition-all duration-700 ease-out"
                        className="group/bar absolute top-1/2 z-20 h-8 -translate-y-1/2 overflow-hidden rounded px-2 text-xs font-medium text-white shadow-sm transition-all duration-700 ease-out"
                        style={{
                        style={{
                          left: `${leftPercent}%`,
                          left: `${leftPercent}%`,
                          width: `${Math.max(widthPercent, 10)}%`,
                          width: `${Math.max(widthPercent, 10)}%`,
                          backgroundColor: developerColors.soft,
                          backgroundColor: developerColors.soft,
                        }}
                        }}
                      >
                      >
                        <div
                        <div
                          className="absolute inset-y-0 left-0 transition-all duration-700 ease-out"
                          className="absolute inset-y-0 left-0 transition-all duration-700 ease-out"
                          style={{
                          style={{
                            width: `${completedPercent}%`,
                            width: `${completedPercent}%`,
                            backgroundColor: developerColors.solid,
                            backgroundColor: developerColors.solid,
                          }}
                          }}
                        />
                        />


                        <div className="relative z-10 flex w-full items-center justify-between gap-2 px-1">
                        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center text-center leading-tight">
                          <span className="truncate text-[#0F172A] mix-blend-multiply">
                          <span className="max-w-full truncate px-1 text-[#0F172A] mix-blend-multiply">
                            {task.developer}
                            {task.developer}
                          </span>
                          </span>
                          <span className="shrink-0 text-[#0F172A]">
                          <span className="text-[#0F172A]">
                            {task.completion}%
                            {task.completion}%
                          </span>
                          </span>
                        </div>
                        </div>

                        {task.actualStartDate ? (
                          <div className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[#0F172A] px-2 py-1 text-[10px] font-medium text-white shadow-md group-hover/bar:block">
                            {formatActualStartTooltip(
                              task.actualStartDate,
                            )}
                          </div>
                        ) : null}
                      </div>
                      </div>


                      {([
                      {([
                        {
                          type: "AS" as MarkerType,
                          percent: actualStartPercent,
                          date: task.actualStartDate,
                          visible: showActualStart,
                        },
                        {
                        {
                          type: "TS" as MarkerType,
                          type: "TS" as MarkerType,
                          percent: targetStartPercent,
                          percent: targetStartPercent,
                          date: task.targetStartDate,
                          date: task.targetStartDate,
                          visible: true,
                        },
                        },
                        {
                        {
                          type: "TE" as MarkerType,
                          type: "TE" as MarkerType,
                          percent: targetEndPercent,
                          percent: targetEndPercent,
                          date: task.targetEndDate,
                          date: task.targetEndDate,
                          visible: true,
                        },
                        },
                      ]).map((marker) =>
                      ]).map((marker) => (
                        marker.visible ? (
                        <div
                          key={`${task.id}-${marker.type}`}
                          className="group absolute inset-y-0 z-30 w-5 -translate-x-1/2 transition-all duration-700 ease-out"
                          style={{
                            left: `calc(${marker.percent}% + ${MARKER_X_OFFSET[marker.type]}px)`,
                          }}
                        >
                          <div
                            className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 rounded shadow-[0_0_0_1px_rgba(255,255,255,0.8)]"
                            style={{
                              backgroundColor:
                                MARKER_COLORS[marker.type],
                            }}
                          />

                          <div
                          <div
                            key={marker.type}
                            className="absolute -top-2 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full border border-white shadow-sm"
                            className="group absolute inset-y-1 z-10 w-2 -translate-x-1/2"
                            style={{
                            style={{ left: `${marker.percent}%` }}
                              backgroundColor: MARKER_COLORS[marker.type],
                          >
                            }}
                            <div
                          />
                              className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2"

                              style={{
                          <div className="pointer-events-none absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-[#374151] shadow-sm">
                                backgroundColor:
                            {marker.type}
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
                          </div>
                        ) : null,

                      )}
                          <div className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[#0F172A] px-2 py-1 text-[10px] font-medium text-white shadow-md group-hover:block">
                            {formatMarkerTooltip(
                              marker.type,
                              marker.date,
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    </div>
                  </div>
                  </div>
                );
                );
              })}
              })}
            </div>
            </div>
          </div>
          </div>
        )}
        )}
      </CardContent>
      </CardContent>
    </Card>
    </Card>
  );
  );
}
}
