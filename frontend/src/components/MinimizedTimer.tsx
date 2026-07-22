import { Play, Pause, RotateCcw, X, GripVertical } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatTime } from '../utils/time'
import type { TimerMode } from './SettingsModal'

export interface MinimizedTimerProps {
  timerState: {
    isActive: boolean;
    isPaused: boolean;
    isWorkSession: boolean;
    timeLeft: number;
    mode: TimerMode | undefined;
  };
  timerActions: {
    handleStart: () => void;
    handlePause: () => void;
    handleResume: () => void;
    handleFinish: () => void;
    handleReset: () => void;
  };
}

export function MinimizedTimer({ timerState, timerActions }: MinimizedTimerProps) {
  const { isActive, isPaused, isWorkSession, timeLeft, mode } = timerState;

  if (!mode) return null;

  return (
    <AnimatePresence>
      <div className="fixed top-8 left-0 right-0 pointer-events-none flex justify-center z-[9999]">
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          drag
          dragMomentum={false}
          dragElastic={0.1}
          className="pointer-events-auto flex items-center gap-3 bg-[#1a1a1a]/95 backdrop-blur-md md:backdrop-blur-2xl border border-white/10 rounded-full py-2.5 pl-3 pr-2.5 shadow-[0_20px_40px_rgba(0,0,0,0.5)] cursor-grab active:cursor-grabbing select-none will-change-transform"
        >
          {/* Drag Handle Icon */}
          <div className="text-white/30 hover:text-white/50 transition-colors cursor-grab active:cursor-grabbing">
            <GripVertical className="w-4 h-4" />
          </div>

          <div className="flex items-center gap-3 pr-1">
            <div className="relative flex items-center justify-center">
              <div className={`w-2.5 h-2.5 rounded-full ${isActive ? (isWorkSession ? 'bg-green-500' : 'bg-blue-500') : 'bg-gray-600'}`} />
              {isActive && (
                <div className={`absolute w-full h-full rounded-full opacity-50 ${isWorkSession ? 'bg-green-500' : 'bg-blue-500'}`} />
              )}
            </div>
            <div className="flex flex-col min-w-16">
              <span className="text-[8px] text-gray-500 font-bold tracking-widest uppercase leading-tight">
                {isActive ? (isWorkSession ? 'Focus' : 'Break') : 'Idle'}
              </span>
              <span className={`text-lg font-semibold tabular-nums leading-none tracking-tight ${isActive ? (isWorkSession ? 'text-white' : 'text-blue-400') : 'text-gray-400'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          <div className="w-px h-6 bg-white/10" />

          <div className="flex items-center gap-0.5">
            {!isActive ? (
              <button
                onClick={timerActions.handleStart}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                title="Start"
              >
                <Play className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <>
                <button
                  onClick={isPaused ? timerActions.handleResume : timerActions.handlePause}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                  title={isPaused ? "Resume" : "Pause"}
                >
                  {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
                </button>
                <button
                  onClick={timerActions.handleFinish}
                  className="p-2 hover:bg-red-500/20 rounded-full transition-colors text-red-400"
                  title="Stop"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={timerActions.handleReset}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
