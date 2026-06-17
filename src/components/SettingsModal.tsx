import { useState, useEffect, type JSX } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save } from 'lucide-react'

export interface TimerMode {
  id: string
  label: string
  time: string
  break: string
  timeInSeconds: number
  breakInSeconds: number
  icon: JSX.Element
}

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  timerModes: TimerMode[]
  onUpdateMode: (updatedModes: TimerMode[]) => void
}

export function SettingsModal({ isOpen, onClose, timerModes, onUpdateMode }: SettingsModalProps) {
  const [localModes, setLocalModes] = useState<TimerMode[]>([])

  useEffect(() => {
    if (isOpen) {
      setLocalModes(JSON.parse(JSON.stringify(timerModes.map(m => ({ ...m, icon: null })))))
    }
  }, [isOpen, timerModes])

  const handleSave = () => {
    const newModes = localModes.map((localMode, index) => {
      const workMins = Math.floor(localMode.timeInSeconds / 60)
      const breakMins = Math.floor(localMode.breakInSeconds / 60)
      return {
        ...localMode,
        icon: timerModes[index].icon, // restore icon
        time: `${workMins.toString().padStart(2, '0')}:00`,
        break: `${breakMins.toString().padStart(2, '0')}:00`,
      }
    })
    onUpdateMode(newModes)
    onClose()
  }

  const handleChange = (id: string, field: 'timeInSeconds' | 'breakInSeconds', value: string) => {
    const numValue = parseInt(value, 10)
    if (isNaN(numValue) || numValue < 1) return

    setLocalModes(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, [field]: numValue * 60 }
      }
      return m
    }))
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-[#141414] border border-white/10 p-8 rounded-[20px] shadow-2xl flex flex-col gap-8"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-medium tracking-widest text-[#ededed]">SETTINGS</h2>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-6">
              {localModes.map((mode) => (
                <div key={mode.id} className="flex flex-col gap-3 p-4 bg-white/5 rounded-lg border border-white/5">
                  <h3 className="text-xs font-semibold tracking-wider text-gray-400">{mode.label}</h3>
                  <div className="flex gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-[10px] text-gray-500 tracking-wider">WORK (MIN)</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={Math.floor(mode.timeInSeconds / 60)}
                        onChange={(e) => handleChange(mode.id, 'timeInSeconds', e.target.value)}
                        className="bg-black/50 border border-white/10 rounded-md px-4 py-3 text-white text-sm outline-none focus:border-white/30 transition-colors"
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-[10px] text-gray-500 tracking-wider">BREAK (MIN)</label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={Math.floor(mode.breakInSeconds / 60)}
                        onChange={(e) => handleChange(mode.id, 'breakInSeconds', e.target.value)}
                        className="bg-black/50 border border-white/10 rounded-md px-4 py-3 text-white text-sm outline-none focus:border-white/30 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSave}
              className="flex items-center justify-center gap-2 w-full py-4 bg-[#ededed] hover:bg-white text-black rounded-full font-semibold transition-all mt-4"
            >
              <Save className="w-4 h-4" />
              <span>SAVE CHANGES</span>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
