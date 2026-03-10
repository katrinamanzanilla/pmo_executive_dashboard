import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { projects, risks, Project } from '../data/mockData';
import { AlertTriangle, TrendingUp, DollarSign, Shield } from 'lucide-react';
import { DEFAULT_GOOGLE_SHEET_SOURCE_URL, fetchTasksFromGoogleSheet } from '../data/googleSheetTasks';
import type { Task } from '../data/mockData';

export function BoardSummary() {
  const [sheetTasks, setSheetTasks] = useState<Task[]>([]);
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [sheetError, setSheetError] = useState('');

  useEffect(() => {
    const loadSheetTasks = async () => {
      setIsLoadingSheet(true);
      setSheetError('');

      try {
        const tasks = await fetchTasksFromGoogleSheet(DEFAULT_GOOGLE_SHEET_SOURCE_URL);
        setSheetTasks(tasks);
      } catch (error) {
        setSheetError(error instanceof Error ? error.message : 'Failed to load Google Sheet.');
      } finally {
        setIsLoadingSheet(false);
      }
    };

    void loadSheetTasks();
  }, []);

  // Portfolio Health Data (100% stacked bar) grouped by developer
  const portfolioHealthData = useMemo(() => {
    const summaryByDeveloper = sheetTasks.reduce(
      (acc, task) => {
        const developerName = task.developer?.trim() || 'Unassigned';
        if (!acc[developerName]) {
          acc[developerName] = { totalCompletion: 0, taskCount: 0 };
        }

        acc[developerName].totalCompletion += task.completion;
        acc[developerName].taskCount += 1;
        return acc;
      },
      {} as Record<string, { totalCompletion: number; taskCount: number }>,
    );

    return Object.entries(summaryByDeveloper)
      .map(([developer, summary]) => {
        const completed = Math.round(summary.totalCompletion / summary.taskCount);
        return {
          name: developer.length > 20 ? `${developer.substring(0, 20)}...` : developer,
          completed,
          remaining: 100 - completed,
        };
      })
      .sort((a, b) => b.completed - a.completed);
  }, [sheetTasks]);

  // Top 5 risks sorted by impact and probability
  const topRisks = [...risks].sort((a, b) => {
    const impactScore = (impact: string) => impact === 'High' ? 3 : impact === 'Medium' ? 2 : 1;
    const probScore = (prob: string) => prob === 'High' ? 3 : prob === 'Medium' ? 2 : 1;
    return (impactScore(b.impact) * probScore(b.probability)) - (impactScore(a.impact) * probScore(a.probability));
  });

  // Risk heatmap data grouped by owner
  const riskByOwner = risks.reduce((acc, risk) => {
    if (!acc[risk.owner]) {
      acc[risk.owner] = { high: 0, medium: 0, low: 0 };
    }
    const level = risk.impact.toLowerCase() as 'high' | 'medium' | 'low';
    acc[risk.owner][level]++;
    return acc;
  }, {} as Record<string, { high: number; medium: number; low: number }>);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High':
        return 'bg-[#DC2626] text-white hover:bg-[#B91C1C]';
      case 'Medium':
        return 'bg-[#F59E0B] text-white hover:bg-[#D97706]';
      case 'Low':
@@ -108,53 +154,55 @@ export function BoardSummary() {
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-[0px_8px_24px_rgba(0,0,0,0.05)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6B7280] mb-2">Resource Util.</p>
                  <div className="text-3xl font-bold text-[#111827]">87%</div>
                  <p className="text-xs text-[#6B7280] mt-1">Team capacity</p>
                </div>
                <div className="w-12 h-12 bg-[#F59E0B] rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Health Chart */}
        <Card className="mb-6 shadow-[0px_8px_24px_rgba(0,0,0,0.05)]">
          <CardHeader>
            <CardTitle>Portfolio Health by Developer (100% Stacked Bar)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSheet ? <p className="mb-4 text-sm text-[#6B7280]">Loading Google Sheet data...</p> : null}
            {sheetError ? <p className="mb-4 text-sm text-red-600">{sheetError}</p> : null}
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={portfolioHealthData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={150} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" stackId="a" fill="#059669" name="Completed" />
                <Bar dataKey="remaining" stackId="a" fill="#E5E7EB" name="Remaining" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Top 5 Delivery Risks */}
          <Card className="shadow-[0px_8px_24px_rgba(0,0,0,0.05)]">
            <CardHeader>
              <CardTitle>Top 5 Delivery Risks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">

                      <TableHead className="font-semibold">Project</TableHead>
                      <TableHead className="font-semibold">Risk</TableHead>
                      <TableHead className="font-semibold">Impact</TableHead>
                      <TableHead className="font-semibold">Probability</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topRisks.map((risk, index) => (
                      <TableRow key={index} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{risk.project}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{risk.risk}</TableCell>
                        <TableCell>
                          <Badge className={getImpactColor(risk.impact)}>
                            {risk.impact}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getImpactColor(risk.probability)}>
                            {risk.probability}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Risk Heatmap by Owner */}
          <Card className="shadow-[0px_8px_24px_rgba(0,0,0,0.05)]">
            <CardHeader>
              <CardTitle>Risk Heatmap by Owner</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(riskByOwner).map(([owner, counts]) => (
                  <div key={owner} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#111827]">{owner}</span>
                      <span className="text-xs text-[#6B7280]">
                        Total: {counts.high + counts.medium + counts.low}
                      </span>
                    </div>
                    <div className="flex gap-1 h-8">
                      {counts.high > 0 && (
                        <div
                          className="bg-[#DC2626] rounded flex items-center justify-center text-white text-xs font-medium"
                          style={{ width: `${(counts.high / (counts.high + counts.medium + counts.low)) * 100}%` }}
                        >
                          {counts.high}
                        </div>
                      )}
                      {counts.medium > 0 && (
                        <div
                          className="bg-[#F59E0B] rounded flex items-center justify-center text-white text-xs font-medium"
                          style={{ width: `${(counts.medium / (counts.high + counts.medium + counts.low)) * 100}%` }}
                        >
                          {counts.medium}
                        </div>
                      )}
                      {counts.low > 0 && (
                        <div
                          className="bg-[#059669] rounded flex items-center justify-center text-white text-xs font-medium"
                          style={{ width: `${(counts.low / (counts.high + counts.medium + counts.low)) * 100}%` }}
                        >
                          {counts.low}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-6 mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#DC2626] rounded"></div>
                  <span className="text-sm text-[#6B7280]">High</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#F59E0B] rounded"></div>
                  <span className="text-sm text-[#6B7280]">Medium</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#059669] rounded"></div>
                  <span className="text-sm text-[#6B7280]">Low</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mitigation Strategies */}
        <Card className="shadow-[0px_8px_24px_rgba(0,0,0,0.05)]">
          <CardHeader>
            <CardTitle>Risk Mitigation Strategies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Project</TableHead>
                    <TableHead className="font-semibold">Risk</TableHead>
                    <TableHead className="font-semibold">Owner</TableHead>
                    <TableHead className="font-semibold">Mitigation Strategy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {risks.map((risk, index) => (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{risk.project}</TableCell>
                      <TableCell>{risk.risk}</TableCell>
                      <TableCell>{risk.owner}</TableCell>
                      <TableCell className="text-sm">{risk.mitigation}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
