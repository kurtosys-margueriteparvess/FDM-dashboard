import { ChevronRight, ClipboardList, Inbox, Send } from 'lucide-react'
import type { ReactNode } from 'react'
import { TILES_NAVIGATE } from '../config'
import { go } from '../router'
import type { DayData } from '../data'

type Tile = {
  label: string
  value: number
  /** the whole the value is out of, shown greyed after it (main tiles only) */
  of?: number
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
        {tile.of !== undefined && (
          <span className="-ml-2 text-[24px] font-medium text-[#b4bacb]" data-testid={`figure-${tile.filter}-of`}>
            /{tile.of.toLocaleString()}
          </span>
        )}
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
    <section className="flex min-w-0 flex-col px-4" aria-label={title}>
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
  const past = day.phase === 'past'
  const acc = day.accuracy
  const hasAccuracy = acc.static !== null && acc.dynamic !== null
  return (
    <div className="figures-card mx-4 mb-4 rounded-2xl border border-line bg-white py-4 shadow-card" data-testid="figures">
      <div className="figures-grid">
        <Column icon={<Inbox size={20} strokeWidth={1.6} />} title="Files received">
          <div className="flex flex-col gap-3">
            <TileButton main date={d} tile={{ label: 'Processed', value: r.processed, of: r.total, page: '/files-received', filter: 'processed' }} />
            <TileButton date={d} tile={{ label: 'Not processed', value: r.notProcessed, page: '/files-received', filter: 'not-processed' }} />
            {past ? (
              <TileButton date={d} tile={{ label: 'Rejected resolved', value: r.rejectedResolved, page: '/files-received', filter: 'rejected-resolved' }} />
            ) : (
              <TileButton date={d} tile={{ label: 'Rejected', value: r.rejected, page: '/files-received', filter: 'rejected', alert: true }} />
            )}
          </div>
        </Column>
        <Column icon={<Send size={20} strokeWidth={1.6} />} title="Files sent">
          <div className="flex flex-col gap-3">
            <TileButton main date={d} tile={{ label: 'Delivered', value: s.delivered, of: s.owed, page: '/deliveries', filter: 'delivered' }} />
            {past ? (
              <>
                <TileButton date={d} tile={{ label: 'Not delivered', value: s.notDelivered, page: '/deliveries', filter: 'not-delivered' }} />
                <TileButton date={d} tile={{ label: 'Failures resolved', value: s.failuresResolved, page: '/deliveries', filter: 'failures-resolved' }} />
              </>
            ) : (
              <>
                <TileButton date={d} tile={{ label: 'Scheduled', value: s.scheduled, page: '/deliveries', filter: 'scheduled' }} />
                <TileButton date={d} tile={{ label: 'Failed', value: s.failed, page: '/deliveries', filter: 'failed', alert: true }} />
              </>
            )}
          </div>
        </Column>
        <Column icon={<ClipboardList size={20} strokeWidth={1.6} />} title="Published files checked*">
          <div className="checked-body">
            <div className="flex min-w-0 flex-col">
              <div className="flex flex-col gap-3">
                <TileButton main date={d} tile={{ label: 'Checked', value: c.checked, of: c.checkable, page: '/golden-source', filter: 'checked' }} />
                {past ? (
                  <TileButton date={d} tile={{ label: 'Mismatches resolved', value: c.mismatchesResolved, page: '/golden-source', filter: 'mismatches-resolved' }} />
                ) : (
                  <>
                    <TileButton date={d} tile={{ label: 'Mismatched', value: c.mismatched, page: '/golden-source', filter: 'mismatched', alert: true }} />
                    <TileButton date={d} tile={{ label: 'Matched', value: c.matched, page: '/golden-source', filter: 'matched' }} />
                  </>
                )}
              </div>
              <p className="m-0 mt-3 text-[11px] leading-4 text-ink-secondary">
                *Not all files are reviewed post-publication. These figures represent the files for which we receive feedback from the destination.
              </p>
            </div>
            <div className="flex min-w-0 flex-col">
              {hasAccuracy ? (
                <div className="grid grid-cols-2 gap-3" data-testid="assurance">
                  <AccuracyCard label="Static data" value={acc.static!} testid="accuracy-static" />
                  <AccuracyCard label="Dynamic data" value={acc.dynamic!} testid="accuracy-dynamic" />
                </div>
              ) : (
                <div className="flex min-h-[168px] flex-col rounded-lg border border-line bg-white p-4" data-testid="assurance">
                  <div className="text-[40px] font-medium leading-[48px] text-success" aria-hidden="true">
                    %
                  </div>
                  <p className="m-0 mt-1 text-[15px] leading-[22px] text-ink" data-testid="accuracy-placeholder">
                    {day.isToday
                      ? 'Accuracy for static and dynamic data will appear here once today\u2019s checks are done.**'
                      : 'There is no accuracy to show for this day.**'}
                  </p>
                </div>
              )}
              <p className="m-0 mt-3 text-[11px] leading-4 text-ink-secondary">
                **Accuracy is calculated on the values that are checked post-publication.
              </p>
            </div>
          </div>
        </Column>
      </div>
    </div>
  )
}

function AccuracyCard({ label, value, testid }: { label: string; value: number; testid: string }) {
  return (
    <div className="flex min-h-[168px] min-w-0 flex-col rounded-lg border border-line bg-white p-4">
      <div className="text-[13px] leading-4 text-ink">{label}</div>
      <div className="mt-4 text-[40px] font-medium leading-[48px] text-success" data-testid={testid}>
        {value}%
      </div>
      <div className="text-[14px] leading-6 text-ink">Accuracy**</div>
    </div>
  )
}
