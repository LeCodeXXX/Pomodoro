import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, ArrowRight, X } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess: (user: any) => void
}

export function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      const body = isLogin ? { email, password } : { name, email, password }

      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Authentication failed')
      }

      onLoginSuccess(data.user)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setIsLogin(true);
    setError('');
    setEmail('');
    setPassword('');
    setName('');
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative w-full max-w-md bg-[#141414] border border-white/10 p-8 sm:p-10 rounded-[24px] shadow-2xl mx-4"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-5 right-5 p-2 text-gray-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex flex-col items-center mb-8">
              <h2 className="text-xl font-medium tracking-[0.2em] text-[#ededed] mb-1.5">
                {isLogin ? 'WELCOME BACK' : 'CREATE ACCOUNT'}
              </h2>
              <p className="text-xs text-gray-500 tracking-wider">
                {isLogin ? 'Sign in to access all features' : 'Join to unlock advanced features'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col gap-1.5 overflow-hidden"
                  >
                    <label className="text-[10px] text-gray-500 tracking-wider uppercase">Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required={!isLogin}
                        placeholder="John Doe"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm outline-none focus:border-white/25 focus:bg-white/[0.07] transition-all placeholder:text-gray-600"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-500 tracking-wider uppercase">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm outline-none focus:border-white/25 focus:bg-white/[0.07] transition-all placeholder:text-gray-600"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-500 tracking-wider uppercase">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm outline-none focus:border-white/25 focus:bg-white/[0.07] transition-all placeholder:text-gray-600"
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-xs tracking-wide text-center bg-red-500/10 py-2.5 rounded-lg border border-red-500/20"
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex items-center justify-center gap-3 w-full py-3.5 mt-2 bg-[#ededed] hover:bg-white text-black rounded-xl font-semibold transition-all overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 tracking-wider text-sm">
                  {isLoading ? 'PROCESSING...' : (isLogin ? 'SIGN IN' : 'SIGN UP')}
                </span>
                {!isLoading && <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />}
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              </button>
            </form>

            {/* Toggle login/register */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError('')
                }}
                className="text-[11px] text-gray-500 hover:text-[#ededed] tracking-wider transition-colors"
              >
                {isLogin ? "DON'T HAVE AN ACCOUNT? REGISTER" : "ALREADY HAVE AN ACCOUNT? LOGIN"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
