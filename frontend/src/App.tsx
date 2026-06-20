

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, RotateCcw, Settings, Coffee, Target, Zap, Pause, X, Maximize, Minimize, UserCircle, LogOut } from 'lucide-react'

import { SettingsModal, type TimerMode } from './components/SettingsModal'
import { AuthModal } from './components/AuthModal'
import { MinimizedTimer } from './components/MinimizedTimer'
import { StudyMaterialPage } from './pages/StudyMaterialPage'
import { formatTime } from './utils/time'

const DEFAULT_TIMER_MODES: TimerMode[] = [
  { id: 'relaxed', label: 'RELAXED', time: '45:00', break: '15:00', timeInSeconds: 45 * 60, breakInSeconds: 15 * 60, icon: <Coffee className="w-5 h-5" /> },
  { id: 'standard', label: 'STANDARD', time: '25:00', break: '05:00', timeInSeconds: 25 * 60, breakInSeconds: 5 * 60, icon: <Target className="w-5 h-5" /> },
  { id: 'focused', label: 'LOCKED IN', time: '50:00', break: '10:00', timeInSeconds: 50 * 60, breakInSeconds: 10 * 60, icon: <Zap className="w-5 h-5" /> },
]

function playTimerSound() {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext
  if (!AudioContext) return

  const ctx = new AudioContext()

  const playBeep = (startTime: number) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    // A nice pleasant chime frequency
    osc.frequency.setValueAtTime(880, startTime) // A5
    osc.frequency.exponentialRampToValueAtTime(440, startTime + 0.5) // A4

    gain.gain.setValueAtTime(0.5, startTime)
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(startTime)
    osc.stop(startTime + 0.5)
  }

  // Play a sequence of 3 beeps lasting 3 seconds
  playBeep(ctx.currentTime)
  playBeep(ctx.currentTime + 1)
  playBeep(ctx.currentTime + 2)
}

