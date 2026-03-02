import { useEffect, useState } from "react";

import type { Task } from "../data/mockData";
import { fetchTasksFromSheet } from "../data/sheetFetcher";

import { DashboardHeader } from "../components/DashboardHeader";
import { GanttChart } from "../components/GanttChart";

export default function Dashboard() {
  // All tasks, including those fetched from Google Sheets
  const [tasks, setTasks] = useState<Task[]>([]);
  // Input for Google Sheet CSV link
  const [sheetUrl, setSheetUrl] = useState("");

  // Filters
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedPM, setSelectedPM] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState("ytd");

  // Fetch tasks from the sheet whenever sheetUrl changes
  useEffect(() => {
    if (!sheetUrl) return;

    fetchTasksFromSheet(sheetUrl)
      .then(fetchedTasks => {
        // Optional: sort by startDate so newest tasks appear last
        const sortedTasks = fetchedTasks.sort(
          (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
        setTasks(sortedTasks);
      })
      .catch(err => {
        console.error("Error fetching tasks from sheet:", err);
      });
  }, [sheetUrl]);

  // Extract unique project names and PMs for filters
  const projects = Array.from(new Set(tasks.map(task => task.project)));
  const owners = Array.from(new Set(tasks.map(task => task.owner)));

  // Apply filters
  const filteredTasks = tasks.filter(task => {
    const projectMatch =
      selectedProject === "all" || task.project === selectedProject;
    const pmMatch =
      selectedPM === "all" || task.owner.includes(selectedPM);

    return projectMatch && pmMatch;
  });

  return (
    <div>
      {/* Header with filters */}
      <DashboardHeader
        selectedProject={selectedProject}
        selectedAssignedPM={selectedPM}
        selectedDateRange={selectedDateRange}
        onProjectChange={setSelectedProject}
        onAssignedPMChange={setSelectedPM}
        onDateRangeChange={setSelectedDateRange}
        projects={projects}
        assignedPMs={owners}
      />

      <div className="p-6">
        {/* Google Sheet CSV input */}
        <input
          className="border p-2 w-full mb-4"
          placeholder="Paste Google Sheet CSV published link"
          value={sheetUrl}
          onChange={e => setSheetUrl(e.target.value)}
        />

        {/* Gantt chart for filtered tasks */}
        <GanttChart tasks={filteredTasks} />
      </div>
    </div>
  );
}
