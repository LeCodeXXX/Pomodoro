import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { getAuthHeader } from '../utils/auth'
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
    <div className="relative mt-3 py-2 px-1">
      <div className="flex min-h-10 sm:min-h-12 flex-wrap items-end gap-2.5 sm:gap-4" aria-hidden="true">
        {wordGroups.map((group, groupIndex) => (
          <div key={`${groupIndex}-${group.length}`} className="flex items-end gap-1.5 sm:gap-2">
            {group.map((_, slotIndex) => {
              const typedCharacter = typedCharacters[characterCursor++] || ''
              const isFilled = typedCharacter.length > 0

              return (
                <div
                  key={`${groupIndex}-${slotIndex}`}
                  className={`flex h-7 w-3 sm:h-9 sm:w-8 items-end justify-center border-b-2 px-0.5 pb-1 text-xs sm:text-base font-semibold uppercase tracking-wide transition-colors ${
                    isFilled
                      ? 'border-indigo-400 text-white'
                      : 'border-white/20 text-transparent'
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
        className="absolute inset-0 h-full w-full cursor-text bg-transparent px-1 py-2 text-transparent caret-transparent outline-none disabled:cursor-not-allowed"
      />
    </div>
  )
}

type DisplayQuestion = {
  key: string
  question: any
  options: any[]
}

function buildDisplayQuestions(questions: any[], quizQuestionType?: string) {
  return shuffleArray(
    questions.map((question: any, originalIndex: number) => {
      const options = Array.isArray(question.options) ? question.options : []
      const questionType = (question.type || quizQuestionType || '').toLowerCase()
      const shouldShuffleOptions =
        options.length > 1 &&
        questionType !== 'identification' &&
        questionType !== 'true_false'

      let finalOptions = shouldShuffleOptions ? shuffleArray(options) : options

      if (questionType === 'true_false') {
        finalOptions = [...options].sort((a, b) => {
          const aText = (a.text ?? a.optionText ?? '').toLowerCase().trim()
          const bText = (b.text ?? b.optionText ?? '').toLowerCase().trim()
          if (aText === 'true') return -1
          if (bText === 'true') return 1
          if (aText === 'false') return 1
          if (bText === 'false') return -1
          return 0
        })
      }

      return {
        key: question.id || `question-${originalIndex}`,
        question,
        options: finalOptions,
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
    setDisplayQuestions(buildDisplayQuestions(quizData.questions, quizData.questionType))
  }

  useEffect(() => {
    if (isOpen) {
      resetQuizView()
    }
  }, [isOpen, quiz])

  useEffect(() => {
    if (isOpen) {
      setDisplayQuestions(buildDisplayQuestions(quizData.questions, quizData.questionType))
    }
  }, [isOpen, quizData.questions, quizData.questionType])

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

      const opts = question.options || []
      const selectedOption = opts.find((opt: any) => opt.id === selectedAnswer)
      if (selectedOption) {
        const isCorrect = selectedOption.is_correct ?? selectedOption.isCorrect
        if (typeof isCorrect === 'boolean') {
          return isCorrect ? runningScore + 1 : runningScore
        }
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
          ...getAuthHeader(),
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
        <div className="fixed inset-0 z-250 flex flex-col bg-[#121212]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="relative w-full h-full flex flex-col bg-[#121212] overflow-hidden"
          >

            {/* Top App Bar / Header */}
            <div className="h-14 sm:h-16 border-b border-white/10 flex items-center justify-between px-4 sm:px-8 bg-[#141414]/90 backdrop-blur-md shrink-0 z-10 max-w-6xl w-full mx-auto">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  onClick={onClose}
                  className="p-2 -ml-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
                  title="Close quiz"
                  aria-label="Close quiz"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base sm:text-lg font-medium text-[#ededed]">
                    {quizData.title}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsAttemptsModalOpen(true)}
                  disabled={!quizData.id}
                  className="inline-flex h-8 sm:h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 sm:px-4 text-xs font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ListChecks className="h-3.5 w-3.5" />
                  <span>Attempts</span>
                </button>
              </div>
            </div>

            {/* Scrollable Questions Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-8 py-6 max-w-4xl w-full mx-auto">

              {quizData.warnings?.length ? (
                <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs sm:text-sm text-amber-100">
                  <p className="font-medium text-amber-200">Generation notes</p>
                  <ul className="mt-1.5 space-y-1 text-amber-50/90">
                    {quizData.warnings.map((warning: string) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="space-y-8 sm:space-y-10 pb-8">
                {displayQuestions.map(({ key: questionKey, question, options }, index: number) => {
                  const normalizedOptions = options.map((option: any) => ({
                    id: option.id,
                    text: option.text ?? option.optionText ?? '',
                    is_correct: option.is_correct ?? option.isCorrect,
                  }))

                  const correctAnswer = question.correct_answer ?? question.answer

                  const selectedAnswer = responses[questionKey] || ''
                  const questionType = (question.type || quizData.questionType || '').toLowerCase()
                  const isCorrectAnswerSelected = () => {
                    if (questionType === 'identification') {
                      return normalizeText(selectedAnswer) === normalizeText(String(correctAnswer || ''))
                    }
                    const selectedOption = normalizedOptions.find((opt: any) => opt.id === selectedAnswer)
                    if (selectedOption) {
                      return !!selectedOption.is_correct
                    }
                    return selectedAnswer === correctAnswer
                  }
                  const answeredCorrectly = submitted ? isCorrectAnswerSelected() : false

                  return (
                  <motion.section
                    key={question.id || `${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    className="pb-8 border-b border-white/10 last:border-b-0"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-indigo-300">
                        Question {index + 1}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-medium leading-relaxed text-white mb-4">
                      {question.question}
                    </h3>

                    <div className="mt-2">
                      {normalizedOptions.length ? (
                        <div className="grid gap-2.5 sm:gap-3 md:grid-cols-2">
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
                                className={`flex cursor-pointer items-start gap-3 rounded-xl p-3.5 sm:p-4 transition-all active:scale-[0.99] ${
                                  submitted
                                    ? correct
                                      ? 'bg-emerald-500/15 text-emerald-200'
                                      : selected
                                        ? 'bg-red-500/15 text-red-200'
                                        : 'bg-white/[0.03]'
                                    : selected
                                      ? 'bg-indigo-500/20 text-white'
                                      : 'bg-white/[0.03] hover:bg-white/[0.08]'
                                }`}
                              >
                                <div
                                  className={`mt-0.5 flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                                    submitted
                                      ? correct
                                        ? 'bg-emerald-400 text-black'
                                        : selected
                                          ? 'bg-red-400 text-black'
                                          : 'bg-white/10 text-gray-400'
                                      : selected
                                        ? 'bg-indigo-400 text-black'
                                      : 'bg-white/10 text-gray-400'
                                  }`}
                                >
                                  {submitted && correct ? <CheckCircle2 className="h-3.5 w-3.5" /> : optionIndex + 1}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs sm:text-sm leading-relaxed text-gray-200">{option.text}</p>
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
                        <div className="py-2">
                          <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">Type your answer</p>
                          <IdentificationAnswerField
                            value={selectedAnswer}
                            onChange={(nextValue) => !submitted && setResponses((current) => ({ ...current, [questionKey]: nextValue }))}
                            correctAnswer={String(correctAnswer || '')}
                            disabled={submitted}
                          />
                          {submitted && (
                            <div className="mt-3 py-1">
                              <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">Result</p>
                              <p className={`mt-1 text-xs sm:text-sm font-medium ${answeredCorrectly ? 'text-emerald-300' : 'text-gray-200'}`}>
                                {answeredCorrectly
                                  ? 'Correct answer!'
                                  : `Correct answer: ${correctAnswer || 'No answer provided'}`}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {submitted && question.explanation ? (
                        <div className="mt-4 rounded-xl bg-cyan-500/10 p-3.5 sm:p-4 border-l-2 border-cyan-400">
                          <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-cyan-200">
                            <ChevronDown className="h-3.5 w-3.5" />
                            Explanation
                          </div>
                          <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-gray-200">{question.explanation}</p>
                        </div>
                      ) : null}
                    </div>
                  </motion.section>
                  )
                })}
              </div>

            </div>

            {/* Bottom Progress & Action Bar */}
            <div className="h-16 border-t border-white/10 bg-[#141414]/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between gap-4 shrink-0 z-10 max-w-6xl w-full mx-auto">
              <div>
                <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-gray-500">Progress</p>
                <p className="mt-0.5 text-xs sm:text-sm font-medium text-gray-200">
                  {Object.keys(responses).length} / {totalQuestions} answered
                </p>
                {submitted ? (
                  <p className="mt-0.5 text-xs sm:text-sm font-medium text-emerald-300">
                    Score: {score} / {totalQuestions}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={resetQuizView}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 sm:px-5 sm:py-2 text-xs sm:text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Reset
                </button>
                <button
                  onClick={submitQuiz}
                  disabled={isSavingAttempt}
                  className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 sm:px-5 sm:py-2 text-xs sm:text-sm font-semibold text-indigo-200 transition-colors hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingAttempt ? 'Saving...' : 'Check Answers'}
                </button>
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
