import { useState } from 'react'

export type ToastVariant = 'success' | 'warning' | 'deleted'
export type ToastItem = { id: string; message: string; variant: ToastVariant }

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = (message: string, variant: ToastVariant = 'success', durationMs = 3000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    setToasts(prev => [...prev, { id, message, variant }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), durationMs)
  }

  const clearToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))
  const clearAll = () => setToasts([])

  return { toasts, showToast, clearToast, clearAll }
}