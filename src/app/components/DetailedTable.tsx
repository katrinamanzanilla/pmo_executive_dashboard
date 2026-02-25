import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Task } from '../data/mockData';

interface DetailedTableProps {
  tasks: Task[];
}

export function DetailedTable({ tasks }: DetailedTableProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'default';
      case 'On Track':
        return 'default';
      case 'At Risk':
        return 'default';
      case 'Delayed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-[#059669] text-white hover:bg-[#047857]';
      case 'On Track':
        return 'bg-[#1E3A8A] text-white hover:bg-[#1E40AF]';
      case 'At Risk':
        return 'bg-[#F59E0B] text-white hover:bg-[#D97706]';
      case 'Delayed':
        return 'bg-[#DC2626] text-white hover:bg-[#B91C1C]';
      default:
        return '';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card className="shadow-[0px_8px_24px_rgba(0,0,0,0.05)]">
      <CardHeader>
        <CardTitle>Task Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Task Name</TableHead>
                <TableHead className="font-semibold">Project</TableHead>
                <TableHead className="font-semibold">Owner</TableHead>
                <TableHead className="font-semibold">Developer</TableHead>
                <TableHead className="font-semibold">Start Date</TableHead>
                <TableHead className="font-semibold">End Date</TableHead>
                <TableHead className="font-semibold">% Complete</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{task.name}</TableCell>
                  <TableCell>{task.project}</TableCell>
                  <TableCell>{task.owner}</TableCell>
                  <TableCell>{task.developer}</TableCell>
                  <TableCell className="text-[#6B7280]">{formatDate(task.startDate)}</TableCell>
                  <TableCell className="text-[#6B7280]">{formatDate(task.endDate)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[80px]">
                        <div
                          className={`h-full ${task.completion === 100 ? 'bg-[#059669]' : 'bg-[#1E3A8A]'}`}
                          style={{ width: `${task.completion}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{task.completion}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
