import type { ReactNode } from 'react'
import { BarChart2 } from 'lucide-react'

interface ChartCardProps {
  title: string
  description?: string
  isEmpty: boolean
  isLoading: boolean
  children: ReactNode
  headerRight?: ReactNode
}

export function ChartCard({
  title,
  description,
  isEmpty,
  isLoading,
  children,
  headerRight,
}: ChartCardProps) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm font-medium text-white tracking-tight">{title}</h3>
          {description && (
            <p className="text-[11px] text-gray-600 mt-0.5">{description}</p>
          )}
        </div>
        {headerRight && <div>{headerRight}</div>}
      </div>

      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-gray-700 border-t-gray-400 rounded-full animate-spin" />
        </div>
      ) : isEmpty ? (
        <div className="h-48 flex flex-col items-center justify-center gap-2 text-center">
          <BarChart2 className="w-6 h-6 text-gray-700" />
          <p className="text-[11px] text-gray-600 tracking-wide">No data for this period</p>
        </div>
      ) : (
        children
      )}
    </div>
  )
}
