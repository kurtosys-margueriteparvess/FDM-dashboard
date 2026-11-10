import { ArrowDown, ArrowUp, Check, ChevronRight, ClipboardList, Inbox, Minus, Send } from 'lucide-react'
import type { ReactNode } from 'react'
import { ACCURACY_TARGET, TILES_NAVIGATE } from '../config'
import { go } from '../router'
import type { DayData } from '../data'

type Tile = {
  label: string
  value: number
  /** page the tile opens, with a filter passed in the URL for later */
  page: '/files-received' | '/deliveries' | '/golden-source'
  filter: string
  /** red text when the value is above zero (Rejected, Failed, Mismatched) */
  alert?: boolean
}

function TileButton({
  tile,
  date,
  main,
}: {
  tile: Tile
  date: string
  main?: boolean
}) {
  const danger = tile.alert && tile.value > 0
  const body = (
    <>
      <span className="flex items-baseline gap-3">
        <span
          className={`${main ? 'text-[24px] font-medium' : 'text-[16px] font-medium'} ${danger ? 'text-error' : 'text-ink'}`}
          data-testid={`figure-${tile.filter}`}
        >
          {tile.value.toLocaleString()}
        </span>
        <span className={`text-[16px] ${danger ? 'text-error' : main ? 'text-ink' : 'text-ink-secondary'}`}>{tile.label}</span>
      </span>
      <ChevronRight size={20} strokeWidth={1.6} className="text-brand" aria-hidden="true" />
    </>
  )
  const cls = [
    'flex w-full items-center justify-between rounded-lg border px-4 text-left',
    main ? 'h-16 border-line bg-white' : 'h-10 border-line-subtle bg-surface-subtle',
  ].join(' ')
  if (!TILES_NAVIGATE) {
    return (
      <div className={cls} aria-disabled="true">
        {body}
      </div>
    )
  }
  return (
    <button
      type="button"
      className={`${cls} hover:border-line-strong hover:shadow-[0_1px_4px_#0000001f]`}
      onClick={() => go(tile.page, { date, filter: tile.filter })}
      aria-label={`${tile.label}: ${tile.value}. Open details`}
    >
      {body}
    </button>
  )
}

function Column({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col px-4 pb-4" aria-label={title}>
      <h2 className="m-0 mb-4 flex h-6 items-center gap-2 text-[16px] font-semibold leading-6 text-ink">
        <span className="text-brand">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

export function Figures({ day }: { day: DayData }) {
  const d = day.date
  const r = day.received
  const s = day.sent
  const c = day.checks
  return (
    <div className="figures-card mx-4 mb-4 rounded-2xl border border-line bg-white pt-4 shadow-card" data-testid="figures">
      <div className="figures-grid">
        <Column icon={<Inbox size={20} strokeWidth={1.6} />} title="Files received">
          <div className="flex flex-col gap-3">
            <TileButton main date={d} tile={{ label: 'Received', value: r.total, page: '/files-received', filter: 'received' }} />
            <TileButton date={d} tile={{ label: 'Not processed', value: r.notProcessed, page: '/files-received', filter: 'not-processed' }} />
            <TileButton date={d} tile={{ label: 'Rejected', value: r.rejected, page: '/files-received', filter: 'rejected', alert: true }} />
            <TileButton date={d} tile={{ label: 'Processed', value: r.processed, page: '/files-received', filter: 'processed' }} />
          </div>
        </Column>
        <Column icon={<Send size={20} strokeWidth={1.6} />} title="Files sent">
          <div className="flex flex-col gap-3">
            <TileButton main date={d} tile={{ label: 'Owed', value: s.owed, page: '/deliveries', filter: 'owed' }} />
            <TileButton date={d} tile={{ label: 'Scheduled', value: s.scheduled, page: '/deliveries', filter: 'scheduled' }} />
            <TileButton date={d} tile={{ label: 'Failed', value: s.failed, page: '/deliveries', filter: 'failed', alert: true }} />
            <TileButton date={d} tile={{ label: 'Files delivered', value: s.delivered, page: '/deliveries', filter: 'delivered' }} />
          </div>
        </Column>
        <Column icon={<ClipboardList size={20} strokeWidth={1.6} />} title="Published files checked*">
          <div className="flex flex-col gap-3">
            <TileButton main date={d} tile={{ label: 'Checked', value: c.checked, page: '/golden-source', filter: 'checked' }} />
            <TileButton date={d} tile={{ label: 'Mismatched', value: c.mismatched, page: '/golden-source', filter: 'mismatched', alert: true }} />
            <TileButton date={d} tile={{ label: 'Matched', value: c.matched, page: '/golden-source', filter: 'matched' }} />
          </div>
          <p className="m-0 mt-3 text-[11px] leading-4 text-ink-secondary">
            *Not all files are reviewed post-publication. These figures represent the files for which we receive feedback from the destination.
          </p>
        </Column>
        <Column icon={<Check size={20} strokeWidth={1.6} />} title="Assurance">
          <AssuranceCard day={day} />
          <p className="m-0 mt-3 text-[11px] leading-4 text-ink-secondary">
            **Accuracy is calculated on the files that are checked post-publication.
          </p>
        </Column>
      </div>
    </div>
  )
}

function AssuranceCard({ day }: { day: DayData }) {
  const acc = day.accuracy
  const delta = day.weeklyDelta
  return (
    <div className="flex min-h-[172px] flex-col rounded-lg border border-line bg-white p-4" data-testid="assurance">
      <div className="text-[11px] leading-3 text-ink">Target: {ACCURACY_TARGET}%</div>
      {acc === null ? (
        <>
          <div className="mt-3 text-[40px] font-medium leading-[48px] text-success" aria-hidden="true">
            %
          </div>
          <p className="m-0 mt-1 text-[15px] leading-[22px] text-ink" data-testid="accuracy-placeholder">
            Accuracy will appear here once today&rsquo;s checks are done.**
          </p>
        </>
      ) : (
        <>
          <div className="mt-3 text-[40px] font-medium leading-[48px] text-success" data-testid="accuracy">
            {acc}%
          </div>
          <div className="text-[16px] leading-6 text-ink">Accuracy**</div>
          {delta !== null && (
            <span
              className={[
                'mt-3 inline-flex w-fit items-center gap-1 rounded-full px-2 py-1 text-[11px] leading-4',
                delta > 0 ? 'bg-success-bg text-success' : delta < 0 ? 'bg-surface-subtle text-ink' : 'bg-surface-subtle text-ink',
              ].join(' ')}
              data-testid="weekly-delta"
            >
              {delta > 0 ? <ArrowUp size={12} /> : delta < 0 ? <ArrowDown size={12} /> : <Minus size={12} />}
              {`${Math.abs(delta)}% in the last week`}
            </span>
          )}
        </>
      )}
    </div>
  )
}
