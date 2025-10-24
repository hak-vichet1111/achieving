import React, { useMemo } from 'react'
import { useSpending } from '../contexts/SpendingContext'
import { motion } from 'framer-motion'
import { Wallet, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

function monthLabelFromKey(key: string) {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1, 1)
  return `${d.toLocaleString(undefined, { month: 'long' })} ${d.getFullYear()}`
}

export default function SpendingSummary() {
  const { recentMonths, totalActualForMonth, totalEarningsForMonth, totalPlannedForMonth } = useSpending()
  const { t } = useTranslation('spending')

  const now = new Date()
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const months = useMemo(() => {
    const current = {
      key: currentMonthKey,
      label: monthLabelFromKey(currentMonthKey),
      total: totalActualForMonth(currentMonthKey)
    }
    return [current, ...recentMonths]
  }, [recentMonths, currentMonthKey, totalActualForMonth])

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
        {months.map((m) => {
          const earnings = totalEarningsForMonth(m.key)
          const planned = totalPlannedForMonth(m.key)
          const actual = totalActualForMonth(m.key)
          const max = Math.max(1, earnings, planned, actual)
          const variance = earnings - actual
          const underBudget = variance >= 0
          return (
            <motion.div key={m.key} whileHover={{ y: -4 }} className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{m.label}</p>
                  <p className="text-xl font-bold">${actual.toLocaleString()}</p>
                </div>
                <Link to={`/spend/${m.key}`} className="text-sm text-primary inline-flex items-center gap-1 hover:underline">
                  {t('viewDetails')} <ArrowRight size={14} />
                </Link>
              </div>

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