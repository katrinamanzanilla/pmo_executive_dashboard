
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
                const actualStartPercent = clampPercent(
                  (actualStartOffset / totalDays) * 100,
                );

                const developerColors = getDeveloperColors(
                  task.developer,
                );
                const completedPercent = clampPercent(
                  task.completion,
                );
                const hasValidActualStart = isValidDateString(
                  task.actualStartDate,
                );

                return (
                  <div
                    key={task.id}
                    className="flex flex-col gap-2 md:flex-row md:items-center"
                  >
                    <div className="md:w-64 truncate pr-2 text-sm font-medium text-[#111827]">
                      {task.project}
                    </div>

                    <div className="relative h-14 flex-1 rounded border border-gray-200 bg-gray-50 md:ml-4">
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
                        </div>

                        {hasValidActualStart && task.actualStartDate ? (
                          <div className="pointer-events-none absolute -top-8 left-1/2 z-40 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[#0F172A] px-2 py-1 text-[10px] font-medium text-white shadow-md group-hover/bar:block">
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
                        ...(hasValidActualStart && task.actualStartDate
                          ? [
                              {
                                type: "AS" as MarkerType,
                                percent: actualStartPercent,
                                date: task.actualStartDate,
                              },
                            ]
                          : []),
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
