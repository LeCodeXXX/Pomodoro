import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Clock3, Loader2, ListChecks, X } from 'lucide-react'
import { getAuthHeader } from '../utils/auth'
import { apiUrl } from '../utils/api'

interface QuizAttemptTrackerModalProps {
  isOpen: boolean
  onClose: () => void
  quizId: string
  quizTitle: string
  userId?: string
  totalQuestions: number
  refreshToken?: number
}

function formatAccuracy(score: number, totalQuestions: number) {
  const denominator = totalQuestions > 0 ? totalQuestions : 1
  return `${Math.round((score / denominator) * 100)}%`
}

export function QuizAttemptTrackerModal({
  isOpen,
  onClose,
  quizId,
  quizTitle,
  userId,
  totalQuestions,
  refreshToken = 0,
}: QuizAttemptTrackerModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState<any>(null)
  const [attempts, setAttempts] = useState<any[]>([])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const loadAttempts = async () => {
      if (!quizId) {
        setError('This quiz must be saved before attempts can be viewed.')
        return
      }

      if (!userId) {
        setError('Sign in to view quiz attempts.')
        return
      }

      setIsLoading(true)
      setError('')

      try {
        const response = await fetch(apiUrl(`/api/quiz/${quizId}/attempts`), {
          headers: {
            ...getAuthHeader(),
          },
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load quiz attempts.')
        }

        setSummary(data.summary)
        setAttempts(data.attempts || [])
      } catch (requestError: any) {
        setError(requestError.message || 'Failed to load quiz attempts.')
      } finally {
        setIsLoading(false)
      }
    }

    loadAttempts()
  }, [isOpen, quizId, userId, refreshToken])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-260 flex items-center justify-center p-2 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 16 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="relative w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-[#121212] shadow-[0_30px_100px_rgba(0,0,0,0.75)]"
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3 sm:px-6 sm:py-4">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-gray-500">Quiz attempt tracker</p>
                <h2 className="mt-0.5 text-base sm:text-xl font-medium text-white truncate">{quizTitle}</h2>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white shrink-0"
              >
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>

            <div className="max-h-[calc(92vh-60px)] sm:max-h-[calc(88vh-76px)] overflow-y-auto custom-scrollbar px-3.5 py-4 sm:px-6 sm:py-5">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 sm:py-16 text-center text-gray-400">
                  <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-indigo-300" />
                  <p className="text-xs sm:text-sm">Loading attempts...</p>
                </div>
              ) : error ? (
                <div className="rounded-xl sm:rounded-2xl border border-red-500/20 bg-red-500/10 p-3.5 sm:p-4 text-xs sm:text-sm text-red-100">
                  {error}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl sm:rounded-2xl border border-white/8 bg-white/3 p-3 sm:p-4">
                      <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-gray-500">Attempts</p>
                      <p className="mt-1 sm:mt-2 text-base sm:text-2xl font-semibold text-white">{summary?.totalAttempts ?? 0}</p>
                    </div>
                    <div className="rounded-xl sm:rounded-2xl border border-white/8 bg-white/3 p-3 sm:p-4">
                      <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-gray-500">Best score</p>
                      <p className="mt-1 sm:mt-2 text-base sm:text-2xl font-semibold text-white">
                        {summary ? `${summary.bestScore ?? 0} / ${summary.totalQuestions ?? totalQuestions}` : `0 / ${totalQuestions}`}
                      </p>
                    </div>
                    <div className="rounded-xl sm:rounded-2xl border border-white/8 bg-white/3 p-3 sm:p-4">
                      <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-gray-500">Average score</p>
                      <p className="mt-1 sm:mt-2 text-base sm:text-2xl font-semibold text-white">
                        {summary ? `${Number(summary.averageScore ?? 0).toFixed(1)} / ${summary.totalQuestions ?? totalQuestions}` : `0 / ${totalQuestions}`}
                      </p>
                    </div>
                    <div className="rounded-xl sm:rounded-2xl border border-white/8 bg-white/3 p-3 sm:p-4">
                      <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-gray-500">Average accuracy</p>
                      <p className="mt-1 sm:mt-2 text-base sm:text-2xl font-semibold text-white">
                        {summary ? `${Math.round((summary.averageAccuracy ?? 0) * 100)}%` : '0%'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-5 space-y-2.5 sm:space-y-3">
                    {attempts.length ? attempts.map((attempt: any) => {
                      const correctCount = attempt.answers?.filter((answer: any) => answer.isCorrect).length || 0
                      const wrongCount = (attempt.answers?.length || 0) - correctCount

                      return (
                        <div key={attempt.id} className="rounded-xl sm:rounded-2xl border border-white/8 bg-[#171717] p-3 sm:p-4">
                          <div className="flex flex-row items-center justify-between gap-2">
                            <p className="inline-flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs uppercase tracking-wider text-gray-500">
                              <Clock3 className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                              <span className="truncate">{new Date(attempt.completedAt).toLocaleDateString()}</span>
                            </p>
                            <p className="text-xs sm:text-sm font-semibold text-emerald-300 shrink-0">
                              {attempt.score} / {attempt.totalQuestions}
                            </p>
                          </div>

                          <div className="mt-2.5 grid grid-cols-3 gap-1.5 sm:gap-2">
                            <div className="rounded-lg sm:rounded-xl border border-white/8 bg-black/20 px-2 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-sm text-gray-300 text-center sm:text-left">
                              <span className="hidden sm:inline">Correct: </span>✓ {correctCount}
                            </div>
                            <div className="rounded-lg sm:rounded-xl border border-white/8 bg-black/20 px-2 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-sm text-gray-300 text-center sm:text-left">
                              <span className="hidden sm:inline">Wrong: </span>✗ {wrongCount}
                            </div>
                            <div className="rounded-lg sm:rounded-xl border border-white/8 bg-black/20 px-2 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-sm text-gray-300 text-center sm:text-left">
                              {formatAccuracy(attempt.score, attempt.totalQuestions || totalQuestions)}
                            </div>
                          </div>
                        </div>
                      )
                    }) : (
                      <div className="flex flex-col items-center justify-center rounded-xl sm:rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-10 sm:py-16 text-center">
                        <ListChecks className="h-6 w-6 sm:h-7 sm:w-7 text-gray-500" />
                        <p className="mt-3 text-xs sm:text-sm text-gray-400">No attempts recorded yet.</p>
                        <p className="mt-1 text-[11px] sm:text-sm text-gray-500">Press Check Answers to save the first result.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
