import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

export interface QuizSettings {
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  questionType: 'MULTIPLE_CHOICE' | 'IDENTIFICATION'
  numQuestions: number
  quizLabel: string
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
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-[#121212] shadow-[0_30px_100px_rgba(0,0,0,0.75)]"
          >
            

            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-lg font-medium tracking-wide text-[#ededed] sm:text-xl">Configure Quiz</h2>
                  <p className="mt-1 text-[11px] uppercases text-gray-500">Choose your quiz settings first</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 px-5 py-5 sm:px-6">
              <label className="block space-y-2">
                <span className="text-[11px] uppercase text-gray-500">Quiz label</span>
                <input
                  value={settings.quizLabel}
                  onChange={(e) => setSettings((current) => ({ ...current, quizLabel: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-white/25"
                  placeholder="My study quiz"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="flex items-center gap-2 text-[11px] uppercase text-gray-500">
                    Difficulty
                  </span>
                  <select
                    value={settings.difficulty}
                    onChange={(e) => setSettings((current) => ({ ...current, difficulty: e.target.value as QuizSettings['difficulty'] }))}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-white/25"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="flex items-center gap-2 text-[11px] uppercase text-gray-500">
                    Question type
                  </span>
                  <select
                    value={settings.questionType}
                    onChange={(e) => setSettings((current) => ({ ...current, questionType: e.target.value as QuizSettings['questionType'] }))}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-white/25"
                  >
                    <option value="MULTIPLE_CHOICE">Multiple choice</option>
                    <option value="IDENTIFICATION">Identification</option>
                  </select>
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-[11px] uppercase text-gray-500">Number of questions</span>
                <div className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={settings.numQuestions}
                    onChange={(e) => setSettings((current) => ({ ...current, numQuestions: Number(e.target.value) }))}
                    className="w-full accent-indigo-400"
                  />
                  <span className="min-w-10 text-right text-sm font-semibold text-white">{settings.numQuestions}</span>
                </div>
              </label>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-5 py-2.5 text-sm font-semibold text-indigo-200 transition-colors hover:bg-indigo-500/20"
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