import { useEffect, useState, useCallback, useRef } from 'react'
import { getAuthHeader } from '../utils/auth'

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

  // Keep a stable ref to the current userId/filter so refetch always uses up-to-date values
  const paramsRef = useRef({ userId, filter })
  paramsRef.current = { userId, filter }

  const fetchData = useCallback(async () => {
    const { userId: uid, filter: f } = paramsRef.current
    if (!uid) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `http://localhost:3000/api/users/chart-data?filter=${f}`,
        { headers: { ...getAuthHeader() } }
      )
      if (!res.ok) throw new Error('Failed to fetch chart data')
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Re-fetch whenever userId or filter changes
  useEffect(() => {
    fetchData()
  }, [userId, filter, fetchData])

  return { data, loading, error, refetch: fetchData }
}
