import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type SpendingEntry = {
  id: string
  amount: number
  category: string
  date: string // ISO date
  note?: string
}

export type EarningEntry = {
  id: string
  source: string
  amount: number
  date: string // ISO date, used to derive YYYY-MM
}

export type BorrowEntry = {
  id: string
  from: string
  amount: number
  date: string // ISO date
  repaidAmount?: number
  repaidDate?: string
}

export type PlansByMonth = Record<string, Record<string, number>> // monthKey -> { category: plannedAmount }

type SpendingContextType = {
  entries: SpendingEntry[]
  addEntry: (entry: Omit<SpendingEntry, 'id'>) => void
  removeEntry: (id: string) => void
  clearAll: () => void
  totalThisMonth: number
  byCategoryThisMonth: Record<string, number>
  recentMonths: { key: string, label: string, total: number }[]

  earnings: EarningEntry[]
  addEarning: (entry: Omit<EarningEntry, 'id'>) => void
  removeEarning: (id: string) => void

  plansByMonth: PlansByMonth
  setPlanForMonthCategory: (monthKey: string, category: string, plannedAmount: number) => void
  removePlanForMonthCategory: (monthKey: string, category: string) => void

  borrows: BorrowEntry[]
  addBorrow: (entry: Omit<BorrowEntry, 'id'>) => void
  updateBorrowRepayment: (id: string, repaidAmount: number, repaidDate: string) => void
  removeBorrow: (id: string) => void

  // category management
  categories: string[]
  addCategory: (name: string) => void
  removeCategory: (name: string) => void

  // computations
  totalEarningsForMonth: (monthKey: string) => number
  totalPlannedForMonth: (monthKey: string) => number
  byCategoryPlannedForMonth: (monthKey: string) => Record<string, number>
  totalActualForMonth: (monthKey: string) => number
}

const SpendingContext = createContext<SpendingContextType | undefined>(undefined)
const STORAGE_KEY = 'achieving_spending_entries'
const STORAGE_EARN = 'achieving_spending_earnings'
const STORAGE_PLANS = 'achieving_spending_plans'
const STORAGE_BORROWS = 'achieving_spending_borrows'
const STORAGE_CATEGORIES = 'achieving_spending_categories'
const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Housing', 'Utilities', 'Entertainment', 'Other']

