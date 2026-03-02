import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { Task } from '../data/mockData';

interface GanttChartProps {
  tasks: Task[];
}

type MarkerType = 'TS' | 'AS' | 'TE';

const MARKER_COLORS: Record<MarkerType, string> = {
  TS: '#2563EB',
  AS: '#059669',
  TE: '#DC2626',
};

const MARKER_X_OFFSET: Record<MarkerType, number> = {
  TS: -6,
  AS: 0,
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

const getDateOffset = (date: string) => parseDate(date).getTime() / dayInMs;

const clampPercent = (percent: number) =>
  Math.max(0, Math.min(100, percent));

const formatDate = (date: string) =>
  parseDate(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const formatMarkerTooltip = (marker: MarkerType, date: string) => {
  const label = {
    TS: 'Target Start',
    AS: 'Actual Start',
    TE: 'Target End',
  };
  return `${label[marker]}: ${formatDate(date)}`;
};

const formatActualStartTooltip = (date: string) =>
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
  const hash = developer.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return palette[hash % palette.length];
};

export function GanttChart({ tasks }: GanttChartProps) {
  const timelineTasks = tasks.filter(
    t => isValidDateString(t.startDate) && isValidDateString(t.endDate)
  );

  if (!timelineTasks.length) {
    return (
      <Card className="mb-6 shadow-[0px_8px_24px_rgba(0,0,0,0.05)]">
        <CardHeader>
          <CardTitle>Portfolio Gantt Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#6B7280]">No task timeline data available.</p>
        </CardContent>
      </Card>
    );
  }

  const startOffsets = timelineTasks.map(t => getDateOffset(t.startDate));
  const endOffsets = timelineTasks.map(t => getDateOffset(t.endDate));
  const minOffset = Math.min(...startOffsets);
  const maxOffset = Math.max(...endOffsets);
  const totalDays = Math.max(1, maxOffset - minOffset);

  const firstDate = new Date(minOffset * dayInMs);
  const lastDate = new Date(maxOffset * dayInMs);

  const months: Date[] = [];
  const cursor = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
  while (cursor <= lastDate) {
    months.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
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
                {months.map(m => (
                  <div
                    key={`${m.getFullYear()}-${m.getMonth()}`}
                    className="flex-1 border-r border-gray-200 text-center text-xs font-semibold text-[#6B7280]"
                  >
                    {m.toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                ))}
              </div>
            </div>

            {/* TASK ROWS */}
            <div className="space-y-4">
              {timelineTasks.map(task => {
                const tsOffset = getDateOffset(task.startDate) - minOffset;
                const teOffset = getDateOffset(task.endDate) - minOffset;

                const asOffset =
                  task.actualStartDate && isValidDateString(task.actualStartDate)
                    ? getDateOffset(task.actualStartDate) - minOffset
                    : tsOffset;

                const left = (asOffset / totalDays) * 100;
                const width = ((teOffset - asOffset) / totalDays) * 100;

                const devColors = getDeveloperColors(task.developer);

                const hasActual =
                  task.actualStartDate &&
                  isValidDateString(task.actualStartDate);

                return (
                  <div key={task.id} className="flex flex-col gap-2 md:flex-row md:items-center">
                    <div className="truncate pr-2 text-sm font-medium text-[#111827] md:w-64">
                      {task.project}
                    </div>

                    <div className="relative h-14 flex-1 rounded border border-gray-200 bg-gray-50 md:ml-4">

                      {/* BAR */}
                      <div
                        className="group/bar absolute top-1/2 z-20 h-8 -translate-y-1/2"
                        style={{ left: `${left}%`, width: `${Math.max(width, 10)}%` }}
                      >
                        <div
                          className="relative h-full rounded px-2 text-xs shadow-sm"
                          style={{ backgroundColor: devColors.soft }}
                        >
                          <div
                            className="absolute inset-y-0 left-0"
                            style={{
                              width: `${clampPercent(task.completion)}%`,
                              backgroundColor: devColors.solid,
                            }}
                          />

                          <div className="relative z-10 flex h-full flex-col items-center justify-center text-[#0F172A]">
                            <span className="truncate">{task.developer}</span>
                            <span>{task.completion}%</span>
                          </div>
                        </div>

                        {hasActual && (
                          <div className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded bg-black px-2 py-1 text-[10px] text-white group-hover/bar:block">
                            {formatActualStartTooltip(task.actualStartDate!)}
                          </div>
                        )}
                      </div>

                      {/* MARKERS */}
                      {[
                        { type: 'TS' as MarkerType, percent: tsOffset / totalDays * 100, date: task.startDate },
                        ...(hasActual
                          ? [{ type: 'AS' as MarkerType, percent: asOffset / totalDays * 100, date: task.actualStartDate! }]
                          : []),
                        { type: 'TE' as MarkerType, percent: teOffset / totalDays * 100, date: task.endDate },
                      ].map(marker => (
                        <div
                          key={marker.type}
                          className="group absolute inset-y-0 w-5 -translate-x-1/2"
                          style={{
                            left: `calc(${marker.percent}% + ${MARKER_X_OFFSET[marker.type]}px)`,
                          }}
                        >
                          <div
                            className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2"
                            style={{ backgroundColor: MARKER_COLORS[marker.type] }}
                          />
                          <div
                            className="absolute -top-2 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full border border-white"
                            style={{ backgroundColor: MARKER_COLORS[marker.type] }}
                          />
                          <div className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded bg-black px-2 py-1 text-[10px] text-white group-hover:block">
                            {formatMarkerTooltip(marker.type, marker.date)}
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
