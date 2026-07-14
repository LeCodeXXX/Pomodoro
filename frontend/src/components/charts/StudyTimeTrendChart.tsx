import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts'
import { ChartCard } from './ChartCard'
import type { StudyTrendPoint, ChartFilter } from '../../hooks/useChartData'

interface Props {
  data: StudyTrendPoint[]
  filter: ChartFilter
  isLoading: boolean
}

function formatFocusTime(seconds: number): string {
  if (seconds === 0) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const val = payload[0].value as number
  return (
    <div className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-white font-medium">{formatFocusTime(val)}</p>
    </div>
  )
}

function getDescription(filter: ChartFilter): string {
  if (filter === 'daily') return 'Focus time by hour today'
  if (filter === 'weekly') return 'Focus time across this week'
  return 'Focus time by week this month'
}

// For daily view with 24 points, only show every 3rd tick
function getXAxisInterval(filter: ChartFilter): number | 'preserveStartEnd' {
  if (filter === 'daily') return 3
  return 0
}

export function StudyTimeTrendChart({ data, filter, isLoading }: Props) {
  const isEmpty = !isLoading && data.every(d => d.focusTime === 0)

  return (
    <ChartCard
      title="Study Time Trend"
      description={getDescription(filter)}
      isEmpty={isEmpty}
      isLoading={isLoading}
    >
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="rgba(255,255,255,0.15)" stopOpacity={1} />
              <stop offset="95%" stopColor="rgba(255,255,255,0)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval={getXAxisInterval(filter)}
          />
          <YAxis
            tickFormatter={v => formatFocusTime(v)}
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="focusTime"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth={1.5}
            fill="url(#trendGradient)"
            dot={false}
            activeDot={{ r: 3, fill: 'white', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
