import { Filter, Calendar, Briefcase, User } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface DashboardHeaderProps {
  selectedProject: string;
  selectedAssignedPM: string;
  selectedDateRange: string;
  onProjectChange: (value: string) => void;
  onAssignedPMChange: (value: string) => void;
  onDateRangeChange: (value: string) => void;
  projects: string[];
  assignedPMs: string[];
  monthOptions?: { key: string; label: string }[]; // kept for compatibility, unused
}

// Jan–Dec for 2025 and 2026
const MONTH_OPTIONS: { key: string; label: string }[] = [
  { key: '2025-01', label: 'Jan 2025' }, { key: '2025-02', label: 'Feb 2025' },
  { key: '2025-03', label: 'Mar 2025' }, { key: '2025-04', label: 'Apr 2025' },
  { key: '2025-05', label: 'May 2025' }, { key: '2025-06', label: 'Jun 2025' },
  { key: '2025-07', label: 'Jul 2025' }, { key: '2025-08', label: 'Aug 2025' },
  { key: '2025-09', label: 'Sep 2025' }, { key: '2025-10', label: 'Oct 2025' },
  { key: '2025-11', label: 'Nov 2025' }, { key: '2025-12', label: 'Dec 2025' },
  { key: '2026-01', label: 'Jan 2026' }, { key: '2026-02', label: 'Feb 2026' },
  { key: '2026-03', label: 'Mar 2026' }, { key: '2026-04', label: 'Apr 2026' },
  { key: '2026-05', label: 'May 2026' }, { key: '2026-06', label: 'Jun 2026' },
  { key: '2026-07', label: 'Jul 2026' }, { key: '2026-08', label: 'Aug 2026' },
  { key: '2026-09', label: 'Sep 2026' }, { key: '2026-10', label: 'Oct 2026' },
  { key: '2026-11', label: 'Nov 2026' }, { key: '2026-12', label: 'Dec 2026' },
];

export function DashboardHeader({
  selectedProject,
  selectedAssignedPM,
  selectedDateRange,
  onProjectChange,
  onAssignedPMChange,
  onDateRangeChange,
  projects,
  assignedPMs,
}: DashboardHeaderProps) {
  return (
    <header className="fixed top-0 left-64 right-0 z-50 bg-[#0F172A] text-white h-[88px] px-8 flex items-center justify-between">
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

      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Filter className="w-4 h-4" />
          <span>Filters:</span>
        </div>

        {/* Monthly filter — Jan 2025 to Dec 2026 */}
        <div className="flex items-center gap-2 w-[190px]">
          <Calendar className="w-4 h-4 text-gray-400" />
          <Select value={selectedDateRange} onValueChange={onDateRangeChange}>
            <SelectTrigger className="bg-[#1E293B] border-[#334155] text-white h-9 w-full">
              <SelectValue placeholder="All Months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {MONTH_OPTIONS.map(({ key, label }) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Project filter */}
        <div className="flex items-center gap-2 w-[240px]">
          <Briefcase className="w-4 h-4 text-gray-400" />
          <Select value={selectedProject} onValueChange={onProjectChange}>
            <SelectTrigger className="bg-[#1E293B] border-[#334155] text-white h-9 w-full">
              <SelectValue placeholder="Select Project" className="truncate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project} value={project}>{project}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Assigned PM filter */}
        <div className="flex items-center gap-2 w-[190px]">
          <User className="w-4 h-4 text-gray-400" />
          <Select value={selectedAssignedPM} onValueChange={onAssignedPMChange}>
            <SelectTrigger className="bg-[#1E293B] border-[#334155] text-white h-9 w-full">
              <SelectValue placeholder="Select Assigned PM" className="truncate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assigned PM</SelectItem>
              {assignedPMs.map((owner) => (
                <SelectItem key={owner} value={owner}>{owner}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
}
