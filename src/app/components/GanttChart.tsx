import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { Task } from '../data/mockData';

interface GanttChartProps {
  tasks: Task[];
}

type MarkerType = 'TS' | 'TE';

const MARKER_COLORS: Record<MarkerType, string> = {
  TS: '#2563EB',
  TE: '#DC2626',
};

const MARKER_X_OFFSET: Record<MarkerType, number> = {
  TS: -6,
  TE: 6,
};

const dayInMs = 1000 * 60 * 60 * 24;

const parseDate = (date: string): Date => {
  const value = new Date(date);
  return Number.isNaN(value.getTime()) ? new Date(0) : value;
};

const isValidDateString = (date?: string): date is string => {
  if (!date) return false;
  return !Number.isNaN(new Date(date).getTime());
};

const getDateOffset = (date: string): number =>
  parseDate(date).getTime() / dayInMs;

const clampPercent = (percent: number): number =>
  Math.max(0, Math.min(100, percent));

const formatDate = (date: string): string =>
  parseDate(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const formatMarkerTooltip = (marker: MarkerType, date: string): string => {
  const markerLabel: Record<MarkerType, string> = {
    TS: 'Target Start',
    TE: 'Target End',
  };

  return `${markerLabel[marker]}: ${formatDate(date)}`;
};

const formatActualStartTooltip = (date: string): string =>
  `Actual Start: ${formatDate(date)}`;

const getDeveloperColors = (developer: string) => {
  const palette = [
    { soft: '#C7D2FE', solid: '#4F46E5' },
    { soft: '#BFDBFE', solid: '#2563EB' },
    { soft: '#BAE6FD', solid: '#0284C7' },
    { soft: '#A7F3D0', solid: '#059669' },
    { soft: '#FDE68A', solid: '#D97706' },
    { soft: '#FECACA', solid: '#DC2626' },
  ];

  const hash = developer
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return palette[hash % palette.length];
};

export function GanttChart({ tasks }: GanttChartProps) {
  const timelineTasks = tasks.filter(
    (task) =>
      isValidDateString(task.startDate) &&
      isValidDateString(task.endDate)
  );

  if (timelineTasks.length === 0) {
    return (
      <Card className="mb-6 shadow-[0px_8px_24px_rgba(0,0,0,0.05)]">
        <CardHeader>
          <CardTitle>Portfolio Gantt Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#6B7280]">
            No task timeline data available.
          </p>
        </CardContent>
      </Card>
    );
  }

  const startOffsets = timelineTasks.map((task) =>
    getDateOffset(task.startDate)
  );
  const endOffsets = timelineTasks.map((task) =>
    getDateOffset(task.endDate)
  );

  const minOffset = Math.min(...startOffsets);
  const maxOffset = Math.max(...endOffsets);
  const totalDays = Math.max(1, maxOffset - minOffset);

  const firstDate = new Date(minOffset * dayInMs);
  const lastDate = new Date(maxOffset * dayInMs);

  const timelineMonths: Date[] = [];
  const monthCursor = new Date(
    firstDate.getFullYear(),
    firstDate.getMonth(),
    1
  );

  while (monthCursor <= lastDate) {
    timelineMonths.push(new Date(monthCursor));
    monthCursor.setMonth(monthCursor.getMonth() + 1);
  }

  return (
    <Card className="mb-6 shadow-[0px_8px_24px_rgba(0,0,0,0.05)]">
      <CardHeader>
        <CardTitle>Portfolio Gantt Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[960px]">

            {/* HEADER */}
            <div className="mb-3 flex items-center border-b border-gray-200 pb-2">
              <div className="w-64 text-xs font-semibold uppercase text-[#6B7280]">
                Projects
              </div>

              <div className="ml-4 flex flex-1 border-x border-gray-200">
                {timelineMonths.map((month) => (
                  <div
                    key={`${month.getFullYear()}-${month.getMonth()}`}
                    className="flex-1 border-r border-gray-200 text-center text-xs font-semibold text-[#6B7280] last:border-r-0"
                  >
                    {month.toLocaleDateString('en-US', {
                      month: 'short',
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* TASK ROWS */}
            <div className="space-y-4">
              {timelineTasks.map((task) => {
                const targetStartOffset =
                  getDateOffset(task.startDate) - minOffset;

                const targetEndOffset =
                  getDateOffset(task.endDate) - minOffset;

                const hasValidActualStart =
                  isValidDateString(task.actualStartDate);

                const actualStartOffset =
                  hasValidActualStart && task.actualStartDate
                    ? getDateOffset(task.actualStartDate) - minOffset
                    : targetStartOffset;

                const barStartOffset = actualStartOffset;

                const barDurationDays = Math.max(
                  1,
                  targetEndOffset - barStartOffset
                );

                const leftPercent =
                  (barStartOffset / totalDays) * 100;

                const widthPercent =
                  (barDurationDays / totalDays) * 100;

                const targetStartPercent = clampPercent(
                  (targetStartOffset / totalDays) * 100
                );

                const targetEndPercent = clampPercent(
                  (targetEndOffset / totalDays) * 100
                );

                const developerColors =
                  getDeveloperColors(task.developer);

                const completedPercent =
                  task.status?.toLowerCase() === "complete"
                    ? 100
                    : clampPercent(task.completion);

                return (
                  <div
                    key={task.id}
                    className="flex flex-col gap-2 md:flex-row md:items-center"
                  >
                    <div className="truncate pr-2 text-sm font-medium text-[#111827] md:w-64">
                      {task.project}
                    </div>

                    <div className="relative h-14 flex-1 rounded border border-gray-200 bg-gray-50 md:ml-4">

                      {/* BAR */}
                      <div
                        className="group/bar absolute top-1/2 z-20 h-8 -translate-y-1/2 transition-all duration-700 ease-out"
                        style={{
                          left: `${leftPercent}%`,
                          width: `${Math.max(widthPercent, 10)}%`,
                        }}
                      >
                        <div
                          className="relative h-full overflow-hidden rounded px-2 text-xs font-medium text-white shadow-sm"
                          style={{
                            backgroundColor: developerColors.soft,
                          }}
                        >
                          {/* THICK LEFT STRIP */}
                          {hasValidActualStart && (
                            <div
                              className="absolute left-0 top-0 h-full w-3 rounded-l"
                              style={{
                                backgroundColor:
                                  developerColors.solid,
                              }}
                            />
                          )}

                          {/* COMPLETION FILL */}
                          <div
                            className="absolute inset-y-0 left-0 transition-all duration-700 ease-out"
                            style={{
                              width: `${completedPercent}%`,
                              backgroundColor:
                                developerColors.solid,
                            }}
                          />

                          {/* TEXT */}
                          <div className="relative z-10 flex h-full w-full flex-col items-center justify-center text-center leading-tight">
                            <span className="max-w-full truncate px-1 text-[#0F172A] mix-blend-multiply">
                              {task.developer}
                            </span>
                            <span className="text-[#0F172A]">
                              {completedPercent}%
                            </span>
                          </div>
                        </div>

                        {/* ACTUAL START TOOLTIP */}
                        {hasValidActualStart &&
                          task.actualStartDate && (
                            <div className="pointer-events-none absolute -top-8 left-1/2 z-40 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[#0F172A] px-2 py-1 text-[10px] font-medium text-white shadow-md group-hover/bar:block">
                              {formatActualStartTooltip(
                                task.actualStartDate
                              )}
                            </div>
                          )}
                      </div>

                      {/* MARKERS (TS + TE only) */}
                      {[ 
                        {
                          type: 'TS' as MarkerType,
                          percent: targetStartPercent,
                          date: task.startDate,
                        },
                        {
                          type: 'TE' as MarkerType,
                          percent: targetEndPercent,
                          date: task.endDate,
                        },
                      ].map((marker) => (
                        <div
                          key={`${task.id}-${marker.type}`}
                          className="group absolute inset-y-0 z-30 w-5 -translate-x-1/2 transition-all duration-700 ease-out"
                          style={{
                            left: `calc(${marker.percent}% + ${
                              MARKER_X_OFFSET[marker.type]
                            }px)`,
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
                              backgroundColor:
                                MARKER_COLORS[marker.type],
                            }}
                          />

                          <div className="pointer-events-none absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-[#374151] shadow-sm">
                            {marker.type}
                          </div>

                          <div className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[#0F172A] px-2 py-1 text-[10px] font-medium text-white shadow-md group-hover:block">
                            {formatMarkerTooltip(
                              marker.type,
                              marker.date
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
        </div>
      </CardContent>
    </Card>
  );
}
