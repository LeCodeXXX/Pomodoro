import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Clock3, Loader2, ListChecks, X } from 'lucide-react'

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
        const response = await fetch(`http://localhost:3000/api/quiz/${quizId}/attempts`, {
          headers: {
            'x-user-id': userId,
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
        <div className="fixed inset-0 z-260 flex items-center justify-center px-4 py-6 sm:px-6">
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
            className="relative w-full max-w-4xl max-h-[88vh] overflow-hidden rounded-3xl border border-white/10 bg-[#121212] shadow-[0_30px_100px_rgba(0,0,0,0.75)]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/5 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[11px] uppercase text-gray-500">Quiz attempt tracker</p>
                <h2 className="mt-2 text-lg font-medium text-white sm:text-xl">{quizTitle}</h2>
              </div>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[calc(88vh-76px)] overflow-y-auto custom-scrollbar px-5 py-5 sm:px-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-16 text-center text-gray-400">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-300" />
                  <p className="text-sm">Loading attempts...</p>
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
                  {error}
                </div>
              ) : (
                <>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
                      <p className="text-[11px] uppercase text-gray-500">Attempts</p>
                      <p className="mt-2 text-2xl font-semibold text-white">{summary?.totalAttempts ?? 0}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
                      <p className="text-[11px] uppercase text-gray-500">Best score</p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {summary ? `${summary.bestScore ?? 0} / ${summary.totalQuestions ?? totalQuestions}` : `0 / ${totalQuestions}`}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
                      <p className="text-[11px] uppercase text-gray-500">Average score</p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {summary ? `${Number(summary.averageScore ?? 0).toFixed(1)} / ${summary.totalQuestions ?? totalQuestions}` : `0 / ${totalQuestions}`}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
                      <p className="text-[11px] uppercase text-gray-500">Average accuracy</p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {summary ? `${Math.round((summary.averageAccuracy ?? 0) * 100)}%` : '0%'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {attempts.length ? attempts.map((attempt: any) => {
                      const correctCount = attempt.answers?.filter((answer: any) => answer.isCorrect).length || 0
                      const wrongCount = (attempt.answers?.length || 0) - correctCount

                      return (
                        <div key={attempt.id} className="rounded-2xl border border-white/8 bg-[#171717] p-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="mt-1 inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-gray-500">
                                <Clock3 className="h-3.5 w-3.5" />
                                Completed {new Date(attempt.completedAt).toLocaleString()}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-emerald-300">
                              {attempt.score} / {attempt.totalQuestions}
                            </p>
                          </div>

                          <div className="mt-3 grid gap-2 sm:grid-cols-3">
                            <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-sm text-gray-300">
                              Correct: {correctCount}
                            </div>
                            <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-sm text-gray-300">
                              Wrong: {wrongCount}
                            </div>
                            <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-sm text-gray-300">
                              Accuracy: {formatAccuracy(attempt.score, attempt.totalQuestions || totalQuestions)}
                            </div>
                          </div>
                        </div>
                      )
                    }) : (
                      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/10 px-5 py-16 text-center">
                        <ListChecks className="h-7 w-7 text-gray-500" />
                        <p className="mt-4 text-sm text-gray-400">No attempts recorded yet.</p>
                        <p className="mt-1 text-sm text-gray-500">Press Check Answers to save the first result.</p>
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