function monthKeyFromISO(dateISO: string) {
  const d = new Date(dateISO)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function SpendingProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<SpendingEntry[]>([])
  const [earnings, setEarnings] = useState<EarningEntry[]>([])
  const [plansByMonth, setPlansByMonth] = useState<PlansByMonth>({})
  const [borrows, setBorrows] = useState<BorrowEntry[]>([])
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const parsed: SpendingEntry[] = raw ? JSON.parse(raw) : []
      setEntries(parsed)
    } catch (e) {
      console.warn('Failed to parse spending from storage', e)
    }
    try {
      const rawEarn = localStorage.getItem(STORAGE_EARN)
      setEarnings(rawEarn ? JSON.parse(rawEarn) : [])
    } catch (e) {
      console.warn('Failed to parse earnings from storage', e)
    }
    try {
      const rawPlans = localStorage.getItem(STORAGE_PLANS)
      setPlansByMonth(rawPlans ? JSON.parse(rawPlans) : {})
    } catch (e) {
      console.warn('Failed to parse plans from storage', e)
    }
    try {
      const rawBorrows = localStorage.getItem(STORAGE_BORROWS)
      setBorrows(rawBorrows ? JSON.parse(rawBorrows) : [])
    } catch (e) {
      console.warn('Failed to parse borrows from storage', e)
    }
    try {
      const rawCats = localStorage.getItem(STORAGE_CATEGORIES)
      setCategories(rawCats ? JSON.parse(rawCats) : DEFAULT_CATEGORIES)
    } catch (e) {
      console.warn('Failed to parse categories from storage', e)
    }
  }, [])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)) } catch (e) { console.warn('Failed to save spending', e) }
  }, [entries])
  useEffect(() => {
    try { localStorage.setItem(STORAGE_EARN, JSON.stringify(earnings)) } catch (e) { console.warn('Failed to save earnings', e) }
  }, [earnings])
  useEffect(() => {
    try { localStorage.setItem(STORAGE_PLANS, JSON.stringify(plansByMonth)) } catch (e) { console.warn('Failed to save plans', e) }
  }, [plansByMonth])
  useEffect(() => {
    try { localStorage.setItem(STORAGE_BORROWS, JSON.stringify(borrows)) } catch (e) { console.warn('Failed to save borrows', e) }
  }, [borrows])
  useEffect(() => {
    try { localStorage.setItem(STORAGE_CATEGORIES, JSON.stringify(categories)) } catch (e) { console.warn('Failed to save categories', e) }
  }, [categories])

  const addEntry = (entry: Omit<SpendingEntry, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setEntries(prev => [{ id, ...entry }, ...prev])
  }
  const removeEntry = (id: string) => setEntries(prev => prev.filter(e => e.id !== id))
  const clearAll = () => setEntries([])

  const addEarning = (entry: Omit<EarningEntry, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setEarnings(prev => [{ id, ...entry }, ...prev])
  }
  const removeEarning = (id: string) => setEarnings(prev => prev.filter(e => e.id !== id))

  const setPlanForMonthCategory = (monthKey: string, category: string, plannedAmount: number) => {
    setPlansByMonth(prev => ({
      ...prev,
      [monthKey]: {
        ...(prev[monthKey] || {}),
        [category]: plannedAmount,
      }
    }))
  }
  const removePlanForMonthCategory = (monthKey: string, category: string) => {
    setPlansByMonth(prev => {
      const next = { ...prev }
      const monthPlans = { ...(next[monthKey] || {}) }
      delete monthPlans[category]
      next[monthKey] = monthPlans
      return next
    })
  }

  const addBorrow = (entry: Omit<BorrowEntry, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setBorrows(prev => [{ id, ...entry }, ...prev])
  }
  const updateBorrowRepayment = (id: string, repaidAmount: number, repaidDate: string) => {
    setBorrows(prev => prev.map(b => b.id === id ? { ...b, repaidAmount, repaidDate } : b))
  }
  const removeBorrow = (id: string) => setBorrows(prev => prev.filter(b => b.id !== id))

  // categories API
  const addCategory = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setCategories(prev => prev.includes(trimmed) ? prev : [...prev, trimmed])
  }
  const removeCategory = (name: string) => {
    if (name === 'Other') return
    // remove category from list
    setCategories(prev => prev.filter(c => c !== name))
    // reassign existing spending entries to 'Other'
    setEntries(prev => prev.map(e => e.category === name ? { ...e, category: 'Other' } : e))
    // remove planned amounts for this category across all months
    setPlansByMonth(prev => {
      const next: PlansByMonth = {}
      for (const [mKey, planObj] of Object.entries(prev)) {
        const { [name]: _removed, ...rest } = planObj
        next[mKey] = rest
      }
      return next
    })
  }

  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0)
  const endOfMonth = new Date(); endOfMonth.setMonth(endOfMonth.getMonth()+1); endOfMonth.setDate(0); endOfMonth.setHours(23,59,59,999)

  const monthEntries = entries.filter(e => {
    const d = new Date(e.date)
    return d >= startOfMonth && d <= endOfMonth
  })

  const totalThisMonth = monthEntries.reduce((sum, e) => sum + (e.amount || 0), 0)
  const byCategoryThisMonth = monthEntries.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {} as Record<string, number>)

  // Compute totals for the last 6 months (excluding current month)
  const recentMonths = useMemo(() => {
    const sumsByMonthKey = entries.reduce((acc, e) => {
      const d = new Date(e.date)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
      acc[key] = (acc[key] || 0) + (e.amount || 0)
      return acc
    }, {} as Record<string, number>)

    const now = new Date()
    const arr: { key: string, label: string, total: number }[] = []
    for (let i = 1; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
      const label = `${d.toLocaleString(undefined, { month: 'short' })} ${d.getFullYear()}`
      arr.push({ key, label, total: sumsByMonthKey[key] || 0 })
    }
    return arr
  }, [entries])

  // Computations for arbitrary month key
  const totalEarningsForMonth = (monthKey: string) => earnings
    .filter(e => monthKeyFromISO(e.date) === monthKey)
    .reduce((s, e) => s + (e.amount || 0), 0)

  const totalPlannedForMonth = (monthKey: string) => Object.values(plansByMonth[monthKey] || {}).reduce((s, v) => s + v, 0)
  const byCategoryPlannedForMonth = (monthKey: string) => ({ ...(plansByMonth[monthKey] || {}) })

  const totalActualForMonth = (monthKey: string) => entries
    .filter(e => monthKeyFromISO(e.date) === monthKey)
    .reduce((s, e) => s + (e.amount || 0), 0)

  const value = useMemo<SpendingContextType>(() => ({
    entries,
    addEntry,
    removeEntry,
    clearAll,
    totalThisMonth,
    byCategoryThisMonth,
    recentMonths,
    earnings,
    addEarning,
    removeEarning,
    plansByMonth,
    setPlanForMonthCategory,
    removePlanForMonthCategory,
    borrows,
    addBorrow,
    updateBorrowRepayment,
    removeBorrow,
    categories,
    addCategory,
    removeCategory,
    totalEarningsForMonth,
    totalPlannedForMonth,
    byCategoryPlannedForMonth,
    totalActualForMonth,
  }), [entries, totalThisMonth, byCategoryThisMonth, recentMonths, earnings, plansByMonth, borrows, categories])

  return <SpendingContext.Provider value={value}>{children}</SpendingContext.Provider>
}

export function useSpending() {
  const ctx = useContext(SpendingContext)
  if (!ctx) throw new Error('useSpending must be used inside SpendingProvider')
  return ctx
}