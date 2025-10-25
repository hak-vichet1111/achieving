export function parseMonthKey(monthKey: string): { year: number; month: number } {
  const [y, m] = monthKey.split('-').map(Number)
  return { year: y, month: m }
}

export function getMonthBounds(monthKey: string): { min: string; max: string; lastDay: number } {
  const { year, month } = parseMonthKey(monthKey)
  const lastDay = new Date(year, month, 0).getDate() // month is 1-based in monthKey
  const min = `${year}-${String(month).padStart(2, '0')}-01`
  const max = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { min, max, lastDay }
}

export function isDateInMonth(dateStr: string, monthKey: string): boolean {
  const d = new Date(dateStr)
  const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  return mk === monthKey
}