import { motion } from 'framer-motion';
import { ChevronRight, Clock3, Loader2, X } from 'lucide-react';

interface QuizHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialName: string;
  quizzes: any[];
  isLoading: boolean;
  error: string | null;
  onSelectQuiz: (quiz: any) => void;
  onGenerateNewQuiz: () => void;
}

export function QuizHistoryModal({
  isOpen,
  onClose,
  materialName,
  quizzes,
  isLoading,
  error,
  onSelectQuiz,
  onGenerateNewQuiz,
}: QuizHistoryModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-2 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 16 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        className="relative w-full max-w-3xl max-h-[92vh] sm:max-h-[85vh] overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-[#121212] shadow-[0_30px_100px_rgba(0,0,0,0.75)] will-change-transform"
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-gray-500">Saved quizzes for</p>
            <h2 className="mt-0.5 text-base sm:text-xl font-medium text-white truncate">{materialName}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white shrink-0"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>

        <div className="max-h-[calc(92vh-60px)] sm:max-h-[calc(85vh-76px)] overflow-y-auto px-3.5 py-4 sm:px-6 sm:py-5 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 sm:py-14 text-center">
              <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-indigo-300" />
              <p className="text-xs sm:text-sm text-gray-400">Loading saved quizzes...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl sm:rounded-2xl border border-red-500/20 bg-red-500/10 p-3.5 sm:p-4 text-xs sm:text-sm text-red-100">
              {error}
            </div>
          ) : quizzes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 sm:py-14 text-center">
              <h3 className="mt-2 text-base sm:text-lg font-medium text-white">No saved quizzes yet</h3>
              <p className="mt-1.5 max-w-md text-xs sm:text-sm text-gray-400 leading-relaxed px-2">
                Generate one quiz for this document, then you can retry it from here anytime.
              </p>
              <button
                onClick={onGenerateNewQuiz}
                className="mt-5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-indigo-200 transition-colors hover:bg-indigo-500/20"
              >
                Generate quiz
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 sm:space-y-3">
              {quizzes.map((quiz) => (
                <button
                  key={quiz.id}
                  onClick={() => onSelectQuiz(quiz)}
                  className="w-full rounded-xl sm:rounded-2xl border border-white/8 bg-[#171717] p-3 sm:p-4 text-left transition-colors hover:border-white/15 hover:bg-white/5 active:bg-white/10"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-xs sm:text-sm font-medium text-white">{quiz.title}</h3>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-500" />
                          {new Date(quiz.createdAt).toLocaleDateString()}
                        </span>
                        <span>{quiz.totalQuestions} questions</span>
                        <span className="capitalize">{quiz.difficulty}</span>
                        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-[11px] uppercase text-gray-400">
                          {quiz.questionType}
                        </span>
                      </div>
                    </div>
                    <div className="flex h-7 w-7 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300">
                      <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
