import { ArrowRight, Clock, TriangleAlert } from 'lucide-react'
import type { DeliveryRow, Status } from '../data'

export function StatusChip({ status }: { status: Status }) {
  if (status === 'Delivered') {
    return (
      <span className="inline-flex items-center rounded-full border border-success-border bg-success-bg px-2 py-[3px] text-[11px] leading-4 text-success">
        Delivered
      </span>
    )
  }
  if (status === 'Failed') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-error-bg px-2 py-[3px] text-[11px] leading-4 text-error">
        <TriangleAlert size={12} aria-hidden="true" />
        Failed
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded bg-surface-subtle px-2 py-[3px] text-[11px] leading-4 text-ink">
      <Clock size={12} aria-hidden="true" />
      Scheduled
    </span>
  )
}

export function DeliveriesTable({
  rows,
  isSunday,
  onOpen,
}: {
  rows: DeliveryRow[]
  isSunday: boolean
  onOpen: (row: DeliveryRow, trigger: HTMLElement) => void
}) {
  return (
    <section className="mx-4 mb-4 rounded-2xl border border-line bg-white pt-4 shadow-card" aria-labelledby="deliveries-title">
      <h2 id="deliveries-title" className="m-0 mb-2 px-4 text-[18px] font-semibold leading-6 text-ink">
        Deliveries
      </h2>
      <div className="mt-2 overflow-hidden rounded-b-2xl" role="table" aria-label="Deliveries">
        <div role="row" className="grid h-12 grid-cols-[3fr_1fr_1fr_1fr_1fr] items-center bg-table-head text-[15px] text-ink-table-head">
          <div role="columnheader" className="pl-4">Destination and file</div>
          <div role="columnheader">Service</div>
          <div role="columnheader">Run date</div>
          <div role="columnheader">Time</div>
          <div role="columnheader">Delivery status</div>
        </div>
        {rows.length === 0 && (
          <div role="row" className="flex h-[97px] items-center justify-center border-t border-line text-[15px] text-ink-secondary" data-testid="table-empty">
            {isSunday ? 'No files run on Sundays.' : 'No deliveries for this date.'}
          </div>
        )}
        {rows.map((row) => (
          <div
            key={row.id}
            role="row"
            tabIndex={0}
            data-testid="delivery-row"
            aria-label={`${row.destination}, ${row.file}, ${row.status}. Open file details`}
            onClick={(e) => onOpen(row, e.currentTarget)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onOpen(row, e.currentTarget)
              }
            }}
            className={[
              'grid min-h-[49px] cursor-pointer grid-cols-[3fr_1fr_1fr_1fr_1fr] items-center border-t border-line text-[15px] text-ink',
              row.status === 'Scheduled' ? 'bg-surface-sunken hover:bg-[#dfe1e8]' : 'bg-white hover:bg-surface-nav',
            ].join(' ')}
          >
            <div role="cell" className="py-2 pl-4 leading-5">
              <div>{row.destination}</div>
              <div className="text-ink-secondary">{row.file}</div>
            </div>
            <div role="cell">{row.service}</div>
            <div role="cell" className="pl-1">{row.runDate}</div>
            <div role="cell" className={`pr-4 leading-5 ${row.status === 'Scheduled' ? 'text-ink-secondary' : ''}`}>
              {row.time}
            </div>
            <div role="cell">
              <StatusChip status={row.status} />
            </div>
          </div>
        ))}
        <div className="flex h-12 items-center justify-end border-t border-line bg-surface-subtle px-4">
          <span
            aria-disabled="true"
            role="link"
            className="inline-flex items-center gap-1 text-[14px] font-medium text-brand"
          >
            See all deliveries
            <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
          </span>
        </div>
      </div>
    </section>
  )
}
