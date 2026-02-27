import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import type { Task } from '../data/mockData';

interface DetailedTableProps {
  tasks: Task[];
}
const getStatusClassName = (status: Task['status']) => {
  switch (status) {
    case 'Completed':
      return 'bg-[#059669] text-white';
    case 'On Track':
      return 'bg-[#1E3A8A] text-white';
    case 'At Risk':
      return 'bg-[#F59E0B] text-white';
    case 'Delayed':
      return 'bg-[#DC2626] text-white';
    default:
      return 'bg-slate-500 text-white';
  }
};
const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
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
<div className="overflow-x-auto rounded-md border border-gray-200">
          <Table>
            <TableHeader>
 <TableRow className="bg-gray-100 hover:bg-gray-100">
                <TableHead className="min-w-[280px] px-4 py-3 font-semibold text-[#111827]">Project Name</TableHead>
                <TableHead className="min-w-[220px] px-4 py-3 font-semibold text-[#111827]">Developer</TableHead>
                <TableHead className="min-w-[200px] px-4 py-3 font-semibold text-[#111827]">Assigned PM</TableHead>
                <TableHead className="min-w-[120px] px-4 py-3 font-semibold text-[#111827]">Status</TableHead>
                <TableHead className="min-w-[260px] px-4 py-3 font-semibold text-[#111827]">Target Start and End Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
<TableRow key={task.id} className="border-b border-gray-200 bg-white hover:bg-slate-50/60">
                  <TableCell className="px-4 py-3 font-semibold text-[#111827]">{task.project}</TableCell>
                  <TableCell className="px-4 py-3 text-[#111827]">{task.developer}</TableCell>
                  <TableCell className="px-4 py-3 text-[#111827]">{task.owner}</TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusClassName(task.status)}`}>
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-[#64748B]">{formatTargetRange(task.startDate, task.endDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
