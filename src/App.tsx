import { useCallback, useRef, useState } from 'react'
import { TODAY } from './config'
import { isAvailable, type DeliveryRow } from './data'
import { useRoute } from './router'
import { Navigation } from './components/Navigation'
import { TopBar } from './components/TopBar'
import { FileDrawer } from './components/FileDrawer'
import { Overview } from './pages/Overview'
import { Placeholder } from './pages/Placeholder'

export default function App() {
  const route = useRoute()
  const [navPinned, setNavPinned] = useState(false)
  const [date, setDate] = useState(TODAY)
  const [row, setRow] = useState<DeliveryRow | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  const changeDate = useCallback((iso: string) => {
    if (isAvailable(iso)) setDate(iso)
  }, [])

  const openRow = useCallback((r: DeliveryRow, trigger: HTMLElement) => {
    triggerRef.current = trigger
    setRow(r)
  }, [])

  const closeRow = useCallback(() => {
    setRow(null)
    // Focus returns to the row that opened the drawer.
    window.setTimeout(() => triggerRef.current?.focus(), 0)
  }, [])

  const isOverview = route.path === '/' || route.path === '/overview'

  return (
    <div className="flex min-h-screen w-full">
      <Navigation pinned={navPinned} onTogglePin={() => setNavPinned((o) => !o)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-w-0 flex-1">
          {isOverview ? (
            <Overview date={date} onDateChange={changeDate} onOpenRow={openRow} />
          ) : (
            <Placeholder route={route} />
          )}
        </main>
      </div>
      {row && <FileDrawer row={row} onClose={closeRow} />}
    </div>
  )
}
