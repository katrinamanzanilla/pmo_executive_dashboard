import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Task, getDateOffset } from "../data/mockData";

interface GanttChartProps {
  tasks: Task[];
}

type MarkerType = "TS" | "TE";

const MARKER_LABELS: Record<MarkerType, string> = {
  TS: "Target Start",
  TE: "Target End",
};

const MARKER_COLORS: Record<MarkerType, string> = {
  TS: "#7C3AED",
  TE: "#DC2626",
};

const MARKER_ORDER: MarkerType[] = ["TS", "TE"];

const MARKER_X_OFFSET: Record<MarkerType, number> = {
  TS: -2,
  TE: 2,
};

const clampPercent = (value: number) =>
  Math.max(0, Math.min(100, value));

const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const DEVELOPER_COLOR_PALETTE = [
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

const getDeveloperColors = (developer: string) => {
  let hash = 0;
  for (let index = 0; index < developer.length; index += 1) {
    hash = developer.charCodeAt(index) + ((hash << 5) - hash);
  }

  const colorIndex =
    Math.abs(hash) % DEVELOPER_COLOR_PALETTE.length;

  return DEVELOPER_COLOR_PALETTE[colorIndex];
};

const formatMarkerTooltip = (type: MarkerType, dateStr: string) => {
  const fullDate = new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return `${MARKER_LABELS[type]} (${type}) — ${fullDate}`;
};

const formatActualStartTooltip = (dateStr: string) => {
  const fullDate = new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return `Actual Start (AS) — ${fullDate}`;
};

export function GanttChart({ tasks }: GanttChartProps) {
  const timelineTasks = useMemo(
    () =>
      tasks.map((task) => ({
        ...task,
        actualStartDate: task.actualStartDate,
        targetStartDate: task.startDate,
        targetEndDate: task.endDate,
      })),
    [tasks],
  );

  const hasTasks = timelineTasks.length > 0;

  const minDate = hasTasks
    ? new Date(
        Math.min(
          ...timelineTasks.map((task) =>
            new Date(task.targetStartDate).getTime(),
          ),
        ),
      )
    : null;

  const maxDate = hasTasks
    ? new Date(
        Math.max(
          ...timelineTasks.map((task) =>
            new Date(task.targetEndDate).getTime(),
          ),
        ),
      )
    : null;

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
        <CardTitle className="flex flex-col gap-2">
          <span>Project Timeline</span>
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
            No tasks to display.
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
                  getDateOffset(
                    task.actualStartDate ?? task.targetStartDate,
                  ) - minOffset;
                const targetEndOffset =
                  getDateOffset(task.targetEndDate) -
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
                  (barStartOffset / totalDays) * 100;
                const widthPercent =
                  (barDurationDays / totalDays) * 100;
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

                    <div className="relative h-14 flex-1 rounded border border-gray-200 bg-gray-50 md:ml-4">
                      <div
                        className="group/bar absolute top-1/2 z-20 h-8 -translate-y-1/2 overflow-hidden rounded px-2 text-xs font-medium text-white shadow-sm transition-all duration-700 ease-out"
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

                        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center text-center leading-tight">
                          <span className="max-w-full truncate px-1 text-[#0F172A] mix-blend-multiply">
                            {task.developer}
                          </span>
                          <span className="text-[#0F172A]">
                            {task.completion}%
                          </span>
                        </div>

                        {task.actualStartDate ? (
                          <div className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[#0F172A] px-2 py-1 text-[10px] font-medium text-white shadow-md group-hover/bar:block">
                            {formatActualStartTooltip(
                              task.actualStartDate,
                            )}
                          </div>
                        ) : null}
                      </div>

                      {([
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
                            className="absolute -top-2 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full border border-white shadow-sm"
                            style={{
                              backgroundColor: MARKER_COLORS[marker.type],
                            }}
                          />

                          <div className="pointer-events-none absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-[#374151] shadow-sm">
                            {marker.type}
                          </div>

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
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
