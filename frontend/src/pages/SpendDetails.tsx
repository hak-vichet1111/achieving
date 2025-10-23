import React, { useMemo, useState } from 'react'
import { useSpending } from '../contexts/SpendingContext'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Plus, Trash2, PieChart, CalendarDays, DollarSign, ClipboardList, HandCoins, CheckCircle, AlertTriangle, XCircle, ArrowLeft } from 'lucide-react'
import { useParams } from 'react-router-dom'


function monthKeyFromDate(y: number, m: number) {
  return `${y}-${String(m).padStart(2, '0')}`
}

export default function Spending() {
  const {
    entries, addEntry, removeEntry,
    earnings, addEarning, removeEarning,
    plansByMonth, setPlanForMonthCategory, removePlanForMonthCategory,
    borrows, addBorrow, updateBorrowRepayment, removeBorrow,
    totalEarningsForMonth, totalPlannedForMonth, byCategoryPlannedForMonth,
    categories, addCategory, removeCategory,
  } = useSpending()
  const { t } = useTranslation('spending')
  const [form, setForm] = useState({ amount: '', category: (categories[0] || 'Food'), date: new Date().toISOString().split('T')[0], note: '' })
  const { monthId } = useParams()
  const monthParam = monthId || null // YYYY-MM
  const [summaryMode, setSummaryMode] = useState<'daily' | 'weekly'>('daily')

  // Config forms
  const [earningForm, setEarningForm] = useState({ source: '', amount: '', date: new Date().toISOString().split('T')[0] })
  const [planForm, setPlanForm] = useState({ category: (categories[0] || 'Food'), amount: '' })
  const [borrowForm, setBorrowForm] = useState({ from: '', amount: '', date: new Date().toISOString().split('T')[0] })
  const [newCategory, setNewCategory] = useState('')
  const [pendingDelete, setPendingDelete] = useState<null | { type: 'earning' | 'plan' | 'borrow' | 'category', id?: string, cat?: string }>(null)
  const [toasts, setToasts] = useState<Array<{ id: string, message: string, variant: 'success' | 'warning' | 'deleted' }>>([])
  // Quick Add handled globally via LayoutSidebar
  // Local Quick Add form removed; using global QuickAdd component

  const showToast = (message: string, variant: 'success' | 'warning' | 'deleted' = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2,6)}`
    setToasts(prev => [...prev, { id, message, variant }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }

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
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
  }, [byCategoryForView])

  const handleAdd = () => {
    const amountNum = Number(form.amount)
    if (!amountNum || amountNum <= 0) { showToast('Please enter a valid amount', 'warning'); return }
    const d = new Date(form.date)
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const plannedTotal = totalPlannedForMonth(monthKey)
    const actualTotal = entries.reduce((sum, e) => {
      const ed = new Date(e.date)
      const mk = `${ed.getFullYear()}-${String(ed.getMonth() + 1).padStart(2, '0')}`
      return sum + (mk === monthKey ? e.amount : 0)
    }, 0)
    const willExceedTotal = plannedTotal > 0 && actualTotal + amountNum > plannedTotal
    const plannedByCatForMonth = byCategoryPlannedForMonth(monthKey)
    const plannedCat = Number(plannedByCatForMonth[form.category] || 0)
    const actualCat = entries.reduce((sum, e) => {
      const ed = new Date(e.date)
      const mk = `${ed.getFullYear()}-${String(ed.getMonth() + 1).padStart(2, '0')}`
      return sum + (mk === monthKey && e.category === form.category ? e.amount : 0)
    }, 0)
    const willExceedCat = plannedCat > 0 && actualCat + amountNum > plannedCat

    addEntry({ amount: amountNum, category: form.category, date: form.date, note: form.note })

    if (willExceedCat) {
      showToast(`Warning: ${form.category} exceeds plan for ${monthKey}`, 'warning')
    } else if (willExceedTotal) {
      showToast(`Warning: Total spending exceeds plan for ${monthKey}`, 'warning')
    } else {
      showToast(`Added spending: ${form.category} $${amountNum.toLocaleString()}`, 'success')
    }

    setForm({ amount: '', category: form.category, date: new Date().toISOString().split('T')[0], note: '' })
  }

  // Quick Add handler removed; global QuickAdd component provides add logic

  const monthLabel = useMemo(() => {
    if (!monthParam) return null
    const [y, m] = monthParam.split('-').map(Number)
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

  const currentMonthKey = useMemo(() => monthParam ?? monthKeyFromDate(yearForView, monthForView), [monthParam, yearForView, monthForView])

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

  // Budget summary computations for currentMonthKey
  const earningsThisMonth = useMemo(() => totalEarningsForMonth(currentMonthKey), [currentMonthKey, totalEarningsForMonth])
  const plannedThisMonth = useMemo(() => totalPlannedForMonth(currentMonthKey), [currentMonthKey, totalPlannedForMonth])
  const plannedByCategory = useMemo(() => byCategoryPlannedForMonth(currentMonthKey), [currentMonthKey, byCategoryPlannedForMonth])
  const variance = useMemo(() => earningsThisMonth - totalForView, [earningsThisMonth, totalForView])

  const handleAddEarning = () => {
    const amt = Number(earningForm.amount)
    if (!amt || !earningForm.source) {
      showToast('Please provide a source and a valid amount', 'warning')
      return
    }
    addEarning({ source: earningForm.source, amount: amt, date: earningForm.date })
    showToast(`Added earning: ${earningForm.source} $${amt.toLocaleString()}`, 'success')
    setEarningForm({ source: '', amount: '', date: new Date().toISOString().split('T')[0] })
  }

  const handleAddPlan = () => {
    const amt = Number(planForm.amount)
    if (!amt) { showToast('Please enter a valid planned amount', 'warning'); return }
    setPlanForMonthCategory(currentMonthKey, planForm.category, amt)
    showToast(`Added plan: ${planForm.category} $${amt.toLocaleString()}`, 'success')
    setPlanForm({ category: planForm.category, amount: '' })
  }

  const handleAddBorrow = () => {
    const amt = Number(borrowForm.amount)
    if (!amt || !borrowForm.from) {
      showToast('Please provide a name and a valid amount', 'warning')
      return
    }
    addBorrow({ from: borrowForm.from, amount: amt, date: borrowForm.date })
    showToast(`Added borrow: ${borrowForm.from} $${amt.toLocaleString()}`, 'success')
    setBorrowForm({ from: '', amount: '', date: new Date().toISOString().split('T')[0] })
  }

  const confirmDelete = () => {
    if (!pendingDelete) return
    if (pendingDelete.type === 'earning' && pendingDelete.id != null) {
      removeEarning(pendingDelete.id)
      showToast('Deleted earning', 'deleted')
    } else if (pendingDelete.type === 'plan' && pendingDelete.cat) {
      removePlanForMonthCategory(currentMonthKey, pendingDelete.cat)
      showToast(`Deleted plan for ${pendingDelete.cat}`, 'deleted')
    } else if (pendingDelete.type === 'borrow' && pendingDelete.id != null) {
      removeBorrow(pendingDelete.id)
      showToast('Deleted borrow', 'deleted')
    } else if (pendingDelete.type === 'category' && pendingDelete.cat) {
      removeCategory(pendingDelete.cat)
      showToast(`Deleted category ${pendingDelete.cat}`, 'deleted')
    }
    setPendingDelete(null)
  }
  const cancelDelete = () => setPendingDelete(null)

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/spend" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="w-8 h-8" />
          </a>
          {/* <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-tint-primary text-primary">
            <Wallet className="w-5 h-5" />
          </span> */}
          <div>
            <h1 className="text-3xl font-bold text-primary">{monthLabel ? `Spending • ${monthLabel}` : t('title')}</h1>
            <p className="text-muted-foreground">{monthLabel ? 'Filtered by month' : t('subtitle')}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">{monthLabel ? 'Total this view' : t('spentThisMonth')}</p>
          <p className={`text-2xl font-bold ${totalForView > plannedThisMonth ? 'text-rose-600' : ''}`}>${totalForView.toLocaleString()}</p>
        </div>
      </header>


      {/* Spending Configuration */}
      <div className="bg-card rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><ClipboardList className="w-5 h-5" />Spending Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Earnings */}
          <div>
            <h3 className="text-md font-semibold mb-2 flex items-center gap-2"><DollarSign className="w-4 h-4" />Earnings</h3>
            <div className="space-y-2">
              <input className="w-full bg-transparent border border-border rounded-md p-2" placeholder="Source (salary, investing...)" value={earningForm.source} onChange={e => setEarningForm(prev => ({ ...prev, source: e.target.value }))} />
              <input className="w-full bg-transparent border border-border rounded-md p-2" type="number" placeholder="Amount" value={earningForm.amount} onChange={e => setEarningForm(prev => ({ ...prev, amount: e.target.value }))} />
              <input className="w-full bg-transparent border border-border rounded-md p-2" type="date" value={earningForm.date} onChange={e => setEarningForm(prev => ({ ...prev, date: e.target.value }))} />
              <button onClick={handleAddEarning} className="w-full bg-primary text-primary-foreground rounded-md py-2">Add Earning</button>
            </div>
            <div className="mt-3 text- text-muted-foreground">Total Earnings ({currentMonthKey}): <span className="font-medium text-lg text-primary">${earningsThisMonth.toLocaleString()}</span></div>
            <ul className="mt-3 space-y-2 max-h-40 overflow-auto">
              {earnings.filter(e => new Date(e.date).getFullYear() === yearForView && (new Date(e.date).getMonth() + 1) === monthForView).map(e => (
                <li key={e.id} className="flex items-center justify-between text-sm">
                  <span>{e.source} • {new Date(e.date).toLocaleDateString()}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">${e.amount.toLocaleString()}</span>
                    <button onClick={() => setPendingDelete({ type: 'earning', id: e.id })} className="p-1 rounded hover:bg-muted text-muted-foreground" aria-label="Delete earning">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Planning */}
          <div>
            <h3 className="text-md font-semibold mb-2">Planning</h3>
            <div className="space-y-2">
              <select className="w-full bg-transparent border border-border rounded-md p-2" value={planForm.category} onChange={e => setPlanForm(prev => ({ ...prev, category: e.target.value }))}>
                {categories.map(c => (<option key={c} value={c}>{c}</option>))}
              </select>
              <input className="w-full bg-transparent border border-border rounded-md p-2" type="number" placeholder="Planned amount" value={planForm.amount} onChange={e => setPlanForm(prev => ({ ...prev, amount: e.target.value }))} />
              <button onClick={handleAddPlan} className="w-full bg-primary text-primary-foreground rounded-md py-2">Add Plan</button>
            </div>
            <div className="mt-3 text-sm text-muted-foreground">Total Planned ({currentMonthKey}): <span className="font-medium text-lg text-amber-500">${plannedThisMonth.toLocaleString()}</span></div>
            <div className="mt-3 space-y-2">
              {Object.entries(plannedByCategory).map(([cat, amt]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-muted-foreground">{cat}</span>
                  <div className="flex-1 h-2 bg-muted rounded">
                    <div className={`h-2 rounded ${((byCategoryForView[cat] || 0) > (amt as number)) ? 'bg-rose-600' : 'bg-primary'}`} style={{ width: `${Math.min(100, Math.round(((byCategoryForView[cat] || 0) / (amt as number || 1)) * 100))}%` }} />
                  </div>
                  <span className="w-28 text-right text-sm">Planned: ${(amt as number).toLocaleString()}</span>
                  <button
                    className="p-1 rounded hover:bg-muted text-muted-foreground"
                    onClick={() => setPendingDelete({ type: 'plan', cat })}
                    aria-label={`Delete plan for ${cat}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {Object.keys(plannedByCategory).length === 0 && (
                <p className="text-muted-foreground text-sm">No plans yet.</p>
              )}
            </div>
            {/* Manage Categories */}
            <div className="mt-4">
              <h4 className="text-sm font-semibold">Manage Categories</h4>
              <div className="flex gap-2 mt-2">
                <input
                  className="flex-1 bg-transparent border border-border rounded-md p-2 text-sm"
                  placeholder="New category"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                />
                <button
                  className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm"
                  onClick={() => {
                    const name = newCategory.trim()
                    if (!name) return
                    addCategory(name)
                    setNewCategory('')
                  }}
                >
                  Add
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {categories.map(c => (
                  <span key={c} className="inline-flex items-center gap-2 border border-border rounded px-2 py-1 text-xs">
                    {c}
                    {c !== 'Other' && (
                      <button
                        className="p-1 rounded hover:bg-muted text-muted-foreground"
                        onClick={() => setPendingDelete({ type: 'category', cat: c })}
                        aria-label={`Delete ${c}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Borrowing */}
          <div>
            <h3 className="text-md font-semibold mb-2 flex items-center gap-2"><HandCoins className="w-4 h-4" />Borrowing</h3>
            <div className="space-y-2">
              <input className="w-full bg-transparent border border-border rounded-md p-2" placeholder="From (name)" value={borrowForm.from} onChange={e => setBorrowForm(prev => ({ ...prev, from: e.target.value }))} />
              <input className="w-full bg-transparent border border-border rounded-md p-2" type="number" placeholder="Amount" value={borrowForm.amount} onChange={e => setBorrowForm(prev => ({ ...prev, amount: e.target.value }))} />
              <input className="w-full bg-transparent border border-border rounded-md p-2" type="date" value={borrowForm.date} onChange={e => setBorrowForm(prev => ({ ...prev, date: e.target.value }))} />
              <button onClick={handleAddBorrow} className="w-full bg-primary text-primary-foreground rounded-md py-2">Add Borrow</button>
            </div>
            <ul className="mt-3 space-y-2 max-h-40 overflow-auto">
              {borrows.filter(b => new Date(b.date).getFullYear() === yearForView && (new Date(b.date).getMonth() + 1) === monthForView).map(b => (
                <li key={b.id} className="text-sm flex items-center justify-between">
                  <span>{b.from} • {new Date(b.date).toLocaleDateString()}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">${b.amount.toLocaleString()}</span>
                    {b.repaidDate ? (
                      <span className="text-emerald-500">Repaid ${Number(b.repaidAmount || 0).toLocaleString()} • {new Date(b.repaidDate).toLocaleDateString()}</span>
                    ) : (
                      <button
                        className="px-2 py-1 text-xs rounded border border-border hover:bg-muted"
                        onClick={() => updateBorrowRepayment(b.id, b.amount, new Date().toISOString().split('T')[0])}
                      >
                        Mark repaid
                      </button>
                    )}
                    <button onClick={() => setPendingDelete({ type: 'borrow', id: b.id })} className="p-1 rounded hover:bg-muted text-muted-foreground" aria-label="Delete borrow">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
              {borrows.length === 0 && <p className="text-muted-foreground text-sm">No borrows this month.</p>}
            </ul>
            <div className="mt-2 text-xs text-muted-foreground">
              Outstanding this month: {
                (() => {
                  const list = borrows.filter(b => new Date(b.date).getFullYear() === yearForView && (new Date(b.date).getMonth() + 1) === monthForView)
                  const outstanding = list.reduce((s, b) => s + (b.amount - (b.repaidAmount || 0)), 0)
                  return <span className="font-medium text-sm text-warning">${outstanding.toLocaleString()}</span>
                })()
              }
            </div>
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border p-4 bg-tint-muted">
            <p className="text-xs text-muted-foreground">Earnings</p>
            <p className="text-xl font-bold">${earningsThisMonth.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border p-4 bg-tint-muted">
            <p className="text-xs text-muted-foreground">Actual Spending</p>
            <p className="text-xl font-bold">${totalForView.toLocaleString()}</p>
          </div>
          <div className={`rounded-lg border p-4 ${variance >= 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
            <p className="text-xs text-muted-foreground">Budget Position</p>
            <p className="text-xl font-bold">{variance >= 0 ? `Under by $${variance.toLocaleString()}` : `Over by $${Math.abs(variance).toLocaleString()}`}</p>
          </div>
        </div>
      </div>

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