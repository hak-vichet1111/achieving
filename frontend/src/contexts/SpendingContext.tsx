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

  // months management
  months: string[]
  addMonth: (monthKey: string) => void
  removeMonth: (monthKey: string) => void

  // computations
  totalEarningsForMonth: (monthKey: string) => number
  totalPlannedForMonth: (monthKey: string) => number
  byCategoryPlannedForMonth: (monthKey: string) => Record<string, number>
  totalActualForMonth: (monthKey: string) => number
}

const SpendingContext = createContext<SpendingContextType | undefined>(undefined)
const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8081'
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
  const [months, setMonths] = useState<string[]>([])

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

  // Hydrate months from backend
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/months`)
        if (res.ok) {
          const data = await res.json()
          const list = Array.isArray(data) ? data.map((m: any) => m.monthKey) : []
          setMonths(list)
        }
      } catch (e) {
        console.warn('Failed to fetch months', e)
      }
    })()
  }, [])

  // Hydrate from backend (fallback to localStorage if requests fail)
  useEffect(() => {
    const loadBackend = async () => {
      try {
        const [spRes, earnRes, borRes, catRes, planRes] = await Promise.all([
          fetch(`${API_BASE}/api/spending`),
          fetch(`${API_BASE}/api/earnings`),
          fetch(`${API_BASE}/api/borrows`),
          fetch(`${API_BASE}/api/categories`),
          fetch(`${API_BASE}/api/plans`),
        ])
        if (spRes.ok) {
          const data: SpendingEntry[] = await spRes.json()
          setEntries(data)
        }
        if (earnRes.ok) {
          const data: EarningEntry[] = await earnRes.json()
          setEarnings(data)
        }
        if (borRes.ok) {
          const data: BorrowEntry[] = await borRes.json()
          setBorrows(data)
        }
        if (catRes.ok) {
          const data: { name: string }[] = await catRes.json()
          const names = data.map(c => c.name)
          setCategories(names.length ? names : DEFAULT_CATEGORIES)
        }
        if (planRes.ok) {
          const data: { monthKey: string, category: string, plannedAmount: number }[] = await planRes.json()
          const map: PlansByMonth = {}
          for (const p of data) {
            if (!map[p.monthKey]) map[p.monthKey] = {}
            map[p.monthKey][p.category] = p.plannedAmount
          }
          setPlansByMonth(map)
        }
      } catch (e) {
        console.warn('Failed to fetch spending data from backend', e)
      }
    }
    loadBackend()
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
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/spending`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        })
        if (!res.ok) throw new Error('Failed to create spending')
        const created: SpendingEntry = await res.json()
        setEntries(prev => [created, ...prev])
      } catch (e) {
        console.warn('Failed to create spending', e)
      }
    })()
  }
  const removeEntry = (id: string) => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/spending/${id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Failed to delete spending')
        setEntries(prev => prev.filter(e => e.id !== id))
      } catch (e) {
        console.warn('Failed to delete spending', e)
      }
    })()
  }
   const clearAll = () => setEntries([])


  const addEarning = (entry: Omit<EarningEntry, 'id'>) => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/earnings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        })
        if (!res.ok) throw new Error('Failed to create earning')
        const created: EarningEntry = await res.json()
        setEarnings(prev => [created, ...prev])
      } catch (e) {
        console.warn('Failed to create earning', e)
      }
    })()
  }
  const removeEarning = (id: string) => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/earnings/${id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Failed to delete earning')
        setEarnings(prev => prev.filter(e => e.id !== id))
      } catch (e) {
        console.warn('Failed to delete earning', e)
      }
    })()
  }


  const setPlanForMonthCategory = (monthKey: string, category: string, plannedAmount: number) => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/plans`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ monthKey, category, plannedAmount }),
        })
        if (!res.ok) throw new Error('Failed to upsert plan')
        const plan: { monthKey: string, category: string, plannedAmount: number } = await res.json()
        setPlansByMonth(prev => ({
          ...prev,
          [plan.monthKey]: {
            ...(prev[plan.monthKey] || {}),
            [plan.category]: plan.plannedAmount,
          }
        }))
      } catch (e) {
        console.warn('Failed to upsert plan', e)
      }
    })()
  }
   const removePlanForMonthCategory = (monthKey: string, category: string) => {

    ;(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/plans/${monthKey}/${category}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Failed to delete plan')
        setPlansByMonth(prev => {
          const next = { ...prev }
          const monthPlans = { ...(next[monthKey] || {}) }
          delete monthPlans[category]
          next[monthKey] = monthPlans
          return next
        })
      } catch (e) {
        console.warn('Failed to delete plan', e)
      }
    })()
   }


  const addBorrow = (entry: Omit<BorrowEntry, 'id'>) => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/borrows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        })
        if (!res.ok) throw new Error('Failed to create borrow')
        const created: BorrowEntry = await res.json()
        setBorrows(prev => [created, ...prev])
      } catch (e) {
        console.warn('Failed to create borrow', e)
      }
    })()
  }
  const updateBorrowRepayment = (id: string, repaidAmount: number, repaidDate: string) => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/borrows/${id}/repayment`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repaidAmount, repaidDate }),
        })
        if (!res.ok) throw new Error('Failed to update borrow repayment')
        setBorrows(prev => prev.map(b => b.id === id ? { ...b, repaidAmount, repaidDate } : b))
      } catch (e) {
        console.warn('Failed to update borrow repayment', e)
      }
    })()
  }
  const removeBorrow = (id: string) => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/borrows/${id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Failed to delete borrow')
        setBorrows(prev => prev.filter(b => b.id !== id))
      } catch (e) {
        console.warn('Failed to delete borrow', e)
      }
    })()
  }

  // categories API

  const addCategory = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmed }),
        })
        if (!res.ok) throw new Error('Failed to create category')
        setCategories(prev => prev.includes(trimmed) ? prev : [...prev, trimmed])
      } catch (e) {
        console.warn('Failed to create category', e)
      }
    })()
  }
   const removeCategory = (name: string) => {
     if (name === 'Other') return


    ;(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/categories/${encodeURIComponent(name)}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Failed to delete category')
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
      } catch (e) {
        console.warn('Failed to delete category', e)
      }
    })()
   }

  // Months API
  const addMonth = (monthKey: string) => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/months`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ monthKey })
        })
        if (!res.ok) throw new Error('Failed to create month')
        setMonths(prev => (prev.includes(monthKey) ? prev : [monthKey, ...prev]))
      } catch (e) {
        console.warn('Failed to create month', e)
      }
    })()
  }

  const removeMonth = (monthKey: string) => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/months/${monthKey}`, { method: 'DELETE' })
        if (!res.ok && res.status !== 204) throw new Error('Failed to delete month')
        setMonths(prev => prev.filter(m => m !== monthKey))
      } catch (e) {
        console.warn('Failed to delete month', e)
      }
    })()
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
    months,
    addMonth,
    removeMonth,
    totalEarningsForMonth,
    totalPlannedForMonth,
    byCategoryPlannedForMonth,
    totalActualForMonth,
  }), [entries, totalThisMonth, byCategoryThisMonth, recentMonths, earnings, plansByMonth, borrows, categories, months])

  return <SpendingContext.Provider value={value}>{children}</SpendingContext.Provider>
}

export function useSpending() {
  const ctx = useContext(SpendingContext)
  if (!ctx) throw new Error('useSpending must be used inside SpendingProvider')
  return ctx
}