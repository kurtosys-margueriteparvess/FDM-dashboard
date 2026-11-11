import { Bell, ChevronRight, CircleHelp, Search } from 'lucide-react'

export function TopBar() {
  return (
    <header className="flex h-[54px] shrink-0 items-center justify-between bg-surface-nav px-[18px] shadow-nav">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-ink-secondary">
        <span>Platform</span>
        <ChevronRight size={14} />
        <span>Data</span>
        <ChevronRight size={14} />
        <span className="font-medium text-brand">Fund Data Management</span>
      </nav>
      <div className="flex items-center gap-4">
        <div className="flex h-9 w-[227px] items-center gap-3 rounded border border-line bg-white px-4 text-[13px] text-[#4a5267]">
          <Search size={20} strokeWidth={1.5} className="text-ink" />
          Search
        </div>
        <CircleHelp size={24} strokeWidth={1.5} className="text-ink-secondary" />
        <div className="relative">
          <Bell size={24} strokeWidth={1.5} className="text-ink-secondary" />
          <span className="absolute -right-[1px] top-0 h-[8px] w-[8px] rounded-full bg-error" />
        </div>
      </div>
    </header>
  )
}
