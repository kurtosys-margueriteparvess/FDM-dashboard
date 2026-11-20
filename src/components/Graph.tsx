import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TODAY } from '../config'
import { graphDates, graphPoint, isAvailable, type GraphPoint } from '../data'
import { axisLabel, fmtFull, fmtRange, fmtShort } from '../dates'

// Geometry, matching the Figma frame: 4 gridlines (150, 100, 50, 0) in a 112px plot,
// 13 equal columns, a 31px axis gutter on the left and three label rows underneath.
const PLOT_H = 112
const Y_TOP = 8
const Y_BOTTOM = 104
const AXIS_W = 31
const LABEL_H = 56
const SVG_H = PLOT_H + LABEL_H
const POP_W = 204

const SERIES = [
  { key: 'processed', label: 'Processed', color: 'var(--color-series-processed)', width: 1.5 },
  { key: 'delivered', label: 'Delivered', color: 'var(--color-series-delivered)', width: 1.5 },
] as const

/** Time ranges in the control above the graph. Only two weeks has data in this prototype. */
const RANGES = ['2W', '1M', '6M', '1Y'] as const

type SeriesKey = (typeof SERIES)[number]['key']

/** How long the pointer must rest on a day before its card opens. */
const CARD_DELAY_MS = 400

export function Graph({
  selectedDate,
  onSelect,
}: {
  selectedDate: string
  onSelect: (iso: string) => void
}) {
  const dates = useMemo(() => graphDates(), [])
  const points = useMemo(() => dates.map(graphPoint), [dates])
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(1000)
  const [active, setActive] = useState<number | null>(null)
  const hideTimer = useRef<number | undefined>(undefined)
  // The card waits for the pointer to rest on a day (hover intent), so it never gets in the way
  // while moving across the graph. The ticker itself follows the pointer immediately.
  const [cardReady, setCardReady] = useState(false)
  const showTimer = useRef<number | undefined>(undefined)
  const touchMode = useRef(false)

  // Redraw whenever the container changes size, for example when the navigation opens.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(Math.max(320, Math.round(el.getBoundingClientRect().width))))
    ro.observe(el)
    setWidth(Math.max(320, Math.round(el.getBoundingClientRect().width)))
    return () => ro.disconnect()
  }, [])

  const n = dates.length
  const colW = (width - AXIS_W) / n
  const colX = (i: number) => AXIS_W + i * colW
  const colC = (i: number) => AXIS_W + i * colW + colW / 2

  const maxVal = Math.max(150, ...points.map((p) => Math.max(p.processed, p.delivered)))
  const yMax = Math.ceil(maxVal / 50) * 50
  const y = (v: number) => Y_BOTTOM - (v / yMax) * (Y_BOTTOM - Y_TOP)
  const gridValues: number[] = []
  for (let v = 0; v <= yMax; v += 50) gridValues.push(v)

  const selectedIdx = dates.indexOf(selectedDate)

  const clearShow = () => window.clearTimeout(showTimer.current)
  /** keyboard, focus and touch: open the day and its card straight away */
  const showNow = (i: number) => {
    clearShow()
    setActive(i)
    setCardReady(true)
  }
  const clearHide = () => window.clearTimeout(hideTimer.current)
  const scheduleHide = () => {
    clearHide()
    hideTimer.current = window.setTimeout(() => setActive(null), 160)
  }
  useEffect(
    () => () => {
      window.clearTimeout(hideTimer.current)
      window.clearTimeout(showTimer.current)
    },
    [],
  )
  useEffect(() => {
    if (active === null) {
      window.clearTimeout(showTimer.current)
      setCardReady(false)
    }
  }, [active])

  const idxFromEvent = useCallback(
    (clientX: number, rect: DOMRect) => {
      const x = clientX - rect.left
      return Math.min(n - 1, Math.max(0, Math.floor((x - AXIS_W) / colW)))
    },
    [n, colW],
  )

  // Tapping outside closes the pop-up on touch devices.
  useEffect(() => {
    if (active === null) return
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setActive(null)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [active])

  const choose = (i: number) => {
    const p = points[i]
    if (!p.available) return
    onSelect(p.date)
    setActive(null)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const cur = active ?? Math.max(0, selectedIdx)
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      showNow(Math.min(n - 1, cur + 1))
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      showNow(Math.max(0, cur - 1))
    } else if (e.key === 'Home') {
      e.preventDefault()
      showNow(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      showNow(n - 1)
    } else if (e.key === 'Enter' && e.target === e.currentTarget) {
      e.preventDefault()
      choose(cur)
    } else if (e.key === 'Escape') {
      setActive(null)
    }
  }

  // Build line segments: solid between two complete days, dotted when either end is today or unavailable.
  const segments = (key: SeriesKey) => {
    const out: { x1: number; y1: number; x2: number; y2: number; dotted: boolean }[] = []
    for (let i = 0; i < n - 1; i++) {
      const a = points[i]
      const b = points[i + 1]
      if (!a.available && !b.available) continue
      const dotted = !a.available || !b.available || a.date === TODAY || b.date === TODAY
      const ay = a.available ? y(a[key]) : y(0)
      const by = b.available ? y(b[key]) : y(0)
      out.push({ x1: colC(i), y1: ay, x2: colC(i + 1), y2: by, dotted })
    }
    return out
  }

  const sublabel = (p: GraphPoint, i: number) => {
    if (!p.available) return 'Unavailable'
    if (i === selectedIdx && p.date === TODAY) return 'Today'
    if (i === selectedIdx) return 'Selected'
    if (p.date === TODAY) return 'Today'
    return ''
  }

  const popLeft =
    active === null
      ? 0
      : colC(active) + 11 + POP_W > width
        ? colC(active) - 11 - POP_W
        : colC(active) + 11
  const activePoint = active !== null ? points[active] : null

  return (
    <section className="mx-4 mb-4 rounded-2xl border border-line bg-white px-[27px] py-[17px] shadow-card" aria-labelledby="graph-title" data-testid="graph-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-max flex-1 basis-0">
          <h2 id="graph-title" className="m-0 text-[18px] font-semibold leading-6 text-ink">
            Inbound &amp; Outbound Files
          </h2>
          <ul className="m-0 mt-2 flex list-none gap-2 p-0">
            {SERIES.map((s) => (
              <li key={s.key} className="flex h-6 items-center gap-2 rounded-full border border-line bg-white px-3 text-[11px] text-ink">
                <span className="inline-block h-[2px] w-[10px]" style={{ background: s.color }} aria-hidden="true" />
                {s.label}
              </li>
            ))}
          </ul>
        </div>
        <div
          role="tablist"
          aria-label="Time range"
          className="flex h-8 shrink-0 items-center rounded-lg bg-surface-subtle p-[2px]"
          data-testid="range-tabs"
        >
          {RANGES.map((r) => {
            const on = r === '2W'
            return (
              <span
                key={r}
                role="tab"
                aria-selected={on}
                aria-disabled={on ? undefined : 'true'}
                className={`flex h-7 w-[58px] items-center justify-center rounded-md text-[12px] ${on ? 'bg-white font-medium text-ink shadow-[0_1px_3px_#0000001f]' : 'text-ink-secondary'}`}
              >
                {r}
              </span>
            )
          })}
        </div>
        <div className="flex min-w-max flex-1 basis-0 flex-col items-end gap-1">
          <div className="text-[11px] leading-4 text-[#4a5267]" data-testid="showing-label">
            Showing {fmtShort(selectedDate)}
          </div>
          <button
            type="button"
            onClick={() => onSelect(TODAY)}
            disabled={selectedDate === TODAY}
            className="h-[29px] rounded border border-brand-border bg-white px-3 text-[13px] font-medium text-brand hover:bg-[#f2f6ff] disabled:cursor-default disabled:border-line disabled:bg-white disabled:text-[#b4bacb] disabled:hover:bg-white"
          >
            Back to today
          </button>
        </div>
      </div>

      <div
        ref={wrapRef}
        className="relative mt-4 outline-offset-4"
        tabIndex={0}
        role="group"
        aria-label={`Files per day, ${fmtRange(dates[0], dates[n - 1])}. Showing ${fmtFull(selectedDate)}. Use the left and right arrow keys to choose a day and Enter to show it.`}
        onKeyDown={onKeyDown}
        onFocus={(e) => {
          if (e.target === e.currentTarget && active === null) showNow(Math.max(0, selectedIdx))
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setActive(null)
        }}
        onPointerEnter={clearHide}
        onPointerLeave={() => {
          clearShow()
          if (!touchMode.current) scheduleHide()
        }}
      >
        <svg
          width={width}
          height={SVG_H}
          className="block touch-pan-y select-none"
          onPointerMove={(e) => {
            if (e.pointerType === 'touch') return
            touchMode.current = false
            clearHide()
            const idx = idxFromEvent(e.clientX, e.currentTarget.getBoundingClientRect())
            if (idx !== active) {
              setActive(idx)
              setCardReady(false)
              clearShow()
              showTimer.current = window.setTimeout(() => setCardReady(true), CARD_DELAY_MS)
            }
          }}
          onPointerDown={(e) => {
            if (e.pointerType === 'touch' || e.pointerType === 'pen') {
              touchMode.current = true
              showNow(idxFromEvent(e.clientX, e.currentTarget.getBoundingClientRect()))
            }
          }}
          aria-hidden="true"
        >
          <defs>
            <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="#c3c9d9" strokeWidth="1" />
            </pattern>
          </defs>

          {/* gridlines and y labels */}
          {gridValues.map((v) => (
            <g key={v}>
              <line x1={AXIS_W} x2={width} y1={y(v)} y2={y(v)} stroke="var(--color-line-subtle)" strokeWidth="1" />
              <text x={AXIS_W - 8} y={y(v) + 4} textAnchor="end" fontSize="12" fill="var(--color-ink-secondary)">
                {v}
              </text>
            </g>
          ))}

          {/* unavailable days: hatched */}
          {points.map((p, i) =>
            p.available ? null : (
              <rect key={p.date} x={colX(i)} y={0} width={colW} height={PLOT_H} fill="url(#hatch)" data-testid={`graph-unavailable-${p.date}`} />
            ),
          )}

          {/* areas under the lines: delivered in green, processed in blue */}
          {SERIES.slice().reverse().map((s) => {
            const idx = points.map((p, i) => (p.available ? i : -1)).filter((i) => i >= 0)
            if (idx.length < 2) return null
            const d =
              `M ${colC(idx[0])} ${y(0)} ` +
              idx.map((i) => `L ${colC(i)} ${y(points[i][s.key])}`).join(' ') +
              ` L ${colC(idx[idx.length - 1])} ${y(0)} Z`
            return <path key={s.key} d={d} fill={s.color} opacity={s.key === 'delivered' ? 0.16 : 0.34} data-testid={`area-${s.key}`} />
          })}

          {/* hovered day: grey band and ticker */}
          {active !== null && active !== selectedIdx && (
            <rect x={colX(active)} y={0} width={colW} height={PLOT_H} fill="#c3c9d9" opacity="0.4" />
          )}

          {/* selected day: blue band and centre line */}
          {selectedIdx >= 0 && (
            <g data-testid="graph-selected" data-date={selectedDate}>
              <rect x={colX(selectedIdx)} y={0} width={colW} height={PLOT_H} fill="#3a56e0" opacity="0.38" />
              <line x1={colC(selectedIdx)} x2={colC(selectedIdx)} y1={0} y2={PLOT_H} stroke="#1f3fd1" strokeWidth="1.5" />
            </g>
          )}

          {active !== null && (
            <line
              x1={colC(active)}
              x2={colC(active)}
              y1={0}
              y2={PLOT_H}
              stroke="#1f3fd1"
              strokeWidth="1"
              data-testid="graph-ticker"
              data-date={dates[active]}
            />
          )}

          {/* series */}
          {SERIES.map((s) => (
            <g key={s.key} fill="none" stroke={s.color} strokeWidth={s.width} strokeLinecap="round" strokeLinejoin="round">
              {segments(s.key).map((seg, k) => (
                <line key={k} x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2} strokeDasharray={seg.dotted ? '2 4' : undefined} />
              ))}
            </g>
          ))}

          {/* markers on the hovered day */}
          {active !== null && points[active].available &&
            SERIES.map((s) => (
              <circle key={s.key} cx={colC(active)} cy={y(points[active][s.key])} r="3.5" fill="#fff" stroke={s.color} strokeWidth="2" />
            ))}

          {/* column hit areas and labels */}
          {points.map((p, i) => {
            const lab = axisLabel(p.date)
            const isSel = i === selectedIdx
            const sub = sublabel(p, i)
            const weight = isSel ? 700 : 400
            const fill = isSel ? 'var(--color-ink)' : 'var(--color-ink-secondary)'
            return (
              <g key={p.date} data-testid={`graph-col-${p.date}`} data-date={p.date}>
                <rect x={colX(i)} y={0} width={colW} height={SVG_H} fill="transparent" />
                <text x={colC(i)} y={PLOT_H + 20} textAnchor="middle" fontSize="12" fontWeight={weight} fill={fill}>
                  {lab.weekday}
                </text>
                <text x={colC(i)} y={PLOT_H + 36} textAnchor="middle" fontSize="12" fontWeight={weight} fill={fill}>
                  {lab.date}
                </text>
                {sub && (
                  <text x={colC(i)} y={PLOT_H + 52} textAnchor="middle" fontSize="12" fontWeight={weight} fill={fill}>
                    {sub}
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        {/* pop-up for the active day. It stays open while the pointer is over it, so it can be clicked. */}
        {active !== null && cardReady && activePoint && (
          <div
            role="group"
            aria-label={`${fmtFull(activePoint.date)} details`}
            data-testid="graph-popup"
            data-date={activePoint.date}
            className="absolute z-10 rounded-xl border border-line bg-white p-3 shadow-pop"
            style={{ left: popLeft, top: 0, width: POP_W }}
            onPointerEnter={clearHide}
          >
            <div className="whitespace-nowrap text-[14px] leading-5 text-ink">{fmtFull(activePoint.date)}</div>
            {activePoint.available ? (
              <>
                <dl className="m-0 mt-2 flex flex-col gap-[6px]">
                  {SERIES.map((s) => (
                    <div key={s.key} className="flex items-center gap-2 text-[12px] leading-4 text-ink">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} aria-hidden="true" />
                      <dt className="flex-1">{s.label}</dt>
                      <dd className="m-0 font-medium" data-testid={`popup-${s.key}`}>
                        {activePoint[s.key]}
                      </dd>
                    </div>
                  ))}
                </dl>
                {activePoint.date === selectedDate ? (
                  <div className="mt-3 text-[14px] leading-5 text-ink-secondary" data-testid="popup-already">
                    Showing this day
                  </div>
                ) : (
                  <button
                    type="button"
                    data-testid="show-day"
                    onClick={() => choose(active)}
                    className="mt-3 border-0 bg-transparent p-0 text-left text-[14px] leading-5 text-brand hover:underline"
                  >
                    Click to show this day
                  </button>
                )}
              </>
            ) : (
              <div className="mt-2 text-[12px] leading-4 text-ink-secondary">No data available for this day.</div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export { isAvailable }
