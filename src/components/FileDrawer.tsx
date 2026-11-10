import { useEffect, useRef } from 'react'
import { Download, X } from 'lucide-react'
import { fmtDrawer } from '../dates'
import type { DeliveryRow } from '../data'
import { StatusChip } from './DeliveriesTable'

/**
 * Right-hand file drawer ("File - drawer" in Figma). A dialog: focus moves in on open,
 * is trapped while open, and returns to the row on close. Esc, the close button
 * and a click outside all close it.
 */
export function FileDrawer({ row, onClose }: { row: DeliveryRow; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusables = panelRef.current.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])')
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [onClose])

  const fields: [string, React.ReactNode][] = [
    ['Status', <StatusChip key="s" status={row.status} />],
    ['Service', row.service],
    ['Publication', row.publication],
    ['Run date', fmtDrawer(row.runDate)],
    ['Entities', String(row.entities)],
    ['File', row.file],
  ]
  if (row.status === 'Failed' && row.cause) fields.push(['Cause', row.cause])

  return (
    <div className="fixed inset-0 z-40" data-testid="drawer-layer">
      <div className="absolute inset-0 bg-[#1b223433]" onClick={onClose} aria-hidden="true" />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="absolute right-0 top-0 flex h-full w-[500px] max-w-full flex-col bg-white shadow-pop"
        data-testid="drawer"
      >
        <div className="flex items-start gap-4 border-b border-line px-4 py-4">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close file details"
            className="mt-1 flex h-6 w-6 items-center justify-center rounded text-ink"
          >
            <X size={20} strokeWidth={1.6} />
          </button>
          <div>
            <h2 id="drawer-title" className="m-0 text-[18px] font-semibold leading-6 text-ink">
              {row.file}
            </h2>
            <div className="text-[18px] leading-6 text-ink">{row.destination}</div>
          </div>
        </div>
        <div className="px-4 pt-6">
          <h3 className="m-0 border-b border-line pb-3 text-[16px] font-semibold text-ink">Delivery details</h3>
          <dl className="m-0 mt-3 grid grid-cols-[156px_1fr] gap-y-[14px] text-[14px] leading-5 text-ink">
            {fields.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-ink">{k}</dt>
                <dd className="m-0 break-words">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="mt-auto flex justify-end gap-2 border-t border-line px-4 py-3">
          <button type="button" className="h-9 rounded border border-brand-border bg-white px-4 text-[14px] font-medium text-brand">
            View destination
          </button>
          <button type="button" className="flex h-9 items-center gap-2 rounded bg-brand px-4 text-[14px] font-medium text-white">
            <Download size={16} aria-hidden="true" />
            Download file
          </button>
        </div>
      </aside>
    </div>
  )
}
