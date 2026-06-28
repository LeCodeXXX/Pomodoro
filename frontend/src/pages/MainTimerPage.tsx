import { motion, AnimatePresence } from 'framer-motion'
import { Play, RotateCcw, Settings, Pause, X, Maximize, Minimize } from 'lucide-react'
import { SettingsModal, type TimerMode } from '../components/SettingsModal'
import { formatTime } from '../utils/time'

interface MainTimerPageProps {
  timerModes: TimerMode[]
  selectedMode: string
  isActive: boolean
  isPaused: boolean
  isWorkSession: boolean
  timeLeft: number
  isFullscreen: boolean
  isSettingsOpen: boolean
  onSetSelectedMode: (id: string) => void
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onFinish: () => void
  onReset: () => void
  onToggleFullscreen: () => void
  onOpenSettings: () => void
  onCloseSettings: () => void
  onUpdateModes: (modes: TimerMode[]) => void
}

export function MainTimerPage({
  timerModes,
  selectedMode,
  isActive,
  isPaused,
  isWorkSession,
  timeLeft,
  isFullscreen,
  isSettingsOpen,
  onSetSelectedMode,
  onStart,
  onPause,
  onResume,
  onFinish,
  onReset,
  onToggleFullscreen,
  onOpenSettings,
  onCloseSettings,
  onUpdateModes,
}: MainTimerPageProps) {
  return (
    <>
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`relative flex items-center justify-center w-full max-w-5xl ${isActive ? 'h-0' : 'h-[500px]'} overflow-visible`}
      >
        <AnimatePresence mode="popLayout">
          {timerModes.map((mode) => {
            const isSelected = selectedMode === mode.id
            if (isActive && !isSelected) return null

            const index = timerModes.findIndex((m) => m.id === mode.id)
            const selectedIndex = timerModes.findIndex((m) => m.id === selectedMode)
            const diff = index - selectedIndex

            return (
              <motion.div
                key={mode.id}
                layout
                initial={false}
                animate={{
                  x: isActive ? 0 : diff * 320,
                  scale: isActive ? 1.03 : isSelected ? 1.03 : 0.85,
                  opacity: isActive ? 1 : isSelected ? 1 : 0.3,
                  zIndex: isActive ? 40 : isSelected ? 10 : 1,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                onClick={() => !isActive && onSetSelectedMode(mode.id)}
                className={`border border-white/5 flex flex-col items-center shadow-2xl backdrop-blur-sm
                  ${isActive ? 'fixed inset-0 w-full h-full bg-[#0a0a0a] rounded-none cursor-default justify-center pb-32' : 'absolute bg-[#141414] rounded-[30px] w-75 h-100 cursor-pointer p-10 justify-between'}
                  ${isSelected && !isActive ? 'ring-1 ring-white/10' : ''}`}
              >
                <motion.div
                  layout
                  className={`p-3 text-sm flex items-center gap-2 ${isWorkSession ? 'text-white' : 'text-blue-400'} ${isActive ? 'mb-8 scale-150' : ''}`}
                >
                  {mode.label} {mode.icon}
                </motion.div>

                <motion.div layout className="flex flex-col items-center gap-3">
                  <span
                    className={`text-[10px] tracking-[0.2em] font-semibold ${isSelected ? 'text-[#ededed]' : 'text-gray-500'} ${isActive ? 'mb-4' : ''}`}
                  >
                    {isActive && (isWorkSession ? 'WORK' : 'BREAK')}
                  </span>

                  <div className={`flex flex-col items-center ${isSelected ? 'text-white' : 'text-gray-400 opacity-60'}`}>
                    <motion.span
                      layout
                      className={`${isActive ? 'text-9xl' : 'text-6xl'} font-light tracking-tight tabular-nums transition-all duration-500`}
                    >
                      {isActive || isSelected ? formatTime(timeLeft) : mode.time}
                    </motion.span>
                  </div>

                  <div className={`mt-2 flex items-center gap-2 bg-white/3 px-3 py-1 rounded-full ${isActive ? 'mt-8 scale-125' : ''}`}>
                    <span className="text-[11px] text-gray-200/90">
                      {isActive && !isWorkSession ? 'Next: Work' : 'Break'}
                    </span>
                    <span className="text-sm font-medium">
                      {isActive && !isWorkSession ? mode.time : mode.break}
                    </span>
                  </div>
                </motion.div>

                <motion.div
                  layout
                  className={`w-12 h-1 rounded-full ${isActive ? 'mt-12' : ''} ${isSelected ? (isWorkSession ? 'bg-white/20' : 'bg-blue-500/50') : 'bg-transparent'}`}
                />
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>

      {/* Controls */}
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`flex flex-col items-center gap-8 z-50 ${isActive ? 'fixed bottom-24 left-1/2 -translate-x-1/2' : 'relative mt-12'}`}
      >
        <div className="flex items-center gap-6">
          {!isActive ? (
            <>
              <button
                onClick={onToggleFullscreen}
                className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-white border border-white/5"
              >
                {isFullscreen ? <Minimize className="w-4 h-4 text-gray-400" /> : <Maximize className="w-4 h-4 text-gray-400" />}
              </button>
              <button
                onClick={onStart}
                className="flex items-center gap-3 px-10 py-5 bg-[#ededed] hover:bg-white text-black rounded-full font-semibold transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)]"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>START SESSION</span>
              </button>
              <button
                onClick={onOpenSettings}
                className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-white border border-white/5"
              >
                <Settings className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onFinish}
                className="p-4 bg-red-500/10 hover:bg-red-500/20 rounded-full transition-all text-red-400 border border-red-500/20"
              >
                <X className="w-5 h-5" />
              </button>
              {isPaused ? (
                <button
                  onClick={onResume}
                  className="flex items-center gap-3 px-10 py-5 bg-[#ededed] hover:bg-white text-black rounded-full font-semibold transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>RESUME</span>
                </button>
              ) : (
                <button
                  onClick={onPause}
                  className="flex items-center gap-3 px-10 py-5 bg-white/10 hover:bg-white/20 text-white rounded-full font-semibold transition-all backdrop-blur-md border border-white/10"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  <span>PAUSE</span>
                </button>
              )}
              <button
                onClick={onReset}
                className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-white border border-white/5 border-white/10"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </motion.div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={onCloseSettings}
        timerModes={timerModes}
        onUpdateMode={onUpdateModes}
      />
    </>
  )
}
