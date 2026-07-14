import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { ChartCard } from './ChartCard'
import type { WeeklyProductivityPoint } from '../../hooks/useChartData'

interface Props {
  data: WeeklyProductivityPoint[]
  isLoading: boolean
}

type Metric = 'focusTime' | 'sessions'

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
  metric: Metric
}

function CustomTooltip({ active, payload, label, metric }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const val = payload[0].value as number
  return (
    <div className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-white font-medium">
        {metric === 'focusTime' ? formatFocusTime(val) : `${val} session${val !== 1 ? 's' : ''}`}
      </p>
    </div>
  )
}

export function WeeklyProductivityChart({ data, isLoading }: Props) {
  const [metric, setMetric] = useState<Metric>('focusTime')

  const isEmpty = !isLoading && data.every(d => (metric === 'focusTime' ? d.focusTime : d.sessions) === 0)

  const maxVal = Math.max(...data.map(d => (metric === 'focusTime' ? d.focusTime : d.sessions)), 1)

  const toggle = (
    <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-0.5">
      <button
        onClick={() => setMetric('focusTime')}
        className={`text-[10px] tracking-wide px-2.5 py-1 rounded-md transition-all ${
          metric === 'focusTime' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
        }`}
      >
        Focus
      </button>
      <button
        onClick={() => setMetric('sessions')}
        className={`text-[10px] tracking-wide px-2.5 py-1 rounded-md transition-all ${
          metric === 'sessions' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
        }`}
      >
        Sessions
      </button>
    </div>
  )

  return (
    <ChartCard
      title="Weekly Productivity"
      description="Activity by day of week"
      isEmpty={isEmpty}
      isLoading={isLoading}
      headerRight={toggle}
    >
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} barSize={22} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <XAxis
            dataKey="day"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={v => metric === 'focusTime' ? formatFocusTime(v) : String(v)}
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip
            content={<CustomTooltip metric={metric} />}
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          />
          <Bar dataKey={metric} radius={[4, 4, 0, 0]}>
            {data.map((entry) => {
              const val = metric === 'focusTime' ? entry.focusTime : entry.sessions
              const intensity = maxVal > 0 ? val / maxVal : 0
              const opacity = 0.2 + intensity * 0.7
              return (
                <Cell
                  key={entry.day}
                  fill={`rgba(255, 255, 255, ${opacity})`}
                />
              )
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
