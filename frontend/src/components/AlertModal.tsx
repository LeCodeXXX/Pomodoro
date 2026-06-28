import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export function AlertModal({ isOpen, onClose, title, message }: AlertModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative bg-[#1a1a1a] border border-red-500/20 shadow-2xl rounded-2xl w-full max-w-sm overflow-hidden z-10"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-red-500">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">{title}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-4 text-gray-400 text-sm leading-relaxed">
                {message}
              </p>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
