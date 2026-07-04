import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, ChevronDown, X } from 'lucide-react'

interface QuizModalProps {
  isOpen: boolean
  onClose: () => void
  quiz: any
  userId?: string
}

function normalizeQuizPayload(quiz: any) {
  const quizData = quiz?.quiz && typeof quiz.quiz === 'object' ? quiz.quiz : quiz
  const questions = quizData?.questions || quiz?.questions || []

  return {
    id: quizData?.id || quiz?.id || '',
    title: quizData?.title || 'Generated Quiz',
    label: quizData?.label || '',
    difficulty: quizData?.difficulty || '',
    questionType: quizData?.question_type || quizData?.questionType || '',
    totalQuestions: quizData?.total_questions ?? quizData?.totalQuestions ?? questions.length,
    createdAt: quizData?.created_at || quizData?.createdAt || '',
    questions,
    metadata: quiz?.metadata,
    warnings: quiz?.warnings || [],
  }
}

function isCorrectOption(option: any, question: any) {
  if (typeof option.is_correct === 'boolean') return option.is_correct

  const correctAnswer = question.correct_answer || question.answer
  if (!correctAnswer) return false

  return option.id === correctAnswer || option.text === correctAnswer || option.optionText === correctAnswer
}

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function QuizModal({ isOpen, onClose, quiz, userId }: QuizModalProps) {
  const quizData = normalizeQuizPayload(quiz)
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [isSavingAttempt, setIsSavingAttempt] = useState(false)
  const [attemptsOpen, setAttemptsOpen] = useState(false)
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(false)
  const [attemptsError, setAttemptsError] = useState('')
  const [attemptSummary, setAttemptSummary] = useState<any>(null)
  const [attempts, setAttempts] = useState<any[]>([])
  const [savedAttempt, setSavedAttempt] = useState<any>(null)

  useEffect(() => {
    if (isOpen) {
      setResponses({})
      setSubmitted(false)
      setIsSavingAttempt(false)
      setAttemptsOpen(false)
      setIsLoadingAttempts(false)
      setAttemptsError('')
      setAttemptSummary(null)
      setAttempts([])
      setSavedAttempt(null)
    }
  }, [isOpen, quiz])

  const totalQuestions = quizData.questions.length

  const score = useMemo(() => {
    return quizData.questions.reduce((runningScore: number, question: any, index: number) => {
      const questionKey = question.id || String(index)
      const selectedAnswer = responses[questionKey]
      const correctAnswer = question.correct_answer ?? question.answer

      if (!selectedAnswer || !correctAnswer) return runningScore

      const questionType = (question.type || quizData.questionType || '').toLowerCase()
      if (questionType === 'identification') {
        return normalizeText(selectedAnswer) === normalizeText(String(correctAnswer))
          ? runningScore + 1
          : runningScore
      }

      return selectedAnswer === correctAnswer ? runningScore + 1 : runningScore
    }, 0)
  }, [quizData.questions, quizData.questionType, responses])

  const loadAttempts = async () => {
    if (!quizData.id) {
      setAttemptsError('This quiz must be saved before attempts can be viewed.')
      return
    }

    if (!quiz?.userId && !userId) {
      setAttemptsError('Sign in to view quiz attempts.')
      return
    }

    setAttemptsOpen(true)
    setIsLoadingAttempts(true)
    setAttemptsError('')

    try {
      const response = await fetch(`http://localhost:3000/api/quiz/${quizData.id}/attempts`, {
        headers: {
          'x-user-id': userId || quiz?.userId,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load quiz attempts.')
      }

      setAttemptSummary(data.summary)
      setAttempts(data.attempts || [])
    } catch (error: any) {
      setAttemptsError(error.message || 'Failed to load quiz attempts.')
    } finally {
      setIsLoadingAttempts(false)
    }
  }

  const submitQuiz = async () => {
    setSubmitted(true)

    if (!quizData.id || (!userId && !quiz?.userId)) {
      return
    }

    setIsSavingAttempt(true)

    try {
      const response = await fetch(`http://localhost:3000/api/quiz/${quizData.id}/attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || quiz?.userId,
        },
        body: JSON.stringify({ responses }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save quiz attempt.')
      }

      setSavedAttempt(data.attempt)

      if (attemptsOpen) {
        await loadAttempts()
      }
    } catch (error) {
      console.error('Failed to save quiz attempt:', error)
    } finally {
      setIsSavingAttempt(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && quiz && (
        <div className="fixed inset-0 z-250 flex items-center justify-center px-4 py-6 sm:px-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 18 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="relative w-full max-w-5xl max-h-[88vh] overflow-hidden rounded-3xl border border-white/10 bg-[#121212] shadow-[0_30px_100px_rgba(0,0,0,0.75)]"
          >

            <div className="flex items-center justify-between gap-4 border-b border-white/5 px-5 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-medium text-[#ededed] sm:text-xl">
                    {quizData.title}
                  </h2>
                  <p className="mt-1 text-[11px] uppercase text-gray-500">
                    Generated quiz preview
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[calc(88vh-76px)] overflow-y-auto custom-scrollbar px-5 py-5 sm:px-6">

              {quizData.warnings?.length ? (
                <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                  <p className="font-medium text-amber-200">Generation notes</p>
                  <ul className="mt-2 space-y-1 text-amber-50/90">
                    {quizData.warnings.map((warning: string) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-6 space-y-4">
                {quizData.questions.map((question: any, index: number) => {
                  const options = question.options?.map((option: any) => ({
                    id: option.id,
                    text: option.text ?? option.optionText ?? '',
                    is_correct: option.is_correct ?? option.isCorrect,
                  })) || []

                  const correctAnswer = question.correct_answer ?? question.answer

                  const questionKey = question.id || String(index)
                  const selectedAnswer = responses[questionKey] || ''
                  const questionType = (question.type || quizData.questionType || '').toLowerCase()
                  const answeredCorrectly = submitted
                    ? (questionType === 'identification'
                        ? normalizeText(selectedAnswer) === normalizeText(String(correctAnswer || ''))
                        : selectedAnswer === correctAnswer)
                    : false

                  return (
                  <motion.section
                    key={question.id || `${index}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: index * 0.03 }}
                    className="overflow-hidden rounded-2xl border border-white/8 bg-[#171717] shadow-[0_12px_40px_rgba(0,0,0,0.22)]"
                  >
                    <div className="flex items-start justify-between gap-4 border-b border-white/5 px-5 py-4 sm:px-6">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold uppercase text-indigo-200">
                            Question {index + 1}
                          </span>
                        </div>
                        <h3 className="mt-4 text-base font-medium leading-relaxed text-white sm:text-lg">
                          {question.question}
                        </h3>
                      </div>
                    </div>

                    <div className="px-5 py-5 sm:px-6">
                      {options.length ? (
                        <div className="grid gap-3 md:grid-cols-2">
                          {options.map((option: any, optionIndex: number) => {
                            const correct = isCorrectOption(option, question)
                            const selected = selectedAnswer === option.id
                            return (
                              <div
                                key={option.id || `${index}-${optionIndex}`}
                                role="button"
                                tabIndex={0}
                                onClick={() => !submitted && setResponses((current) => ({ ...current, [questionKey]: option.id }))}
                                onKeyDown={(event) => {
                                  if (!submitted && (event.key === 'Enter' || event.key === ' ')) {
                                    setResponses((current) => ({ ...current, [questionKey]: option.id }))
                                  }
                                }}
                                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
                                  submitted
                                    ? correct
                                      ? 'border-emerald-500/30 bg-emerald-500/10'
                                      : selected
                                        ? 'border-red-500/30 bg-red-500/10'
                                        : 'border-white/8 bg-white/3'
                                    : selected
                                      ? 'border-indigo-400/30 bg-indigo-500/10'
                                      : 'border-white/8 bg-white/3'
                                }`}
                              >
                                <div
                                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold ${
                                    submitted
                                      ? correct
                                        ? 'border-emerald-400/30 bg-emerald-400 text-black'
                                        : selected
                                          ? 'border-red-400/30 bg-red-400 text-black'
                                          : 'border-white/10 bg-white/5 text-gray-400'
                                      : selected
                                        ? 'border-indigo-400/30 bg-indigo-400 text-black'
                                      : 'border-white/10 bg-white/5 text-gray-400'
                                  }`}
                                >
                                  {submitted && correct ? <CheckCircle2 className="h-3.5 w-3.5" /> : optionIndex + 1}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm leading-relaxed text-gray-200">{option.text}</p>
                                  {submitted && correct ? (
                                    <p className="mt-1 text-[11px] font-semibold uppercase text-emerald-300">
                                      Correct answer
                                    </p>
                                  ) : submitted && selected && !correct ? (
                                    <p className="mt-1 text-[11px] font-semibold uppercase text-red-300">
                                      Your choice
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
                          <p className="text-[11px] uppercase text-gray-500">Answer</p>
                          <input
                            value={selectedAnswer}
                            onChange={(event) => !submitted && setResponses((current) => ({ ...current, [questionKey]: event.target.value }))}
                            disabled={submitted}
                            className="mt-3 w-full rounded-2xl border border-white/10 bg-[#0f0f0f] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-white/25 disabled:cursor-not-allowed disabled:opacity-70"
                            placeholder="Type your answer"
                          />
                          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-[11px] uppercase text-gray-500">After submit</p>
                            <p className={`mt-2 text-sm ${submitted && answeredCorrectly ? 'text-emerald-300' : 'text-gray-200'}`}>
                              {submitted
                                ? answeredCorrectly
                                  ? 'Correct answer'
                                  : `Correct answer: ${correctAnswer || 'No answer provided'}`
                                : 'Submit the quiz to check this response.'}
                            </p>
                          </div>
                        </div>
                      )}

                      {submitted && question.explanation ? (
                        <div className="mt-4 rounded-2xl border border-cyan-500/10 bg-cyan-500/5 p-4">
                          <div className="flex items-center gap-2 text-[11px] uppercase text-cyan-200/80">
                            <ChevronDown className="h-4 w-4" />
                            Explanation
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-gray-200">{question.explanation}</p>
                        </div>
                      ) : null}
                    </div>
                  </motion.section>
                  )
                })}
              </div>

              <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-white/8 bg-white/3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] uppercase text-gray-500">Progress</p>
                  <p className="mt-2 text-sm text-gray-200">
                    {Object.keys(responses).length} / {totalQuestions} answered
                  </p>
                  {submitted ? (
                    <p className="mt-1 text-sm text-emerald-300">
                      Score: {score} / {totalQuestions}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {setResponses({}); setSubmitted(false);}}
                    className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => {
                      if (attemptsOpen) {
                        setAttemptsOpen(false)
                        return
                      }

                      loadAttempts()
                    }}
                    className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    {attemptsOpen ? 'Hide Attempts' : 'View Attempts'}
                  </button>
                  <button
                    onClick={submitQuiz}
                    disabled={isSavingAttempt}
                    className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-5 py-2.5 text-sm font-semibold text-indigo-200 transition-colors hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSavingAttempt ? 'Saving...' : 'Check Answers'}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {attemptsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4 rounded-2xl border border-white/8 bg-[#151515] p-4 sm:p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-gray-500">Quiz attempts</p>
                        <h4 className="mt-2 text-base font-medium text-white">Performance summary</h4>
                      </div>
                      {savedAttempt ? (
                        <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-200">
                          Latest attempt saved
                        </div>
                      ) : null}
                    </div>

                    {isLoadingAttempts ? (
                      <p className="mt-4 text-sm text-gray-400">Loading attempts...</p>
                    ) : attemptsError ? (
                      <p className="mt-4 text-sm text-red-300">{attemptsError}</p>
                    ) : (
                      <>
                        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
                            <p className="text-[11px] uppercase text-gray-500">Attempts</p>
                            <p className="mt-2 text-2xl font-semibold text-white">{attemptSummary?.totalAttempts ?? 0}</p>
                          </div>
                          <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
                            <p className="text-[11px] uppercase text-gray-500">Best score</p>
                            <p className="mt-2 text-2xl font-semibold text-white">
                              {attemptSummary ? `${attemptSummary.bestScore ?? 0} / ${attemptSummary.totalQuestions ?? totalQuestions}` : `0 / ${totalQuestions}`}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
                            <p className="text-[11px] uppercase text-gray-500">Average score</p>
                            <p className="mt-2 text-2xl font-semibold text-white">
                              {attemptSummary ? `${Number(attemptSummary.averageScore ?? 0).toFixed(1)} / ${attemptSummary.totalQuestions ?? totalQuestions}` : `0 / ${totalQuestions}`}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
                            <p className="text-[11px] uppercase text-gray-500">Average accuracy</p>
                            <p className="mt-2 text-2xl font-semibold text-white">
                              {attemptSummary ? `${Math.round((attemptSummary.averageAccuracy ?? 0) * 100)}%` : '0%'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-3">
                          {attempts.length ? attempts.map((attempt: any, index: number) => (
                            <div key={attempt.id} className="rounded-2xl border border-white/8 bg-white/3 p-4">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="text-sm font-medium text-white">Attempt {index + 1}</p>
                                  <p className="mt-1 text-xs uppercase tracking-wider text-gray-500">
                                    Completed {new Date(attempt.completedAt).toLocaleString()}
                                  </p>
                                </div>
                                <p className="text-sm font-semibold text-emerald-300">
                                  {attempt.score} / {attempt.totalQuestions}
                                </p>
                              </div>

                              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-sm text-gray-300">
                                  Correct: {attempt.answers?.filter((answer: any) => answer.isCorrect).length || 0}
                                </div>
                                <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-sm text-gray-300">
                                  Wrong: {(attempt.answers?.length || 0) - (attempt.answers?.filter((answer: any) => answer.isCorrect).length || 0)}
                                </div>
                                <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-sm text-gray-300">
                                  Accuracy: {Math.round((attempt.score / (attempt.totalQuestions || totalQuestions || 1)) * 100)}%
                                </div>
                              </div>
                            </div>
                          )) : (
                            <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 p-5 text-sm text-gray-400">
                              No attempts recorded yet. Press Check Answers to save the first one.
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
