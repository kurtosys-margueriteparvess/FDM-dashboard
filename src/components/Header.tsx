import { RefreshCw } from 'lucide-react'
import { ASSET_MANAGER, LAST_REFRESHED_MORNING, LAST_REFRESHED_PAST } from '../config'
import { DatePicker } from './DatePicker'

export function PageHeader({
  title,
  date,
  isToday,
  onDateChange,
}: {
  title: string
  date: string
  isToday: boolean
  onDateChange: (iso: string) => void
}) {
  return (
    <div className="box-border flex h-[116px] items-start justify-between px-6 pt-6">
      <h1 className="m-0 text-[24px] font-medium leading-8 text-ink">{title}</h1>
      <div className="flex flex-col items-end gap-3">
        <div className="flex items-center gap-2 text-[15px] text-ink-secondary">
          <span>Last refreshed at {isToday ? LAST_REFRESHED_MORNING : LAST_REFRESHED_PAST}</span>
          <RefreshCw size={20} strokeWidth={1.5} aria-hidden="true" />
        </div>
        <div className="flex items-center gap-8 text-[15px]">
          <div className="text-ink-secondary">
            Asset Manager <span className="ml-1 font-semibold text-ink">{ASSET_MANAGER}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-ink-secondary">Working date</span>
            <DatePicker value={date} onChange={onDateChange} />
          </div>
        </div>
      </div>
    </div>
  )
}
