import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, XCircle } from 'lucide-react'
import { useSpending } from '../contexts/SpendingContext'
import { useTranslation } from 'react-i18next'
import ConfirmModal from './ConfirmModal'
import { useParams } from 'react-router-dom'

export default function QuickAdd() {
  const {
    entries,
    addEntry,
    categories,
    totalPlannedForMonth,
    byCategoryPlannedForMonth,
    months,
    addMonth,
  } = useSpending()
  const { t } = useTranslation('spending')
  const { monthId } = useParams()

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ amount: '', category: (categories[0] || 'Food'), note: '' })
  const [toasts, setToasts] = useState<Array<{ id: string, message: string, variant: 'success' | 'warning' }>>([])
  const [pendingAdd, setPendingAdd] = useState<null | { amount: number; category: string; note: string; dateStr: string; monthKey: string }>(null)

  // Popover on desktop, bottom sheet on mobile
  const [isPopover, setIsPopover] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)')
    const update = () => setIsPopover(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  // Close popover when clicking outside
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!open || !isPopover) return
      const target = e.target as Node
      if (panelRef.current && panelRef.current.contains(target)) return
      if (buttonRef.current && buttonRef.current.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open, isPopover])

  const showToast = (message: string, variant: 'success' | 'warning' = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    setToasts(prev => [...prev, { id, message, variant }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }

  // Date choice: Today / Yesterday / Tomorrow
  const [dateChoice, setDateChoice] = useState<'today' | 'yesterday' | 'tomorrow'>('today')

  const isValidAmount = () => {
    const n = Number(form.amount)
    return Number.isFinite(n) && n > 0
  }

  const handleAdd = () => {
    const amountNum = Number(form.amount)
    if (!isValidAmount()) {
      showToast(t('toastInvalidAmount'), 'warning')
      return
    }

    // Compute date from choice
    const base = new Date()
    if (dateChoice === 'yesterday') base.setDate(base.getDate() - 1)
    if (dateChoice === 'tomorrow') base.setDate(base.getDate() + 1)
    const dateStr = base.toISOString().split('T')[0]

    const monthKey = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}`
    if (monthId && monthId !== monthKey) {
      showToast(t('toastWrongMonth', { view: monthId, entry: monthKey }), 'warning')
      return
    }

    // Stage confirm
    setPendingAdd({ amount: amountNum, category: form.category, note: form.note, dateStr, monthKey })
  }

  return (
    <>
      {/* Floating Quick Add button - visible on all screen sizes */}
      <button
        ref={buttonRef}
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-16 sm:bottom-8 right-4 sm:right-8 inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary text-primary-foreground shadow-lg z-40"
        aria-expanded={open}
        aria-controls="quickadd-panel"
        aria-label={t('quickAddTitle')}
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Dropdown popover on desktop */}
      <AnimatePresence>
        {open && isPopover && (
          <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
            <motion.div
              id="quickadd-panel"
              ref={panelRef}
              className="absolute bottom-28 right-4 sm:right-8 w-[22rem] bg-card border rounded-xl p-4 shadow-xl"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              role="dialog"
              aria-label={t('quickAddTitle')}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">{t('quickAddTitle')}</h3>
                <button onClick={() => setOpen(false)} className="p-2 rounded hover:bg-muted">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  className="w-full bg-transparent border border-border rounded-md p-3 text-lg"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder={t('amount')}
                  value={form.amount}
                  onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
                />
                {/* Date quick-pick */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">{t('date')}</p>
                  <div className="flex gap-2">
                    {(['yesterday', 'today', 'tomorrow'] as const).map(opt => (
                      <button
                        key={opt}
                        className={`px-3 py-1 rounded-full border text-sm ${dateChoice === opt ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border'}`}
                        onClick={() => setDateChoice(opt)}
                      >
                        {opt === 'today' ? t('today') : opt === 'yesterday' ? t('yesterday') : t('tomorrow')}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">{t('category')}</p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(c => (
                      <button
                        key={c}
                        className={`px-3 py-1 rounded-full border text-sm whitespace-nowrap ${form.category === c ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border'}`}
                        onClick={() => setForm(prev => ({ ...prev, category: c }))}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  className="w-full bg-transparent border border-border rounded-md p-2"
                  placeholder={t('noteOptional')}
                  value={form.note}
                  onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
                />
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => setOpen(false)} className="flex-1 border border-border rounded-md py-2">{t('cancel')}</button>
                <button
                  onClick={handleAdd}
                  className={`flex-1 rounded-md py-2 ${isValidAmount() ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
                  disabled={!isValidAmount()}
                >
                  {t('add')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom sheet on mobile */}
      <AnimatePresence>
        {open && !isPopover && (
          <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
            <motion.div
              id="quickadd-panel"
              className="absolute inset-x-0 bottom-0 bg-card border-t rounded-t-2xl p-4 shadow-2xl"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              role="dialog"
              aria-label={t('quickAddTitle')}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">{t('quickAddTitle')}</h3>
                <button onClick={() => setOpen(false)} className="p-2 rounded hover:bg-muted">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  className="w-full bg-transparent border border-border rounded-md p-3 text-lg"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder={t('amount')}
                  value={form.amount}
                  onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
                />
                {/* Date quick-pick */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">{t('date')}</p>
                  <div className="flex gap-2">
                    {(['yesterday', 'today', 'tomorrow'] as const).map(opt => (
                      <button
                        key={opt}
                        className={`px-3 py-1 rounded-full border text-sm ${dateChoice === opt ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border'}`}
                        onClick={() => setDateChoice(opt)}
                      >
                        {opt === 'today' ? t('today') : opt === 'yesterday' ? t('yesterday') : t('tomorrow')}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">{t('category')}</p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(c => (
                      <button
                        key={c}
                        className={`px-3 py-1 rounded-full border text-sm whitespace-nowrap ${form.category === c ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border'}`}
                        onClick={() => setForm(prev => ({ ...prev, category: c }))}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  className="w-full bg-transparent border border-border rounded-md p-2"
                  placeholder={t('noteOptional')}
                  value={form.note}
                  onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
                />
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => setOpen(false)} className="flex-1 border border-border rounded-md py-2">{t('cancel')}</button>
                <button
                  onClick={handleAdd}
                  className={`flex-1 rounded-md py-2 ${isValidAmount() ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
                  disabled={!isValidAmount()}
                >
                  {t('add')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Confirm Add modal */}
      <ConfirmModal
        open={!!pendingAdd}
        title={t('confirmAddTitle')}
        message={pendingAdd ? t('confirmAddEntry', { amount: pendingAdd.amount.toLocaleString(), category: pendingAdd.category, date: pendingAdd.dateStr }) : ''}
        confirmText={t('add')}
        cancelText={t('cancel')}
        onCancel={() => setPendingAdd(null)}
        onConfirm={() => {
          if (!pendingAdd) return
          const { amount, category, note, dateStr, monthKey } = pendingAdd
          if (!months.includes(monthKey)) {
            addMonth(monthKey)
            showToast(t('monthAutoCreated', { month: monthKey }), 'success')
          }
          addEntry({ amount, category, date: dateStr, note })
          const plannedTotal = totalPlannedForMonth(monthKey)
          const actualTotal = entries.reduce((sum, e) => {
            const d = new Date(e.date)
            const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            return sum + (mk === monthKey ? e.amount : 0)
          }, 0)
          const plannedByCatForMonth = byCategoryPlannedForMonth(monthKey)
          const plannedCat = Number(plannedByCatForMonth[category] || 0)
          const actualCat = entries.reduce((sum, e) => {
            const d = new Date(e.date)
            const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            return sum + (mk === monthKey && e.category === category ? e.amount : 0)
          }, 0)
          const willExceedTotal = plannedTotal > 0 && actualTotal + amount > plannedTotal
          const willExceedCat = plannedCat > 0 && actualCat + amount > plannedCat
          if (willExceedCat) {
            showToast(t('toastCatExceedsPlan', { category, month: monthKey }), 'warning')
          } else if (willExceedTotal) {
            showToast(t('toastTotalExceedsPlan', { month: monthKey }), 'warning')
          } else {
            showToast(t('toastAddedSpending', { category, amount: amount.toLocaleString() }), 'success')
          }
          setForm({ amount: '', category, note: '' })
          setPendingAdd(null)
          setOpen(false)
        }}
      />

      {/* Toasts (top-right) */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map(ti => (
            <motion.div key={ti.id} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className={`px-3 py-2 rounded-md shadow-lg text-sm ${ti.variant === 'success' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
              {ti.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  )
}