import { useEffect, useState } from "react";

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

  useEffect(() => {

    if (!sheetUrl) return;

    fetchTasksFromSheet(sheetUrl)
      .then(setTasks);

  }, [sheetUrl]);

  const projects = Array.from(new Set(tasks.map(t => t.project)));
  const owners = Array.from(new Set(tasks.map(t => t.owner)));

  const filteredTasks = tasks.filter(task => {

    const projectMatch =
      selectedProject === "all" ||
      task.project === selectedProject;

    const pmMatch =
      selectedPM === "all" ||
      task.owner.includes(selectedPM);

    return projectMatch && pmMatch;

  });

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

        <GanttChart tasks={filteredTasks} />

      </div>

    </div>
  );
}
