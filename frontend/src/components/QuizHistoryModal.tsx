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
    <div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-6 sm:px-6">
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
        className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-3xl border border-white/10 bg-[#121212] shadow-[0_30px_100px_rgba(0,0,0,0.75)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/5 px-5 py-4 sm:px-6">
          <div>
            <p className="text-[11px] uppercase text-gray-500">Saved quizzes for : </p>
            <h2 className="mt-2 text-lg font-medium text-white sm:text-xl">{materialName}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(85vh-76px)] overflow-y-auto px-5 py-5 sm:px-6 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-14 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-300" />
              <p className="text-sm text-gray-400">Loading saved quizzes...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
              {error}
            </div>
          ) : quizzes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <h3 className="mt-4 text-lg font-medium text-white">No saved quizzes yet</h3>
              <p className="mt-2 max-w-md text-sm text-gray-400">
                Generate one quiz for this document, then you can retry it from here anytime.
              </p>
              <button
                onClick={onGenerateNewQuiz}
                className="mt-6 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-5 py-2.5 text-sm font-semibold text-indigo-200 transition-colors hover:bg-indigo-500/20"
              >
                Generate quiz
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {quizzes.map((quiz) => (
                <button
                  key={quiz.id}
                  onClick={() => onSelectQuiz(quiz)}
                  className="w-full rounded-2xl border border-white/8 bg-[#171717] p-4 text-left transition-colors hover:border-white/15 hover:bg-white/5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-[14px] font-medium text-white">{quiz.title}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-400">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 className="h-3.5 w-3.5" />
                          {new Date(quiz.createdAt).toLocaleString()}
                        </span>
                        <span>{quiz.totalQuestions} questions</span>
                        <span>{quiz.difficulty}</span>
                        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase text-gray-400">
                          {quiz.questionType}
                        </span>
                      </div>
                    </div>
                    <div className=" flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300">
                      <ChevronRight className="h-4 w-4" />
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
