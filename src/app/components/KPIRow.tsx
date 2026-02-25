import { Card, CardContent } from './ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon: LucideIcon;
  color: string;
}

function KPICard({ title, value, subtitle, trend, trendValue, icon: Icon, color }: KPICardProps) {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-[#059669]';
    if (trend === 'down') return 'text-[#DC2626]';
    return 'text-[#6B7280]';
  };

  return (
    <Card className="shadow-[0px_8px_24px_rgba(0,0,0,0.05)]">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-[#6B7280] mb-2">{title}</p>
            <div className="text-3xl font-bold text-[#111827] mb-1">{value}</div>
            {subtitle && <p className="text-xs text-[#6B7280]">{subtitle}</p>}
            {trend && trendValue && (
              <div className={`flex items-center gap-1 mt-2 ${getTrendColor()}`}>
                {getTrendIcon()}
                <span className="text-sm font-medium">{trendValue}</span>
              </div>
            )}
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface KPIRowProps {
  totalProjects: number;
  totalTasks: number;
  portfolioCompletion: number;
  delayedTasks: number;
}

export function KPIRow({ totalProjects, totalTasks, portfolioCompletion, delayedTasks }: KPIRowProps) {
  return (
    <div className="grid grid-cols-4 gap-6 mb-6">
      <KPICard
        title="Total Projects"
        value={totalProjects}
        subtitle="Active portfolio"
        trend="neutral"
        icon={(props) => (
          <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        )}
        color="bg-[#1E3A8A]"
      />
      <KPICard
        title="Total Tasks"
        value={totalTasks}
        subtitle="Across all projects"
        trend="up"
        trendValue="+12% from last month"
        icon={(props) => (
          <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        )}
        color="bg-[#059669]"
      />
      <KPICard
        title="Portfolio Completion"
        value={`${portfolioCompletion}%`}
        subtitle="Weighted average"
        trend="up"
        trendValue="+5% this quarter"
        icon={(props) => (
          <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        color="bg-[#059669]"
      />
      <KPICard
        title="Delayed Tasks"
        value={delayedTasks}
        subtitle="Require attention"
        trend="down"
        trendValue="Critical items"
        icon={(props) => (
          <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        color="bg-[#DC2626]"
      />
    </div>
  );
}
