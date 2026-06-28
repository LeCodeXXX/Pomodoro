import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  isLoading: boolean;
  message?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({ isLoading, message = 'Loading...', fullScreen = false }: LoadingScreenProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`${
            fullScreen ? 'fixed inset-0 z-50' : 'absolute inset-0 z-40'
          } flex items-center justify-center bg-black/60 backdrop-blur-sm`}
        >
          <div className="flex flex-col items-center gap-4 bg-[#1a1a1a] p-8 rounded-2xl border border-white/10 shadow-2xl">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            {message && <p className="text-white font-medium">{message}</p>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
