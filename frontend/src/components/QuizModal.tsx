import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, ChevronDown, ListChecks, X } from 'lucide-react'
import { QuizAttemptTrackerModal } from './QuizAttemptTrackerModal.tsx'

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

function shuffleArray<T>(items: T[]) {
  const shuffled = [...items]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const currentItem = shuffled[index]
    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = currentItem
  }

  return shuffled
}

function getIdentificationWordGroups(value: string) {
  const groups: string[][] = []
  let currentGroup: string[] = []

  for (const character of Array.from(value)) {
    if (/\s/.test(character)) {
      if (currentGroup.length) {
        groups.push(currentGroup)
        currentGroup = []
      }

      continue
    }

    currentGroup.push(character)
  }

  if (currentGroup.length) {
    groups.push(currentGroup)
  }

  return groups
}

function IdentificationAnswerField({
  value,
  onChange,
  correctAnswer,
  disabled,
}: {
  value: string
  onChange: (nextValue: string) => void
  correctAnswer: string
  disabled: boolean
}) {
  const wordGroups = getIdentificationWordGroups(correctAnswer)
  const typedCharacters = Array.from(value).filter((character) => !/\s/.test(character))
  let characterCursor = 0

  return (
    <div className="relative mt-3 rounded-2xl border border-white/10 bg-[#0f0f0f] px-4 py-4">
      <div className="flex min-h-12 flex-wrap items-end gap-4" aria-hidden="true">
        {wordGroups.map((group, groupIndex) => (
          <div key={`${groupIndex}-${group.length}`} className="flex items-end gap-1.5">
            {group.map((_, slotIndex) => {
              const typedCharacter = typedCharacters[characterCursor++] || ''
              const isFilled = typedCharacter.length > 0

              return (
                <div
                  key={`${groupIndex}-${slotIndex}`}
                  className={`flex h-8 w-3 items-end justify-center border-b-2 px-1 pb-1 text-sm font-semibold uppercase tracking-wide transition-colors sm:w-10 ${
                    isFilled
                      ? 'border-indigo-300/70 text-white'
                      : 'border-white/15 text-transparent'
                  }`}
                >
                  {typedCharacter || '_'}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        aria-label="Identification answer"
        autoComplete="off"
        spellCheck={false}
        className="absolute inset-0 h-full w-full cursor-text bg-transparent px-4 py-4 text-transparent caret-transparent outline-none disabled:cursor-not-allowed"
      />
    </div>
  )
}

type DisplayQuestion = {
  key: string
  question: any
  options: any[]
}

function buildDisplayQuestions(questions: any[]) {
  return shuffleArray(
    questions.map((question: any, originalIndex: number) => {
      const options = Array.isArray(question.options) ? question.options : []
      const questionType = (question.type || '').toLowerCase()
      const shouldShuffleOptions = options.length > 1 && questionType !== 'identification'

      return {
        key: question.id || `question-${originalIndex}`,
        question,
        options: shouldShuffleOptions ? shuffleArray(options) : options,
      }
    }),
  )
}

export function QuizModal({ isOpen, onClose, quiz, userId }: QuizModalProps) {
  const quizData = normalizeQuizPayload(quiz)
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [displayQuestions, setDisplayQuestions] = useState<DisplayQuestion[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [isSavingAttempt, setIsSavingAttempt] = useState(false)
  const [isAttemptsModalOpen, setIsAttemptsModalOpen] = useState(false)
  const [attemptRefreshToken, setAttemptRefreshToken] = useState(0)

  const resetQuizView = () => {
    setResponses({})
    setSubmitted(false)
    setIsSavingAttempt(false)
    setIsAttemptsModalOpen(false)
    setAttemptRefreshToken(0)
    setDisplayQuestions(buildDisplayQuestions(quizData.questions))
  }

  useEffect(() => {
    if (isOpen) {
      resetQuizView()
    }
  }, [isOpen, quiz])

  useEffect(() => {
    if (isOpen) {
      setDisplayQuestions(buildDisplayQuestions(quizData.questions))
    }
  }, [isOpen, quizData.questions])

  const totalQuestions = displayQuestions.length || quizData.questions.length

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

      if (isAttemptsModalOpen) {
        setAttemptRefreshToken((current) => current + 1)
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

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAttemptsModalOpen(true)}
                  disabled={!quizData.id}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ListChecks className="h-4 w-4" />
                  Attempts
                </button>
                <button
                  onClick={onClose}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
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
                {displayQuestions.map(({ key: questionKey, question, options }, index: number) => {
                  const normalizedOptions = options.map((option: any) => ({
                    id: option.id,
                    text: option.text ?? option.optionText ?? '',
                    is_correct: option.is_correct ?? option.isCorrect,
                  }))

                  const correctAnswer = question.correct_answer ?? question.answer

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
                      {normalizedOptions.length ? (
                        <div className="grid gap-3 md:grid-cols-2">
                          {normalizedOptions.map((option: any, optionIndex: number) => {
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
                          <IdentificationAnswerField
                            value={selectedAnswer}
                            onChange={(nextValue) => !submitted && setResponses((current) => ({ ...current, [questionKey]: nextValue }))}
                            correctAnswer={String(correctAnswer || '')}
                            disabled={submitted}
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
                    onClick={resetQuizView}
                    className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    Reset
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

            </div>
          </motion.div>

          <QuizAttemptTrackerModal
            isOpen={isAttemptsModalOpen}
            onClose={() => setIsAttemptsModalOpen(false)}
            quizId={quizData.id}
            quizTitle={quizData.title}
            userId={userId || quiz?.userId}
            totalQuestions={totalQuestions}
            refreshToken={attemptRefreshToken}
          />
        </div>
      )}
    </AnimatePresence>
  )
}