function App() {
  const [timerModes, setTimerModes] = useState<TimerMode[]>(DEFAULT_TIMER_MODES)
  const [selectedMode, setSelectedMode] = useState('standard')
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isWorkSession, setIsWorkSession] = useState(true)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState<'timer' | 'materials'>('timer')

  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('pomodoroUser')
    return saved ? JSON.parse(saved) : null
  })

  const handleLoginSuccess = (userData: any) => {
    localStorage.setItem('pomodoroUser', JSON.stringify(userData))
    setUser(userData)
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  useEffect(() => {
    if (!isActive) {
      const mode = timerModes.find(m => m.id === selectedMode)
      if (mode) {
        setTimeLeft(isWorkSession ? mode.timeInSeconds : mode.breakInSeconds)
      }
    }
  }, [selectedMode, isActive, isWorkSession, timerModes])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (isActive && !isPaused && timeLeft === 0) {
      const mode = timerModes.find(m => m.id === selectedMode)
      if (mode) {
        playTimerSound()

        if (isWorkSession) {
          setIsWorkSession(false)
          setTimeLeft(mode.breakInSeconds)
        } else {
          setIsActive(false)
          setIsWorkSession(true)
          setTimeLeft(mode.timeInSeconds)
        }
      }
    }
    return () => clearInterval(interval)
  }, [isActive, isPaused, timeLeft, selectedMode, isWorkSession])

  const handleStart = () => {
    setIsActive(true)
    setIsPaused(false)
  }

  const handlePause = () => setIsPaused(true)
  const handleResume = () => setIsPaused(false)

  const handleFinish = () => {
    setIsActive(false)
    setIsPaused(false)
    setIsWorkSession(true)
    const mode = timerModes.find(m => m.id === selectedMode)
    if (mode) setTimeLeft(mode.timeInSeconds)
  }

  const handleReset = () => {
    const mode = timerModes.find(m => m.id === selectedMode)
    if (mode) setTimeLeft(isWorkSession ? mode.timeInSeconds : mode.breakInSeconds)
  }

  const handleUpdateModes = (updatedModes: TimerMode[]) => {
    setTimerModes(updatedModes)
  }

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#ededed] flex flex-col items-center justify-between py-12 px-6 font-sans overflow-hidden">
      <header className="w-full max-w-7xl flex justify-between items-center transition-opacity duration-500 relative z-50 mb-10 opacity-80">
        <h1 className="text-xs tracking-[0.4em] font-medium text-gray-500">
          FOCUS TIMER
        </h1>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-xs text-gray-400 tracking-wider">
                {user.name || user.email}
              </span>
              <button
                onClick={() => {
                  localStorage.removeItem('pomodoroUser')
                  setUser(null)
                }}
                className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-red-400 border border-white/5"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-white border border-white/5"
              title="Sign in"
            >
              <UserCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 w-full flex flex-col items-center justify-center -mt-12">
        {currentPage === 'timer' ? (
          <>
            <motion.div layout transition={{ type: "spring", stiffness: 300, damping: 30 }} className={`relative flex items-center justify-center w-full max-w-5xl ${isActive ? 'h-0' : 'h-[500px]'} overflow-visible`}>
              <AnimatePresence mode="popLayout">
                {timerModes.map((mode) => {
              const isSelected = selectedMode === mode.id
              if (isActive && !isSelected) return null

              const index = timerModes.findIndex(m => m.id === mode.id)
              const selectedIndex = timerModes.findIndex(m => m.id === selectedMode)
              const diff = index - selectedIndex

              return (
                <motion.div
                  key={mode.id}
                  layout
                  initial={false}
                  animate={{
                    x: isActive ? 0 : diff * 320,
                    scale: isActive ? 1.03 : (isSelected ? 1.03 : 0.85),
                    opacity: isActive ? 1 : (isSelected ? 1 : 0.3),
                    zIndex: isActive ? 40 : (isSelected ? 10 : 1),
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                  onClick={() => !isActive && setSelectedMode(mode.id)}
                  className={`border border-white/5 flex flex-col items-center shadow-2xl backdrop-blur-sm
                    ${isActive ? 'fixed inset-0 w-full h-full bg-[#0a0a0a] rounded-none cursor-default justify-center pb-32' : 'absolute bg-[#141414] rounded-[30px] w-75 h-100 cursor-pointer p-10 justify-between'}
                    ${isSelected && !isActive ? 'ring-1 ring-white/10' : ''}`}
                >

                  <motion.div layout className={`p-3 text-sm flex items-center gap-2 ${isWorkSession ? 'text-white' : 'text-blue-400'} ${isActive ? 'mb-8 scale-150' : ''}`}>
                    {mode.label} {mode.icon}
                  </motion.div>

                  <motion.div layout className="flex flex-col items-center gap-3">
                    <span className={`text-[10px] tracking-[0.2em] font-semibold ${isSelected ? 'text-[#ededed]' : 'text-gray-500'} ${isActive ? 'mb-4' : ''}`}>
                      {isActive && (isWorkSession ? 'WORK' : 'BREAK')}
                    </span>

                    <div className={`flex flex-col items-center ${isSelected ? 'text-white' : 'text-gray-400 opacity-60'}`}>
                      <motion.span layout className={`${isActive ? 'text-9xl' : 'text-6xl'} font-light tracking-tight tabular-nums transition-all duration-500`}>
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

                  <motion.div layout className={`w-12 h-1 rounded-full ${isActive ? 'mt-12' : ''} ${isSelected ? (isWorkSession ? 'bg-white/20' : 'bg-blue-500/50') : 'bg-transparent'}`} />
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>

        <motion.div layout transition={{ type: "spring", stiffness: 300, damping: 30 }} className={`flex flex-col items-center gap-8 z-50 ${isActive ? 'fixed bottom-24 left-1/2 -translate-x-1/2' : 'relative mt-12'}`}>
          <div className="flex items-center gap-6">
            {!isActive ? (
              <>
                <button onClick={toggleFullscreen} className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-white border border-white/5">
                  {isFullscreen ? (
                    <Minimize className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Maximize className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                <button onClick={handleStart} className="flex items-center gap-3 px-10 py-5 bg-[#ededed] hover:bg-white text-black rounded-full font-semibold transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                  <Play className="w-4 h-4 fill-current" />
                  <span>START SESSION</span>
                </button>
                <button onClick={() => setIsSettingsOpen(true)} className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-white border border-white/5">
                  <Settings className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <button onClick={handleFinish} className="p-4 bg-red-500/10 hover:bg-red-500/20 rounded-full transition-all text-red-400 border border-red-500/20">
                  <X className="w-5 h-5" />
                </button>
                {isPaused ? (
                  <button onClick={handleResume} className="flex items-center gap-3 px-10 py-5 bg-[#ededed] hover:bg-white text-black rounded-full font-semibold transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                    <Play className="w-4 h-4 fill-current" />
                    <span>RESUME</span>
                  </button>
                ) : (
                  <button onClick={handlePause} className="flex items-center gap-3 px-10 py-5 bg-white/10 hover:bg-white/20 text-white rounded-full font-semibold transition-all backdrop-blur-md border border-white/10">
                    <Pause className="w-4 h-4 fill-current" />
                    <span>PAUSE</span>
                  </button>
                )}
                <button onClick={handleReset} className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-white border border-white/5 border-white/10">
                  <RotateCcw className="w-5 h-5" />
                </button>
              </>
                )}
              </div>
            </motion.div>
          </>
        ) : (
          <StudyMaterialPage user={user} />
        )}
      </div>

      <footer className="w-full max-w-7xl flex justify-center transition-opacity duration-500 relative z-50 opacity-80">
        <div className="flex items-center gap-6 text-[10px] tracking-widest">
          <button 
            onClick={() => setCurrentPage('timer')}
            className={`transition-colors hover:text-white ${currentPage === 'timer' ? 'text-white font-bold' : 'text-gray-500'}`}
          >
            DASHBOARD
          </button>
          <span className="text-gray-700">•</span>
          <button 
            onClick={() => {
              if (!user) {
                setIsAuthOpen(true)
              } else {
                setCurrentPage('materials')
              }
            }}
            className={`transition-colors hover:text-white ${currentPage === 'materials' ? 'text-white font-bold' : 'text-gray-500'}`}
          >
            MATERIALS
          </button>
          <span className="text-gray-700">•</span>
          <button className="text-gray-500 transition-colors hover:text-white cursor-not-allowed" title="Coming soon">
            STATISTICS
          </button>
        </div>
      </footer>

      {currentPage === 'materials' && isActive && (
        <MinimizedTimer 
          timerState={{
            isActive,
            isPaused,
            isWorkSession,
            timeLeft,
            mode: timerModes.find(m => m.id === selectedMode)
          }}
          timerActions={{
            handleStart,
            handlePause,
            handleResume,
            handleFinish,
            handleReset
          }}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        timerModes={timerModes}
        onUpdateMode={handleUpdateModes}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </main>
  )
}

export default App
