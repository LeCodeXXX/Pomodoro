import { Play, Pause, RotateCcw, X } from 'lucide-react'
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
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[#1a1a1a]/90 backdrop-blur-2xl border border-white/10 rounded-full p-2.5 shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
      >
        <div className="flex items-center gap-4 pl-4 pr-2">
          <div className="relative flex items-center justify-center">
            <div className={`w-3 h-3 rounded-full ${isActive ? (isWorkSession ? 'bg-green-500' : 'bg-blue-500') : 'bg-gray-600'}`} />
            {isActive && (
              <div className={`absolute w-full h-full rounded-full animate-ping opacity-50 ${isWorkSession ? 'bg-green-500' : 'bg-blue-500'}`} />
            )}
          </div>
          <div className="flex flex-col min-w-[70px]">
            <span className="text-[9px] text-gray-500 font-bold tracking-widest uppercase">
              {isActive ? (isWorkSession ? 'Focus' : 'Break') : 'Idle'}
            </span>
            <span className={`text-xl font-medium tabular-nums leading-none tracking-tight ${isActive ? (isWorkSession ? 'text-white' : 'text-blue-400') : 'text-gray-400'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        <div className="w-px h-8 bg-white/10" />

        <div className="flex items-center gap-1 pr-2">
          {!isActive ? (
            <button
              onClick={timerActions.handleStart}
              className="p-2.5 hover:bg-white/10 rounded-full transition-colors text-white"
              title="Start"
            >
              <Play className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <>
              <button
                onClick={isPaused ? timerActions.handleResume : timerActions.handlePause}
                className="p-2.5 hover:bg-white/10 rounded-full transition-colors text-white"
                title={isPaused ? "Resume" : "Pause"}
              >
                {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
              </button>
              <button
                onClick={timerActions.handleFinish}
                className="p-2.5 hover:bg-red-500/20 rounded-full transition-colors text-red-400"
                title="Stop"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={timerActions.handleReset}
                className="p-2.5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
