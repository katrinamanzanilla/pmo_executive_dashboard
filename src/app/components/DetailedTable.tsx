import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import type { Task } from '../data/mockData';

interface DetailedTableProps {
  tasks: Task[];
}

// ─── Dynamic status color — covers known values + fallback for anything else ──

const STATUS_COLORS: Record<string, string> = {
  'completed':       '#1E3A8A',
  'done':            '#1E3A8A',
  'on track':        '#059669',
  'ongoing':         '#3B82F6',
  'on going':        '#3B82F6',
  'in progress':     '#3B82F6',
  'at risk':         '#F59E0B',
  'delayed':         '#DC2626',
  'not yet started': '#94A3B8',
  'not started':     '#94A3B8',
  'on hold':         '#8B5CF6',
  'cancelled':       '#6B7280',
  'for testing':     '#0EA5E9',
  'for review':      '#F97316',
};

const getStatusColor = (raw: string): string =>
  STATUS_COLORS[raw.trim().toLowerCase()] ?? '#6B7280';

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

const formatTargetRange = (startDate: string, endDate: string) =>
  `${formatDate(startDate)} - ${formatDate(endDate)}`;

export function DetailedTable({ tasks }: DetailedTableProps) {
  return (
    <Card className="shadow-[0px_8px_24px_rgba(0,0,0,0.05)]">
      <CardHeader className="pb-3">
        <CardTitle>Task Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[420px] overflow-y-auto rounded-md border border-gray-200">
          <Table className="w-full table-fixed">
            <TableHeader className="sticky top-0 z-10 bg-gray-100">
              <TableRow className="bg-gray-100 hover:bg-gray-100">
                <TableHead className="w-[34%] whitespace-normal px-3 py-3 font-semibold text-[#111827]">Project Name</TableHead>
                <TableHead className="w-[16%] whitespace-normal px-3 py-3 font-semibold text-[#111827]">Developer</TableHead>
                <TableHead className="w-[16%] whitespace-normal px-3 py-3 font-semibold text-[#111827]">Assigned PM</TableHead>
                <TableHead className="w-[14%] px-3 py-3 font-semibold text-[#111827]">Status</TableHead>
                <TableHead className="w-[20%] whitespace-normal px-3 py-3 font-semibold text-[#111827]">Target Start and End Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => {
                const raw = task.rawStatus?.trim() || '';
                const isEmpty = !raw || raw === '—';
                return (
                  <TableRow key={task.id} className="border-b border-gray-200 bg-white hover:bg-slate-50/60">
                    <TableCell className="whitespace-normal break-words px-3 py-3 font-semibold leading-5 text-[#111827]">{task.project}</TableCell>
                    <TableCell className="whitespace-normal break-words px-3 py-3 text-[#111827]">{task.developer}</TableCell>
                    <TableCell className="whitespace-normal break-words px-3 py-3 text-[#111827]">{task.owner}</TableCell>
                    <TableCell className="px-3 py-3 align-top">
                      {isEmpty ? (
                        <span className="text-[#9CA3AF] text-sm">—</span>
                      ) : (
                        <Badge
                          className="rounded-full px-3 py-1 text-sm font-semibold text-white"
                          style={{ backgroundColor: getStatusColor(raw) }}
                        >
                          {raw}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-normal px-3 py-3 text-[#64748B]">{formatTargetRange(task.startDate, task.endDate)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
