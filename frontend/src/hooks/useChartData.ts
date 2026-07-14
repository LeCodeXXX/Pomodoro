import { useEffect, useState } from 'react'

export type ChartFilter = 'daily' | 'weekly' | 'monthly'

export interface WeeklyProductivityPoint {
  day: string
  focusTime: number
  sessions: number
}

export interface StudyTrendPoint {
  label: string
  focusTime: number
}

export interface ChartData {
  weeklyProductivity: WeeklyProductivityPoint[]
  studyTimeTrend: StudyTrendPoint[]
}

export function useChartData(userId: string | undefined, filter: ChartFilter) {
  const [data, setData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const fetchData = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/api/users/chart-data?filter=${filter}`,
          { headers: { 'x-user-id': userId } }
        )
        if (!res.ok) throw new Error('Failed to fetch chart data')
        const json = await res.json()
        setData(json)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId, filter])

  return { data, loading, error }
}
