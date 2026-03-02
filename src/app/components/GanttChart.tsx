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
    AS: 'Actual Start',
    TE: 'Target End',
  };

  return `${markerLabel[marker]}: ${formatDate(date)}`;
};

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

  return (
    <Card className="mb-6 shadow-[0px_8px_24px_rgba(0,0,0,0.05)]">
      <CardHeader>
        <CardTitle>Portfolio Gantt Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[960px] space-y-4">
            {timelineTasks.map((task) => {
              const targetStartOffset =
                getDateOffset(task.startDate) - minOffset;

              const targetEndOffset =
                getDateOffset(task.endDate) - minOffset;

              const actualStartOffset =
                task.actualStartDate &&
                isValidDateString(task.actualStartDate)
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

              const completedPercent = clampPercent(task.completion);

              const developerColors = getDeveloperColors(
                task.developer
              );

              return (
                <div
                  key={task.id}
                  className="flex flex-col md:flex-row md:items-center gap-2"
                >
                  <div className="md:w-64 text-sm font-medium text-[#111827] truncate">
                    {task.project}
                  </div>

                  <div className="relative h-14 flex-1 rounded border border-gray-200 bg-gray-50 md:ml-4">
                    <div
                      className="absolute top-1/2 h-8 -translate-y-1/2 rounded shadow-sm"
                      style={{
                        left: `${leftPercent}%`,
                        width: `${Math.max(widthPercent, 10)}%`,
                        backgroundColor: developerColors.soft,
                      }}
                    >
                      <div
                        className="absolute inset-y-0 left-0 rounded"
                        style={{
                          width: `${completedPercent}%`,
                          backgroundColor: developerColors.solid,
                        }}
                      />

                      <div className="relative z-10 flex h-full flex-col items-center justify-center text-xs font-medium text-[#0F172A]">
                        <span>{task.developer}</span>
                        <span>{task.completion}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
