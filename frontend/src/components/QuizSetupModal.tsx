import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

export interface QuizSettings {
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  questionType: 'MULTIPLE_CHOICE' | 'IDENTIFICATION' | 'TRUE_FALSE'
  numQuestions: number
  quizLabel: string
  focusTopics: string
}

interface QuizSetupModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (settings: QuizSettings) => void
  defaultLabel: string
}

const DEFAULT_SETTINGS: QuizSettings = {
  difficulty: 'MEDIUM',
  questionType: 'MULTIPLE_CHOICE',
  numQuestions: 5,
  quizLabel: '',
  focusTopics: '',
}

export function QuizSetupModal({ isOpen, onClose, onGenerate, defaultLabel }: QuizSetupModalProps) {
  const [settings, setSettings] = useState<QuizSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    if (isOpen) {
      setSettings({
        ...DEFAULT_SETTINGS,
        quizLabel: defaultLabel,
      })
    }
  }, [defaultLabel, isOpen])

  const submit = () => {
    onGenerate({
      ...settings,
      quizLabel: settings.quizLabel.trim() || defaultLabel,
      focusTopics: settings.focusTopics.trim(),
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-250 flex items-center justify-center p-3 sm:p-6">
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
            className="relative flex flex-col w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-[#121212] shadow-[0_30px_100px_rgba(0,0,0,0.75)]"
          >
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3 sm:px-6 sm:py-4 shrink-0">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-base font-medium tracking-wide text-[#ededed] sm:text-xl">Configure Quiz</h2>
                  <p className="mt-0.5 text-[10px] sm:text-[11px] uppercase tracking-wider text-gray-500">Choose your quiz settings first</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white shrink-0"
              >
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>

            <div className="space-y-3.5 sm:space-y-5 px-4 py-4 sm:px-6 sm:py-5 overflow-y-auto custom-scrollbar">
              <label className="block space-y-1.5 sm:space-y-2">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-gray-500">Quiz label</span>
                <input
                  value={settings.quizLabel}
                  onChange={(e) => setSettings((current) => ({ ...current, quizLabel: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-white/25"
                  placeholder="My study quiz"
                />
              </label>

              <label className="block space-y-1.5 sm:space-y-2">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-gray-500">Focus topics (optional)</span>
                <textarea
                  value={settings.focusTopics}
                  onChange={(e) => setSettings((current) => ({ ...current, focusTopics: e.target.value }))}
                  className="min-h-16 sm:min-h-24 w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-white/25 placeholder:text-[11px] sm:placeholder:text-xs placeholder:italic"
                  placeholder="For example: emphasize quantum computing, pointers, and exam-style concepts professors usually repeat"
                />
                <p className="text-[10px] sm:text-[11px] leading-4 sm:leading-5 text-gray-500">
                  Optional. Use this to guide the quiz toward topics that matter most for your exam.
                </p>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <label className="block space-y-1.5 sm:space-y-2">
                  <span className="flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-wider text-gray-500">
                    Difficulty
                  </span>
                  <select
                    value={settings.difficulty}
                    onChange={(e) => setSettings((current) => ({ ...current, difficulty: e.target.value as QuizSettings['difficulty'] }))}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-white outline-none transition-colors focus:border-white/25"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </label>

                <label className="block space-y-1.5 sm:space-y-2">
                  <span className="flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-wider text-gray-500">
                    Question type
                  </span>
                  <select
                    value={settings.questionType}
                    onChange={(e) => setSettings((current) => ({ ...current, questionType: e.target.value as QuizSettings['questionType'] }))}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-white outline-none transition-colors focus:border-white/25"
                  >
                    <option value="MULTIPLE_CHOICE">Multiple choice</option>
                    <option value="IDENTIFICATION">Identification</option>
                    <option value="TRUE_FALSE">True / False</option>
                  </select>
                </label>
              </div>

              <label className="block space-y-1.5 sm:space-y-2">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-gray-500">Number of questions</span>
                <div className="flex items-center gap-3 sm:gap-4 rounded-lg border border-white/10 bg-white/5 px-3 py-2 sm:px-4 sm:py-3">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={settings.numQuestions}
                    onChange={(e) => setSettings((current) => ({ ...current, numQuestions: Number(e.target.value) }))}
                    className="w-full accent-indigo-400"
                  />
                  <span className="min-w-8 sm:min-w-10 text-right text-xs sm:text-sm font-semibold text-white">{settings.numQuestions}</span>
                </div>
              </label>

              <div className="flex items-center justify-end gap-2.5 sm:gap-3 pt-1 sm:pt-2">
                <button
                  onClick={onClose}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-indigo-200 transition-colors hover:bg-indigo-500/20"
                >
                  Generate Quiz
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}