import { useState } from 'react'
import { PageHeader } from '../components/Header'
import { FailureBanner } from '../components/Banner'
import { Figures } from '../components/Figures'
import { Graph } from '../components/Graph'
import { DeliveriesTable } from '../components/DeliveriesTable'
import { getDay, type DeliveryRow } from '../data'

export function Overview({
  date,
  onDateChange,
  onOpenRow,
}: {
  date: string
  onDateChange: (iso: string) => void
  onOpenRow: (row: DeliveryRow, trigger: HTMLElement) => void
}) {
  const day = getDay(date)
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({})
  const showBanner = day.banner && !dismissed[date]
  return (
    <div className="pb-6" data-testid="overview" data-date={date}>
      <PageHeader title="Overview" date={date} isToday={day.isToday} onDateChange={onDateChange} />
      {showBanner && day.banner && (
        <FailureBanner banner={day.banner} onDismiss={() => setDismissed((d) => ({ ...d, [date]: true }))} />
      )}
      <Figures day={day} />
      <Graph selectedDate={date} onSelect={onDateChange} />
      <DeliveriesTable rows={day.rows} isSunday={day.isSunday} onOpen={onOpenRow} />
    </div>
  )
}
