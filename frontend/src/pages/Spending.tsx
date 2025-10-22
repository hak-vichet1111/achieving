import React, { useMemo, useState } from 'react'
import { useSpending } from '../contexts/SpendingContext'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Plus, Trash2, PieChart, CalendarDays } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

const categories = [
  'Food', 'Transport', 'Bills', 'Entertainment', 'Shopping', 'Health', 'Education', 'Other'
]

export default function Spending() {
  const { entries, addEntry, removeEntry } = useSpending()
  const { t } = useTranslation('spending')
  const [form, setForm] = useState({ amount: '', category: 'Food', date: new Date().toISOString().split('T')[0], note: '' })
  const [searchParams] = useSearchParams()
  const monthParam = searchParams.get('month') // YYYY-MM
  const [summaryMode, setSummaryMode] = useState<'daily' | 'weekly'>('daily')

  const filteredEntries = useMemo(() => {
    if (!monthParam) return entries
    const [year, month] = monthParam.split('-').map(Number)
    return entries.filter(e => {
      const d = new Date(e.date)
      return d.getFullYear() === year && (d.getMonth() + 1) === month
    })
  }, [entries, monthParam])

  const totalForView = useMemo(() => filteredEntries.reduce((s, e) => s + (e.amount || 0), 0), [filteredEntries])
  const byCategoryForView = useMemo(() => {
    return filteredEntries.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount
      return acc
    }, {} as Record<string, number>)
  }, [filteredEntries])

  const topCategories = useMemo(() => {
    return Object.entries(byCategoryForView)
      .sort((a,b) => b[1]-a[1])
      .slice(0,4)
  }, [byCategoryForView])

  const handleAdd = () => {
    const amountNum = Number(form.amount)
    if (!amountNum || amountNum <= 0) return
    addEntry({ amount: amountNum, category: form.category, date: form.date, note: form.note })
    setForm({ amount: '', category: form.category, date: new Date().toISOString().split('T')[0], note: '' })
  }

  const monthLabel = useMemo(() => {
    if (!monthParam) return null
    const [y,m] = monthParam.split('-').map(Number)
    const d = new Date(y, m - 1, 1)
    return `${d.toLocaleString(undefined, { month: 'long' })} ${d.getFullYear()}`
  }, [monthParam])

  // Compute daily and weekly summaries for the selected month (or current month if not provided)
  const { daysInMonth, yearForView, monthForView } = useMemo(() => {
    if (monthParam) {
      const [y, m] = monthParam.split('-').map(Number)
      const end = new Date(y, m, 0)
      return { daysInMonth: end.getDate(), yearForView: y, monthForView: m }
    } else {
      const now = new Date()
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return { daysInMonth: end.getDate(), yearForView: now.getFullYear(), monthForView: now.getMonth() + 1 }
    }
  }, [monthParam])

  const dailyTotals = useMemo(() => {
    const totals = Array(daysInMonth).fill(0)
    for (const e of filteredEntries) {
      const d = new Date(e.date)
      if (d.getFullYear() === yearForView && (d.getMonth() + 1) === monthForView) {
        const dayIndex = d.getDate() - 1
        totals[dayIndex] += e.amount
      }
    }
    const max = Math.max(1, ...totals)
    return { data: totals.map((total, i) => ({ day: i + 1, total })), max }
  }, [filteredEntries, daysInMonth, yearForView, monthForView])

  const weeklyTotals = useMemo(() => {
    const weeksCount = Math.ceil(daysInMonth / 7)
    const totals = Array(weeksCount).fill(0)
    for (const e of filteredEntries) {
      const d = new Date(e.date)
      if (d.getFullYear() === yearForView && (d.getMonth() + 1) === monthForView) {
        const weekIndex = Math.floor((d.getDate() - 1) / 7)
        totals[weekIndex] += e.amount
      }
    }
    const data = totals.map((total, i) => ({ label: `Week ${i + 1}`, total, range: `${i * 7 + 1}-${Math.min((i + 1) * 7, daysInMonth)}` }))
    const max = Math.max(1, ...totals)
    return { data, max }
  }, [filteredEntries, daysInMonth, yearForView, monthForView])

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-tint-primary text-primary">
            <Wallet className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-3xl font-bold text-primary">{monthLabel ? `Spending • ${monthLabel}` : t('title')}</h1>
            <p className="text-muted-foreground">{monthLabel ? 'Filtered by month' : t('subtitle')}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">{monthLabel ? 'Total this view' : t('spentThisMonth')}</p>
          <p className="text-2xl font-bold">${totalForView.toLocaleString()}</p>
        </div>
      </header>

      {/* Entry Form */}
      <div className="bg-card rounded-xl border p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="text-sm text-muted-foreground">{t('amount')}</label>
            <input
              type="number"
              min={0}
              value={form.amount}
              onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
              className="w-full bg-transparent border border-border rounded-md p-2 focus:border-primary"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">{t('category')}</label>
            <select
              value={form.category}
              onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
              className="w-full bg-transparent border border-border rounded-md p-2 focus:border-primary"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">{t('date')}</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
              className="w-full bg-transparent border border-border rounded-md p-2 focus:border-primary"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-muted-foreground">{t('note')}</label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm(prev => ({ ...prev, note: e.target.value }))}
              className="w-full bg-transparent border border-border rounded-md p-2 focus:border-primary"
              placeholder={t('notePlaceholder')}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={handleAdd} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90">
            <Plus size={16} />
            {t('addSpending')}
          </button>
        </div>
      </div>

      {/* Summary and Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><PieChart className="w-5 h-5" />{monthLabel ? 'Top Categories (this month)' : t('topCategories')}</h2>
          {topCategories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {topCategories.map(([cat, amt]) => (
                <div key={cat} className="rounded-lg border bg-tint-muted p-4">
                  <p className="text-sm text-muted-foreground">{cat}</p>
                  <p className="text-xl font-bold">${(amt as number).toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">{t('noSpendingYet')}</p>
          )}

          {/* Full category summary */}
          <div className="mt-6">
            <h3 className="text-md font-semibold mb-3">Category Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(byCategoryForView).map(([cat, amt]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-muted-foreground">{cat}</span>
                  <div className="flex-1 h-2 bg-muted rounded">
                    <div className="h-2 bg-primary rounded" style={{ width: `${Math.min(100, Math.round(((amt as number) / (totalForView || 1)) * 100))}%` }} />
                  </div>
                  <span className="w-20 text-right text-sm font-medium">${(amt as number).toLocaleString()}</span>
                </div>
              ))}
              {Object.keys(byCategoryForView).length === 0 && (
                <p className="text-muted-foreground">No category breakdown yet.</p>
              )}
            </div>
          </div>

          {/* Detailed Summary: Daily/Weekly breakdown */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-semibold">Detailed Summary</h3>
              <div className="inline-flex rounded-md border border-border overflow-hidden">
                <button
                  className={`px-3 py-1 text-sm ${summaryMode === 'daily' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'}`}
                  onClick={() => setSummaryMode('daily')}
                >
                  Daily
                </button>
                <button
                  className={`px-3 py-1 text-sm ${summaryMode === 'weekly' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'}`}
                  onClick={() => setSummaryMode('weekly')}
                >
                  Weekly
                </button>
              </div>
            </div>

            {summaryMode === 'daily' ? (
              <div className="grid grid-cols-7 gap-2">
                {dailyTotals.data.map(d => (
                  <div
                    key={d.day}
                    className={`p-2 rounded-md border ${d.total > 0 ? 'border-primary/40 bg-primary/5 dark:bg-gradient-to-br dark:from-primary/10 dark:to-transparent shadow-sm' : 'border-border bg-tint-muted'}`}
                  >
                    <div className="text-xs text-muted-foreground">{d.day}</div>
                    <div className="mt-2 h-16 flex items-end">
                      <div
                        className="w-full bg-gradient-to-t from-primary/20 to-primary/60 rounded"
                        style={{ height: `${Math.round((d.total / dailyTotals.max) * 100)}%` }}
                      />
                    </div>
                    <div className={`mt-1 ${d.total > 0 ? 'text-sm font-bold text-primary' : 'text-xs font-medium'}`}>${d.total.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {weeklyTotals.data.map(w => (
                  <div key={w.label} className="p-2 rounded-md border border-border bg-tint-muted">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{w.label}</span>
                      <span>Days {w.range}</span>
                    </div>
                    <div className="mt-2 h-2 bg-muted rounded">
                      <div className="h-2 bg-primary rounded" style={{ width: `${Math.round((w.total / weeklyTotals.max) * 100)}%` }} />
                    </div>
                    <div className="mt-1 text-sm font-medium">${w.total.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><CalendarDays className="w-5 h-5" />{t('recentSpending')}</h2>
          <AnimatePresence initial={false}>
            {filteredEntries.slice(0, 8).map((e) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-between py-2 border-b border-border/50"
              >
                <div>
                  <p className="font-medium">${e.amount.toLocaleString()} • {e.category}</p>
                  <p className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString()} {e.note ? `• ${e.note}` : ''}</p>
                </div>
                <button onClick={() => removeEntry(e.id)} className="p-2 rounded hover:bg-muted text-muted-foreground">
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
            {filteredEntries.length === 0 && (
              <p className="text-muted-foreground">{t('noSpendingYet')}</p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}