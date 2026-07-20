import { useState, useEffect } from 'react'
import { Clock, Target, BookOpen, BrainCircuit, Activity, Coffee, Flame } from 'lucide-react'
import { useChartData, type ChartFilter } from '../hooks/useChartData'
import { WeeklyProductivityChart } from '../components/charts/WeeklyProductivityChart'
import { StudyTimeTrendChart } from '../components/charts/StudyTimeTrendChart'

interface Stats {
  totalPomodoroSessions: number;
  totalFocusTime: number;
  totalBreakTime: number;
  currentStreak: number;
  documentsCount: number;
  totalQuizzesTaken: number;
  averageQuizScore: number;
}

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

function StatCard({ icon, label, value }: StatsCardProps) {
  return (
    <div className="bg-white/2 border border-white/5 rounded-xl py-3 px-4 flex flex-col justify-between hover:bg-white/4 transition-colors group">
      <div className="flex items-center gap-1.5 text-gray-500 mb-1 group-hover:text-gray-300 transition-colors">
        {icon}
        <span className="text-[9px] sm:text-[10px] uppercase tracking-widest font-medium truncate">{label}</span>
      </div>
      <div className="text-2xl sm:text-3xl font-light text-white">{value}</div>
    </div>
  )
}

const FILTERS: { label: string; value: ChartFilter }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
]

interface StatsPageProps {
  user: any;
  stats: Stats | null;
  statsLoading: boolean;
  /** Called once on mount so App.tsx can trigger a chart refetch after a session. */
  onRegisterRefetch?: (refetch: () => void) => void;
}

export function StatsPage({ user, stats, statsLoading, onRegisterRefetch }: StatsPageProps) {
  const [filter, setFilter] = useState<ChartFilter>('weekly')
  const { data: chartData, loading: chartLoading, refetch } = useChartData(user?.id, filter)

  // Register the refetch function with the parent so it can be called externally
  useEffect(() => {
    if (onRegisterRefetch) {
      onRegisterRefetch(refetch)
    }
  }, [onRegisterRefetch, refetch])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  if (!user) {
    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center text-center py-20">
        <Activity className="w-12 h-12 text-gray-700 mb-4" />
        <h2 className="text-xl font-light text-gray-400">Please sign in to view your statistics.</h2>
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 mt-2">
      {/* Header + global filter (Static, won't scroll) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-light text-white tracking-tight">Your Activity</h2>
          <p className="text-gray-500 text-xs">A summary of your focus sessions and learning progress.</p>
        </div>
        <div className="flex items-center gap-1 bg-white/4 rounded-lg p-0.5 self-start sm:self-auto">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`text-[10px] tracking-wide px-3 py-1.5 sm:px-2.5 sm:py-1 rounded-md transition-all ${
                filter === f.value ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Container for Cards and Charts */}
      <div className="flex flex-col gap-6 max-h-[60vh] overflow-y-auto no-scrollbar pr-1">
        {/* Stat summary cards — 3 rows × 2 cols on mobile, 2 rows × 3 cols on large screens */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
          <StatCard
            icon={<Clock className="w-3.5 h-3.5" />}
            label="Focus Time"
            value={statsLoading ? '—' : stats ? formatTime(stats.totalFocusTime) : '0m'}
          />
          <StatCard
            icon={<Coffee className="w-3.5 h-3.5" />}
            label="Break Time"
            value={statsLoading ? '—' : stats ? formatTime(stats.totalBreakTime ?? 0) : '0m'}
          />
          <StatCard
            icon={<Target className="w-3.5 h-3.5" />}
            label="Sessions"
            value={statsLoading ? '—' : stats?.totalPomodoroSessions ?? 0}
          />
          <StatCard
            icon={<Flame className="w-3.5 h-3.5" />}
            label="Study Streak"
            value={
              statsLoading ? '—' : (
                <span>
                  {stats?.currentStreak ?? 0}
                  <span className="text-xs sm:text-sm text-gray-500 font-light ml-1">day{(stats?.currentStreak ?? 0) !== 1 ? 's' : ''}</span>
                </span>
              )
            }
          />
          <StatCard
            icon={<BookOpen className="w-3.5 h-3.5" />}
            label="Materials"
            value={statsLoading ? '—' : stats?.documentsCount ?? 0}
          />
          <StatCard
            icon={<BrainCircuit className="w-3.5 h-3.5" />}
            label="Avg Score"
            value={
              statsLoading ? '—' : (
                <span>
                  {stats?.averageQuizScore ?? 0}
                  <span className="text-xs sm:text-sm text-gray-500 font-light ml-0.5">%</span>
                </span>
              )
            }
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <WeeklyProductivityChart
            data={chartData?.weeklyProductivity ?? []}
            isLoading={chartLoading}
          />
          <StudyTimeTrendChart
            data={chartData?.studyTimeTrend ?? []}
            filter={filter}
            isLoading={chartLoading}
          />
        </div>
      </div>
    </div>
  )
}
