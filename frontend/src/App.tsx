import { useState, useEffect } from 'react'
import { Coffee, Target, Zap, UserCircle, LogOut } from 'lucide-react'

import { type TimerMode } from './components/SettingsModal'
import { AuthModal } from './components/AuthModal'
import { MinimizedTimer } from './components/MinimizedTimer'
import { MainTimerPage } from './pages/MainTimerPage'
import { StudyMaterialPage } from './pages/StudyMaterialPage'

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
    osc.frequency.setValueAtTime(880, startTime)
    osc.frequency.exponentialRampToValueAtTime(440, startTime + 0.5)

    gain.gain.setValueAtTime(0.5, startTime)
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(startTime)
    osc.stop(startTime + 0.5)
  }

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
      const mode = timerModes.find((m) => m.id === selectedMode)
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
      const mode = timerModes.find((m) => m.id === selectedMode)
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

  const handleStart = () => { setIsActive(true); setIsPaused(false) }
  const handlePause = () => setIsPaused(true)
  const handleResume = () => setIsPaused(false)

  const handleFinish = () => {
    setIsActive(false)
    setIsPaused(false)
    setIsWorkSession(true)
    const mode = timerModes.find((m) => m.id === selectedMode)
    if (mode) setTimeLeft(mode.timeInSeconds)
  }

  const handleReset = () => {
    const mode = timerModes.find((m) => m.id === selectedMode)
    if (mode) setTimeLeft(isWorkSession ? mode.timeInSeconds : mode.breakInSeconds)
  }

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
    } else {
      if (document.exitFullscreen) await document.exitFullscreen()
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#ededed] flex flex-col items-center justify-between py-12 px-6 font-sans overflow-hidden">
      {/* Header */}
      <header className="w-full max-w-7xl flex justify-between items-center transition-opacity duration-500 relative z-50 mb-10 opacity-80">
        <h1 className="text-xs tracking-[0.4em] font-medium text-gray-500">FOCUS TIMER</h1>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-xs text-gray-400 tracking-wider">{user.name || user.email}</span>
              <button
                onClick={() => { localStorage.removeItem('pomodoroUser'); setUser(null) }}
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

      {/* Page Content */}
      <div className="flex-1 w-full flex flex-col items-center justify-center -mt-12">
        {currentPage === 'timer' ? (
          <MainTimerPage
            timerModes={timerModes}
            selectedMode={selectedMode}
            isActive={isActive}
            isPaused={isPaused}
            isWorkSession={isWorkSession}
            timeLeft={timeLeft}
            isFullscreen={isFullscreen}
            isSettingsOpen={isSettingsOpen}
            onSetSelectedMode={setSelectedMode}
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
            onFinish={handleFinish}
            onReset={handleReset}
            onToggleFullscreen={toggleFullscreen}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onCloseSettings={() => setIsSettingsOpen(false)}
            onUpdateModes={setTimerModes}
          />
        ) : (
          <StudyMaterialPage user={user} />
        )}
      </div>

      {/* Footer Nav */}
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
            onClick={() => { if (!user) { setIsAuthOpen(true) } else { setCurrentPage('materials') } }}
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

      {/* Minimized Timer overlay on Materials page */}
      {currentPage === 'materials' && isActive && (
        <MinimizedTimer
          timerState={{ isActive, isPaused, isWorkSession, timeLeft, mode: timerModes.find((m) => m.id === selectedMode) }}
          timerActions={{ handleStart, handlePause, handleResume, handleFinish, handleReset }}
        />
      )}

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </main>
  )
}

export default App
