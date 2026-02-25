import { Filter, Calendar, Briefcase, User } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface DashboardHeaderProps {
  selectedProject: string;
  selectedOwner: string;
  selectedDateRange: string;
  onProjectChange: (value: string) => void;
  onOwnerChange: (value: string) => void;
  onDateRangeChange: (value: string) => void;
  projects: string[];
  owners: string[];
}

export function DashboardHeader({
  selectedProject,
  selectedOwner,
  selectedDateRange,
  onProjectChange,
  onOwnerChange,
  onDateRangeChange,
  projects,
  owners
}: DashboardHeaderProps) {
  return (
    <header className="bg-[#0F172A] text-white h-[88px] px-8 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1E3A8A] rounded-lg flex items-center justify-center">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm text-gray-400">PMO Dashboard</div>
            <h1 className="text-xl font-semibold">Executive Overview</h1>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Filter className="w-4 h-4" />
          <span>Filters:</span>
        </div>

        <div className="flex items-center gap-2 min-w-[180px]">
          <Calendar className="w-4 h-4 text-gray-400" />
          <Select value={selectedDateRange} onValueChange={onDateRangeChange}>
            <SelectTrigger className="bg-[#1E293B] border-[#334155] text-white h-9">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="q1-2026">Q1 2026</SelectItem>
              <SelectItem value="q2-2026">Q2 2026</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 min-w-[200px]">
          <Briefcase className="w-4 h-4 text-gray-400" />
          <Select value={selectedProject} onValueChange={onProjectChange}>
            <SelectTrigger className="bg-[#1E293B] border-[#334155] text-white h-9">
              <SelectValue placeholder="Select Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project} value={project}>
                  {project}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 min-w-[180px]">
          <User className="w-4 h-4 text-gray-400" />
          <Select value={selectedOwner} onValueChange={onOwnerChange}>
            <SelectTrigger className="bg-[#1E293B] border-[#334155] text-white h-9">
              <SelectValue placeholder="Select Owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Owners</SelectItem>
              {owners.map((owner) => (
                <SelectItem key={owner} value={owner}>
                  {owner}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
}
