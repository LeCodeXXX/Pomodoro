import { useState, useEffect, useCallback, useRef } from 'react'
import { Coffee, Target, Zap, UserCircle, LogOut } from 'lucide-react'
import { getAuthHeader, storeToken, clearToken } from './utils/auth'

import { type TimerMode } from './components/SettingsModal'
import { AuthModal } from './components/AuthModal'
import { MinimizedTimer } from './components/MinimizedTimer'
import { MainTimerPage } from './pages/MainTimerPage'
import { StudyMaterialPage } from './pages/StudyMaterialPage'
import { StatsPage } from './pages/StatsPage'

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
  const [currentPage, setCurrentPage] = useState<'timer' | 'materials' | 'stats'>('timer')
  const [stats, setStats] = useState<any>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  // Ref to hold the chart refetch function (set by StatsPage via prop)
  const refetchChartsRef = useRef<(() => void) | null>(null)

  // Track accumulated break duration for the current break period so we can
  // store it together with the focus session that preceded it.
  const breakDurationRef = useRef(0)


  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('pomodoroUser')
    const token = localStorage.getItem('pomodoroToken')
    // If user is stored but token is missing (pre-JWT migration), clear stale session
    if (saved && !token) {
      localStorage.removeItem('pomodoroUser')
      return null
    }
    return saved ? JSON.parse(saved) : null
  })


  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const res = await fetch('http://localhost:3000/api/users/stats', {
        headers: { ...getAuthHeader() },
      })
      if (res.ok) setStats(await res.json())
    } catch (e) {
      console.error('Error fetching stats:', e)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const handleLoginSuccess = (userData: any, token: string) => {
    localStorage.setItem('pomodoroUser', JSON.stringify(userData))
    storeToken(token)
    setUser(userData)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const userParam = params.get('user')

    if (token && userParam) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userParam))
        handleLoginSuccess(parsedUser, token)

        const nextUrl = new URL(window.location.href)
        nextUrl.searchParams.delete('token')
        nextUrl.searchParams.delete('user')
        window.history.replaceState({}, document.title, `${nextUrl.pathname}${nextUrl.search}`)
      } catch (error) {
        console.error('Failed to parse OAuth login response:', error)
      }
    }
  }, [])

  useEffect(() => {
    if (user) {
      setTimerModes([
        {
          id: 'relaxed',
          label: 'RELAXED',
          time: `${Math.floor((user.relaxedWorkTime || 45 * 60) / 60).toString().padStart(2, '0')}:00`,
          break: `${Math.floor((user.relaxedBreakTime || 15 * 60) / 60).toString().padStart(2, '0')}:00`,
          timeInSeconds: user.relaxedWorkTime || 45 * 60,
          breakInSeconds: user.relaxedBreakTime || 15 * 60,
          icon: <Coffee className="w-5 h-5" />
        },
        {
          id: 'standard',
          label: 'STANDARD',
          time: `${Math.floor((user.standardWorkTime || 25 * 60) / 60).toString().padStart(2, '0')}:00`,
          break: `${Math.floor((user.standardBreakTime || 5 * 60) / 60).toString().padStart(2, '0')}:00`,
          timeInSeconds: user.standardWorkTime || 25 * 60,
          breakInSeconds: user.standardBreakTime || 5 * 60,
          icon: <Target className="w-5 h-5" />
        },
        {
          id: 'focused',
          label: 'LOCKED IN',
          time: `${Math.floor((user.focusedWorkTime || 50 * 60) / 60).toString().padStart(2, '0')}:00`,
          break: `${Math.floor((user.focusedBreakTime || 10 * 60) / 60).toString().padStart(2, '0')}:00`,
          timeInSeconds: user.focusedWorkTime || 50 * 60,
          breakInSeconds: user.focusedBreakTime || 10 * 60,
          icon: <Zap className="w-5 h-5" />
        },
      ])
    } else {
      setTimerModes(DEFAULT_TIMER_MODES)
    }
    if (user) fetchStats()
  }, [user, fetchStats])

  const handleUpdateModes = async (newModes: TimerMode[]) => {
    setTimerModes(newModes)

    if (user) {
      const relaxed = newModes.find((m) => m.id === 'relaxed')
      const standard = newModes.find((m) => m.id === 'standard')
      const focused = newModes.find((m) => m.id === 'focused')

      const body = {
        relaxedWorkTime: relaxed?.timeInSeconds || 45 * 60,
        relaxedBreakTime: relaxed?.breakInSeconds || 15 * 60,
        standardWorkTime: standard?.timeInSeconds || 25 * 60,
        standardBreakTime: standard?.breakInSeconds || 5 * 60,
        focusedWorkTime: focused?.timeInSeconds || 50 * 60,
        focusedBreakTime: focused?.breakInSeconds || 10 * 60,
      }

      try {
        const res = await fetch('http://localhost:3000/api/users/timer-settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          throw new Error('Failed to update timer settings')
        }

        const updatedSettings = await res.json()
        const updatedUser = {
          ...user,
          ...updatedSettings,
        }
        localStorage.setItem('pomodoroUser', JSON.stringify(updatedUser))
        setUser(updatedUser)
      } catch (error) {
        console.error('Error saving timer settings:', error)
      }
    }
  }

  /**
   * Record a completed focus session to the backend.
   * breakDuration is the duration of the break that *followed* this focus session.
   * When called at focus-end (before the break), breakDuration is 0 and will be
   * updated once the break completes via the session's breakDuration field.
   *
   * Since we record the session immediately when focus ends, we pass breakDuration
   * as 0 at focus completion and then update it after the break finishes. However,
   * the spec requires per-session break storage, so we instead store the full
   * focus session record AFTER the break ends (so we know the actual break duration).
   *
   * Implementation: we delay the API call until the break ends.
   */
  const pendingFocusDurationRef = useRef<number>(0)

  const flushCompletedSession = useCallback(async (focusDuration: number, breakDuration: number) => {
    if (!user) return
    try {
      await fetch('http://localhost:3000/api/users/pomodoro-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ duration: focusDuration, completed: true, breakDuration }),
      })
      // Refresh stats and charts after recording
      fetchStats()
      refetchChartsRef.current?.()
    } catch (error) {
      console.error('Error recording session:', error)
    }
  }, [user, fetchStats])

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

  // ─── Core timer tick + auto-cycle ───────────────────────────────────────────
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>

    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)

        // Accumulate break time while in a break session
        if (!isWorkSession) {
          breakDurationRef.current += 1
        }
      }, 1000)
    } else if (isActive && !isPaused && timeLeft === 0) {
      const mode = timerModes.find((m) => m.id === selectedMode)
      if (mode) {
        playTimerSound()

        if (isWorkSession) {
          // ── Focus session just completed ──
          // Store focus duration; we'll flush to DB after the break finishes
          pendingFocusDurationRef.current = mode.timeInSeconds
          breakDurationRef.current = 0

          // Auto-transition to break
          setIsWorkSession(false)
          setTimeLeft(mode.breakInSeconds)
        } else {
          // ── Break just completed ──
          // Now we have both the focus duration and the full break duration → record
          flushCompletedSession(pendingFocusDurationRef.current, mode.breakInSeconds)
          pendingFocusDurationRef.current = 0
          breakDurationRef.current = 0

          // Auto-transition back to a new focus session (cycle continues)
          setIsWorkSession(true)
          setTimeLeft(mode.timeInSeconds)
          // isActive stays true — the cycle continues automatically
        }
      }
    }

    return () => clearInterval(interval)
  }, [isActive, isPaused, timeLeft, selectedMode, isWorkSession, flushCompletedSession])

  const handleStart = () => {
    pendingFocusDurationRef.current = 0
    breakDurationRef.current = 0
    setIsActive(true)
    setIsPaused(false)
  }

  const handlePause = () => setIsPaused(true)
  const handleResume = () => setIsPaused(false)

  const handleFinish = () => {
    // Per spec: incomplete/cancelled sessions are NOT recorded.
    // We simply discard any pending focus session and reset state.
    pendingFocusDurationRef.current = 0
    breakDurationRef.current = 0

    setIsActive(false)
    setIsPaused(false)
    setIsWorkSession(true)

    const mode = timerModes.find((m) => m.id === selectedMode)
    if (mode) {
      setTimeLeft(mode.timeInSeconds)
    }
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
    <main className="min-h-screen bg-[#0a0a0a] text-[#ededed] flex flex-col items-center justify-between py-6 md:py-12 px-4 md:px-6 font-sans overflow-hidden">
      {/* Header */}
      <header className="w-full max-w-7xl flex justify-between items-center transition-opacity duration-500 relative z-50 mb-6 md:mb-10 opacity-80">
        <h1 className="text-xs tracking-[0.4em] font-medium text-gray-500">FOCUS TIMER</h1>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-xs text-gray-400 tracking-wider">{user.name || user.email}</span>
              <button
                onClick={() => { localStorage.removeItem('pomodoroUser'); clearToken(); setUser(null) }}
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
      <div className="flex-1 w-full flex flex-col items-center justify-center -mt-4 md:-mt-12">
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
            onUpdateModes={handleUpdateModes}
          />
        ) : currentPage === 'materials' ? (
          <StudyMaterialPage user={user} />
        ) : (
          <StatsPage
            user={user}
            stats={stats}
            statsLoading={statsLoading}
            onRegisterRefetch={(fn) => { refetchChartsRef.current = fn }}
          />
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
          <button
            onClick={() => { if (!user) { setIsAuthOpen(true) } else { setCurrentPage('stats') } }}
            className={`transition-colors hover:text-white ${currentPage === 'stats' ? 'text-white font-bold' : 'text-gray-500'}`}
          >
            STATISTICS
          </button>
        </div>
      </footer>

      {/* Minimized Timer overlay on other pages */}
      {currentPage !== 'timer' && isActive && (
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
