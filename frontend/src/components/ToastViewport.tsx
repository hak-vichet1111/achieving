import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { ToastItem } from '../hooks/useToast'

export default function ToastViewport({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2" aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={`px-3 py-2 rounded-md shadow-lg text-sm ${
              t.variant === 'success'
                ? 'bg-emerald-500 text-white'
                : t.variant === 'warning'
                ? 'bg-amber-500 text-white'
                : 'bg-rose-500 text-white'
            }`}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}