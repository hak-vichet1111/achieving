import React, { useMemo, useState } from 'react'
import { useSpending } from '../contexts/SpendingContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, ArrowRight, Plus, CalendarDays, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

function monthLabelFromKey(key: string) {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1, 1)
  return `${d.toLocaleString(undefined, { month: 'long' })} ${d.getFullYear()}`
}

function formatMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export default function SpendingSummary() {
  const { months, addMonth, removeMonth, totalActualForMonth, totalEarningsForMonth, totalPlannedForMonth } = useSpending()
  const { t } = useTranslation('spending')

  const monthsList = useMemo(() => {
    return [...months]
      .sort((a, b) => b.localeCompare(a))
      .map((key) => ({ key, label: monthLabelFromKey(key) }))
  }, [months])

  const now = new Date()
  const defaultMonth = formatMonthKey(now)
  const currentMonthKey = formatMonthKey(now)
  const [adding, setAdding] = useState(false)
  const [newMonth, setNewMonth] = useState(defaultMonth)
  const [status, setStatus] = useState<'idle' | 'error' | 'success'>('idle')
  const [message, setMessage] = useState('')
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null)

  const parts = useMemo(() => {
    const [yStr, mStr] = newMonth.split('-')
    return { y: Number(yStr), m: Number(mStr) }
  }, [newMonth])

  const updateByParts = (y: number, m: number) => {
    let year = y
    let month = m
    if (month < 1) { month = 12; year -= 1 }
    if (month > 12) { month = 1; year += 1 }
    setNewMonth(`${year}-${String(month).padStart(2, '0')}`)
  }

  const incMonth = (delta: number) => updateByParts(parts.y, parts.m + delta)
  const incYear = (delta: number) => updateByParts(parts.y + delta, parts.m)

  const handleAddMonth = () => {
    if (!newMonth) return
    if (months.includes(newMonth)) {
      setStatus('error')
      setMessage('Month already exists')
      return
    }
    setStatus('idle')
    addMonth(newMonth)
    setStatus('success')
    setMessage('Month added')
    setTimeout(() => {
      setAdding(false)
      setStatus('idle')
      setMessage('')
      setNewMonth(defaultMonth)
    }, 900)
  }

  const handleCancel = () => {
    setAdding(false)
    setStatus('idle')
    setMessage('')
    setNewMonth(defaultMonth)
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (e) => {
    if (e.key === 'Enter') handleAddMonth()
    if (e.key === 'Escape') handleCancel()
  }

  return (
    <div className="space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-tint-primary text-primary">
            <Wallet className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-3xl font-bold text-primary">{t('overviewTitle')}</h1>
            <p className="text-muted-foreground">{t('overviewSubtitle')}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Add Month Card - simplified steppers */}
        <motion.div
          key="add-month-card"
          whileHover={{ y: -4 }}
          className="bg-card rounded-xl p-4 border border-border shadow-sm"
        >
          <AnimatePresence initial={false}>
            {!adding ? (
              <motion.button
                type="button"
                onClick={() => setAdding(true)}
                className="w-full h-full min-h-[160px] flex flex-col items-center justify-center gap-2 text-primary"
                aria-label="Add month"
                title="Create new month"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Plus className="w-6 h-6" />
                </span>
                <span className="font-medium">Add month</span>
              </motion.button>
            ) : (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                <div className="flex items-center gap-3">
                  {/* <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <CalendarDays className="w-5 h-5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">Create new month</p>
                    <p className="text-xs text-muted-foreground">Use the steppers to choose</p>
                  </div> */}
                </div>

                {/* Selected label */}
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Selected</p>
                  <p className="text-lg font-semibold">{monthLabelFromKey(newMonth)}</p>
                </div>

                {/* Month stepper */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">Month</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => incMonth(-1)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="min-w-[72px] text-center text-sm font-medium">
                      {new Date(parts.y, parts.m - 1).toLocaleString(undefined, { month: 'short' })}
                    </span>
                    <button
                      type="button"
                      onClick={() => incMonth(1)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Year stepper */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">Year</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => incYear(-1)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="min-w-[72px] text-center text-sm font-medium">{parts.y}</span>
                    <button
                      type="button"
                      onClick={() => incYear(1)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-3 py-2 rounded-md border border-border text-sm hover:bg-muted w-full"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddMonth}
                    onKeyDown={handleKeyDown}
                    className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 w-full"
                  >
                    Add
                  </button>
                </div>

                {/* Inline feedback */}
                {status !== 'idle' && (
                  <div className={`flex items-center gap-2 text-sm ${status === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {status === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    <span>{message}</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Existing Month Cards from API */}
        {monthsList.map((m) => {
          const earnings = totalEarningsForMonth(m.key)
          const planned = totalPlannedForMonth(m.key)
          const actual = totalActualForMonth(m.key)
          const max = Math.max(1, earnings, planned, actual)
          const variance = earnings - actual
          const underBudget = variance >= 0
          const isCurrent = m.key === currentMonthKey
          const isConfirm = confirmDeleteKey === m.key
          return (
            <motion.div key={m.key} whileHover={{ y: -4 }} className={`bg-card rounded-xl p-4 border ${isCurrent ? 'border-primary' : 'border-border'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{m.label}</p>
                  <p className="text-xl font-bold">${actual.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/spend/${m.key}`} className="text-sm text-primary inline-flex items-center gap-1 hover:underline">
                    {t('viewDetails')} <ArrowRight size={14} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteKey(m.key)}
                    aria-label={t('delete')}
                    title="Delete month"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                  </button>
                </div>
              </div>

              {isConfirm && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Delete this month?</span>
                  <button
                    type="button"
                    onClick={() => { removeMonth(m.key); setConfirmDeleteKey(null) }}
                    className="px-2 py-1 rounded-md bg-rose-600 text-white text-xs hover:bg-rose-700"
                  >
                    {t('delete')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteKey(null)}
                    className="px-2 py-1 rounded-md border border-border text-xs hover:bg-muted"
                  >
                    {t('cancel')}
                  </button>
                </div>
              )}

              <div className="mt-3 space-y-2">
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t('earningsSummary')}</span>
                    <span>${earnings.toLocaleString()}</span>
                  </div>
                  <div className="mt-1 h-2 bg-muted rounded">
                    <div className="h-2 bg-emerald-500 rounded" style={{ width: `${Math.round((earnings / max) * 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t('plannedTitle')}</span>
                    <span>${planned.toLocaleString()}</span>
                  </div>
                  <div className="mt-1 h-2 bg-muted rounded">
                    <div className="h-2 bg-amber-500 rounded" style={{ width: `${Math.round((planned / max) * 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t('actualTitle')}</span>
                    <span>${actual.toLocaleString()}</span>
                  </div>
                  <div className="mt-1 h-2 bg-muted rounded">
                    <div className="h-2 bg-primary rounded" style={{ width: `${Math.round((actual / max) * 100)}%` }} />
                  </div>
                </div>
              </div>

              <div className={`mt-3 rounded-md border p-2 text-sm ${underBudget ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                {underBudget ? (
                  <span>{t('underBy', { amount: variance.toLocaleString() })}</span>
                ) : (
                  <span>{t('overBy', { amount: Math.abs(variance).toLocaleString() })}</span>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}