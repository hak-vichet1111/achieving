import React, { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { XCircle } from 'lucide-react'

export type ConfirmVariant = 'default' | 'destructive'

interface ConfirmModalProps {
  open: boolean
  title: string
  message?: React.ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: ConfirmVariant
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  const confirmClasses =
    variant === 'destructive'
      ? 'px-3 py-2 bg-destructive text-destructive-foreground rounded-md'
      : 'px-3 py-2 bg-primary text-primary-foreground rounded-md'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={onCancel}
        >
          <div className="absolute inset-0 bg-black/40" />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-sm sm:max-w-md md:max-w-lg bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-xl max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">{title}</h3>
              <button onClick={onCancel} className="p-2 rounded hover:bg-muted" aria-label={cancelText}>
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            {message && <div className="text-sm text-muted-foreground mb-4">{message}</div>}
            <div className="flex justify-end gap-2">
              <button onClick={onCancel} className="px-3 py-2 border border-border rounded-md">{cancelText}</button>
              <button onClick={onConfirm} className={confirmClasses}>{confirmText}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}