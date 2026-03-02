import { useEffect, useState, useMemo } from "react";

import { Task } from "../data/mockData";
import { fetchTasksFromSheet } from "../data/sheetFetcher";

import { DashboardHeader } from "../components/DashboardHeader";
import { GanttChart } from "../components/GanttChart";

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sheetUrl, setSheetUrl] = useState("");

  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedPM, setSelectedPM] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState("ytd");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sheetUrl) return;

    setLoading(true);
    fetchTasksFromSheet(sheetUrl)
      .then((fetchedTasks) => {
        setTasks(fetchedTasks);
      })
      .finally(() => setLoading(false));
  }, [sheetUrl]);

  // Compute unique projects and owners dynamically
  const projects = useMemo(() => Array.from(new Set(tasks.map(t => t.project))), [tasks]);
  const owners = useMemo(() => Array.from(new Set(tasks.map(t => t.owner))), [tasks]);

  // Filter tasks by project and PM
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const projectMatch =
        selectedProject === "all" || task.project === selectedProject;

      const pmMatch =
        selectedPM === "all" || task.owner.includes(selectedPM);

      return projectMatch && pmMatch;
    });
  }, [tasks, selectedProject, selectedPM]);

  return (
    <div>
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
        <input
          className="border p-2 w-full mb-4"
          placeholder="Paste Google Sheet CSV published link"
          value={sheetUrl}
          onChange={e => setSheetUrl(e.target.value)}
        />

        {loading ? (
          <p className="text-sm text-gray-500">Loading tasks...</p>
        ) : (
          <GanttChart tasks={filteredTasks} />
        )}
      </div>
    </div>
  );
}
