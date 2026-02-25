import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Task, getDateOffset } from "../data/mockData";

interface GanttChartProps {
  tasks: Task[];
}

interface GroupedProjectDraft {
  name: string;
  startDate: string;
  endDate: string;
  completionWeighted: number;
  totalDuration: number;
  statuses: Task["status"][];
  developers: Set<string>;
}

interface GroupedProject {
  name: string;
  actualStartDate: string;
  targetStartDate: string;
  targetEndDate: string;
  completion: number;
  status: Task["status"];
  duration: number;
  developers: string;
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

const DAY_MS = 1000 * 60 * 60 * 24;

const MARKER_COLORS: Record<MarkerType, string> = {
  AS: "#0EA5E9",
  TS: "#8B5CF6",
  TE: "#F97316",
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

const formatMiniDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

const clampPercent = (value: number) =>
  Math.max(2, Math.min(98, value));

const getStatusColor = (status: Task["status"]) => {
  switch (status) {
    case "Completed":
      return "bg-[#059669]";
    case "On Track":
      return "bg-[#1E3A8A]";
    case "At Risk":
      return "bg-[#F59E0B]";
    case "Delayed":
      return "bg-[#DC2626]";
    default:
      return "bg-gray-400";
  }
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

  const groupedProjects = useMemo<GroupedProject[]>(() => {
    return Object.values(
      filteredTasks.reduce<Record<string, GroupedProjectDraft>>(
        (acc, task) => {
          if (!acc[task.project]) {
            acc[task.project] = {
              name: task.project,
              startDate: task.startDate,
              endDate: task.endDate,
              completionWeighted:
                task.completion * task.duration,
              totalDuration: task.duration,
              statuses: [task.status],
              developers: new Set([task.developer]),
            };
            return acc;
          }

          const existing = acc[task.project];

          if (
            new Date(task.startDate) <
            new Date(existing.startDate)
          ) {
            existing.startDate = task.startDate;
          }
          if (
            new Date(task.endDate) > new Date(existing.endDate)
          ) {
            existing.endDate = task.endDate;
          }

          existing.completionWeighted +=
            task.completion * task.duration;
          existing.totalDuration += task.duration;
          existing.statuses.push(task.status);
          existing.developers.add(task.developer);

          return acc;
        },
        {},
      ),
    ).map((project) => {
      const completion = Math.round(
        project.completionWeighted / project.totalDuration,
      );
      const status: Task["status"] = project.statuses.includes(
        "Delayed",
      )
        ? "Delayed"
        : project.statuses.includes("At Risk")
          ? "At Risk"
          : project.statuses.every(
                (taskStatus) => taskStatus === "Completed",
              )
            ? "Completed"
            : "On Track";

      return {
        name: project.name,
        actualStartDate: project.startDate,
        targetStartDate: project.startDate,
        targetEndDate: project.endDate,
        completion,
        status,
        duration: Math.max(
          1,
          Math.ceil(
            (new Date(project.endDate).getTime() -
              new Date(project.startDate).getTime()) /
              DAY_MS,
          ),
        ),
        developers: Array.from(project.developers)
          .sort()
          .join(", "),
      };
    });
  }, [filteredTasks]);

  const hasProjects = groupedProjects.length > 0;

  const minDate = hasProjects
    ? new Date(
        Math.min(
          ...groupedProjects.map((project) =>
            new Date(project.targetStartDate).getTime(),
          ),
        ),
      )
    : null;
  const maxDate = hasProjects
    ? new Date(
        Math.max(
          ...groupedProjects.map((project) =>
            new Date(project.targetEndDate).getTime(),
          ),
        ),
      )
    : null;

  const minOffset = hasProjects
    ? Math.min(
        ...groupedProjects.map((project) =>
          getDateOffset(project.targetStartDate),
        ),
      )
    : 0;
  const maxOffset = hasProjects
    ? Math.max(
        ...groupedProjects.map((project) =>
          getDateOffset(project.targetEndDate),
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
          <div className="flex items-center justify-between gap-3">
            <span>Project Timeline (Gantt View)</span>

            <div className="flex items-center gap-4 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5">
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: MARKER_COLORS.AS }}
                ></div>
                <span className="text-xs text-[#475569]">
                  Actual Start (AS)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: MARKER_COLORS.TS }}
                ></div>
                <span className="text-xs text-[#475569]">
                  Target Start (TS)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: MARKER_COLORS.TE }}
                ></div>
                <span className="text-xs text-[#475569]">
                  Target End (TE)
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedColumn}
              onChange={(event) =>
                setSelectedColumn(
                  event.target.value as FilterColumn,
                )
              }
              className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-[#111827]"
            >
              <option value="project">Project</option>
              <option value="name">Module/Task</option>
              <option value="developer">Developer</option>
              <option value="owner">PM Owner</option>
              <option value="status">Status</option>
              <option value="startDate">Start Date</option>
              <option value="endDate">End Date</option>
            </select>

            <input
              type="search"
              value={columnSearch}
              onChange={(event) =>
                setColumnSearch(event.target.value)
              }
              placeholder={`Search ${selectedColumn}`}
              className="h-9 w-56 rounded-md border border-gray-300 bg-white px-3 text-sm text-[#111827]"
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
              {groupedProjects.map((project) => {
                const targetStartOffset =
                  getDateOffset(project.targetStartDate) -
                  minOffset;
                const actualStartOffset =
                  getDateOffset(project.actualStartDate) -
                  minOffset;
                const targetEndOffset =
                  getDateOffset(project.targetEndDate) -
                  minOffset;

                const leftPercent =
                  (targetStartOffset / totalDays) * 100;
                const widthPercent =
                  (project.duration / totalDays) * 100;
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
                  project.actualStartDate !==
                  project.targetStartDate;

                return (
                  <div
                    key={project.name}
                    className="flex items-center"
                  >
                    <div className="w-64 truncate pr-2 text-sm font-medium text-[#111827]">
                      {project.name}
                    </div>

                    <div className="relative ml-4 h-14 flex-1 rounded border border-gray-200 bg-gray-50">
                      <div
                        className={`absolute top-1/2 h-7 -translate-y-1/2 rounded px-3 text-xs font-medium text-white ${getStatusColor(project.status)} flex items-center justify-between gap-2`}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${Math.max(widthPercent, 10)}%`,
                        }}
                      >
                        <span className="truncate">
                          {project.developers}
                        </span>
                        <span>{project.completion}%</span>
                      </div>

                      {showActualStart ? (
                        <div
                          className="pointer-events-none absolute top-1 -translate-x-1/2 text-[10px] font-medium"
                          style={{
                            left: `${actualStartPercent}%`,
                            color: MARKER_COLORS.AS,
                          }}
                        >
                          AS{" "}
                          {formatMiniDate(
                            project.actualStartDate,
                          )}
                        </div>
                      ) : null}

                      <div
                        className="pointer-events-none absolute bottom-1 -translate-x-1/2 text-[10px] font-medium"
                        style={{
                          left: `${targetStartPercent}%`,
                          color: MARKER_COLORS.TS,
                        }}
                      >
                        TS{" "}
                        {formatMiniDate(
                          project.targetStartDate,
                        )}
                      </div>

                      <div
                        className="pointer-events-none absolute bottom-1 -translate-x-1/2 text-[10px] font-medium"
                        style={{
                          left: `${targetEndPercent}%`,
                          color: MARKER_COLORS.TE,
                        }}
                      >
                        TE{" "}
                        {formatMiniDate(project.targetEndDate)}
                      </div>
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
