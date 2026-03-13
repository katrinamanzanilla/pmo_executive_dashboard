import { Filter, Calendar, Briefcase, User } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface DashboardHeaderProps {
  selectedProject: string;
  selectedAssignedPM: string;
  selectedMonth: string;   // '01'–'12' or 'all'
  selectedYear: string;    // '2025', '2026' or 'all'
  onProjectChange: (value: string) => void;
  onAssignedPMChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onYearChange: (value: string) => void;
  projects: string[];
  assignedPMs: string[];
  // legacy prop kept so BoardSummary doesn't break
  selectedDateRange?: string;
  onDateRangeChange?: (value: string) => void;
  monthOptions?: { key: string; label: string }[];
}

const MONTHS = [
  { value: '01', label: 'January' },  { value: '02', label: 'February' },
  { value: '03', label: 'March' },    { value: '04', label: 'April' },
  { value: '05', label: 'May' },      { value: '06', label: 'June' },
  { value: '07', label: 'July' },     { value: '08', label: 'August' },
  { value: '09', label: 'September' },{ value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
];

const YEARS = ['2025', '2026'];

export function DashboardHeader({
  selectedProject,
  selectedAssignedPM,
  selectedMonth,
  selectedYear,
  onProjectChange,
  onAssignedPMChange,
  onMonthChange,
  onYearChange,
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

        {/* Month dropdown */}
        <div className="flex items-center gap-2 w-[160px]">
          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <Select value={selectedMonth} onValueChange={onMonthChange}>
            <SelectTrigger className="bg-[#1E293B] border-[#334155] text-white h-9 w-full">
              <SelectValue placeholder="All Months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {MONTHS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year dropdown */}
        <div className="w-[110px]">
          <Select value={selectedYear} onValueChange={onYearChange}>
            <SelectTrigger className="bg-[#1E293B] border-[#334155] text-white h-9 w-full">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {YEARS.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
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
