import { useEffect, useId, useRef, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { TODAY } from '../config'
import { isAvailable, EARLIEST } from '../data'
import { dow, fmtField, fmtShort, isoFrom, monthTitle, ym } from '../dates'

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

/**
 * Working-date field with a calendar popover. Dates before the data horizon
 * and after today are visibly blocked and cannot be chosen.
 */
export function DatePicker({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(ym(value))
  const wrapRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        btnRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const first = ym(EARLIEST)
  const last = ym(TODAY)
  const canPrev = view.year * 12 + view.month > first.year * 12 + first.month
  const canNext = view.year * 12 + view.month < last.year * 12 + last.month

  const step = (n: number) => {
    const t = view.year * 12 + view.month + n
    setView({ year: Math.floor(t / 12), month: t % 12 })
  }

  // Monday-first grid
  const firstDow = (dow(isoFrom(view.year, view.month, 1)) + 6) % 7
  const daysInMonth = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate()
  const cells: (string | null)[] = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(isoFrom(view.year, view.month, d))

  return (
    <div className="relative" ref={wrapRef}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => {
          setView(ym(value))
          setOpen((o) => !o)
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`Working date ${fmtField(value)}. Change date`}
        className="flex h-8 w-[130px] items-center justify-between rounded-lg border border-line bg-white pl-3 pr-2 text-[15px] text-ink"
      >
        <span data-testid="date-field">{fmtField(value)}</span>
        <Calendar size={20} strokeWidth={1.5} className="text-ink-secondary" />
      </button>
      {open && (
        <div
          id={id}
          role="dialog"
          aria-label="Choose working date"
          className="absolute right-0 top-10 z-30 w-[288px] rounded-xl border border-line bg-white p-3 shadow-pop"
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              disabled={!canPrev}
              onClick={() => step(-1)}
              className="flex h-8 w-8 items-center justify-center rounded text-ink hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="text-[15px] font-semibold">{monthTitle(view.year, view.month)}</div>
            <button
              type="button"
              aria-label="Next month"
              disabled={!canNext}
              onClick={() => step(1)}
              className="flex h-8 w-8 items-center justify-center rounded text-ink hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="grid grid-cols-7 text-center text-[12px] text-ink-secondary">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-[2px] text-center text-[14px]">
            {cells.map((iso, i) => {
              if (!iso) return <div key={`b${i}`} />
              const ok = isAvailable(iso)
              const selected = iso === value
              const day = Number(iso.slice(8))
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={!ok}
                  aria-label={ok ? fmtShort(iso) : `${fmtShort(iso)}, not available`}
                  aria-pressed={selected}
                  data-date={iso}
                  onClick={() => {
                    onChange(iso)
                    setOpen(false)
                    btnRef.current?.focus()
                  }}
                  className={[
                    'mx-auto flex h-9 w-9 items-center justify-center rounded-full',
                    selected ? 'bg-brand font-medium text-white' : '',
                    ok && !selected ? 'text-ink hover:bg-surface-subtle' : '',
                    !ok ? 'cursor-not-allowed text-[#b4bacb] line-through decoration-[#d7dceb]' : '',
                    iso === TODAY && !selected ? 'ring-1 ring-brand' : '',
                  ].join(' ')}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
