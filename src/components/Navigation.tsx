import { useState } from 'react'
import {
  Bookmark,
  ChartLine,
  Heart,
  Inbox,
  Languages,
  Library,
  MessageSquare,
  PanelsTopLeft,
  Send,
  Shapes,
  Table,
  Users,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ClipboardList,
  Circle,
  Database,
  FileText,
  Globe,
  LayoutGrid,
  MonitorPlay,
  Network,
  Pin,
  PinOff,
  Settings,
  Upload,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NAV_ITEMS, type NavItem } from '../config'
import { LogoMark, LogoWordmark } from './Logo'

const ICONS: Record<string, LucideIcon> = {
  Bookmark,
  ChartLine,
  Heart,
  Inbox,
  Languages,
  Library,
  MessageSquare,
  PanelsTopLeft,
  Send,
  Shapes,
  Table,
  Users,
  LayoutGrid,
  Globe,
  FileText,
  MonitorPlay,
  Network,
  Circle,
  Database,
  Upload,
  Settings,
}

function NavRow({ item }: { item: NavItem }) {
  if (item.heading) {
    return (
      <div className="pl-[33px] pt-3 pb-1 text-[14px] text-ink-secondary" role="presentation">
        {item.label}
      </div>
    )
  }
  const Icon = ICONS[item.icon] ?? Circle
  const indent = item.level === 0 ? 'pl-[12px]' : item.level === 1 ? 'pl-[24px]' : 'pl-[50px]'
  const tone =
    item.state === 'active'
      ? 'bg-[#e4edfd] text-brand'
      : item.state === 'active-parent' || item.state === 'parent'
        ? 'bg-[#e4edfd] text-brand'
        : 'text-ink'
  const content = (
    <>
      <Icon size={20} strokeWidth={1.6} className={item.icon === 'Circle' ? 'text-ink-secondary' : ''} />
      <span className="flex-1 text-left text-[16px]">{item.label}</span>
      {item.chevron === 'down' && <ChevronDown size={18} strokeWidth={1.6} className="mr-3" />}
      {item.chevron === 'up' && <ChevronUp size={18} strokeWidth={1.6} className="mr-3" />}
    </>
  )
  const cls = `flex h-10 w-full items-center gap-3 rounded-[6px] ${indent} ${tone}`
  if (item.enabled && item.route) {
    return (
      <a href={`#${item.route}`} className={`${cls} hover:bg-surface-subtle`}>
        {content}
      </a>
    )
  }
  // Visible but not clickable: no hover effect, no pointer cursor.
  return (
    <div className={cls} aria-disabled="true" role="link" tabIndex={-1}>
      {content}
    </div>
  )
}

export function Navigation({ pinned, onTogglePin }: { pinned: boolean; onTogglePin: () => void }) {
  const [hover, setHover] = useState(false)
  const [focus, setFocus] = useState(false)
  // Pinned: always open and pushes the content. Unpinned: opens over the content while hovered.
  const open = pinned || hover || focus
  return (
    <div
      className="relative z-20 shrink-0 transition-[width] duration-200"
      style={{ width: pinned ? 312 : 67 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={(e) => setFocus(e.target.matches(':focus-visible'))}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocus(false)
      }}
    >
      <nav
        aria-label="Main"
        data-testid="nav"
        data-open={open}
        className={`absolute inset-y-0 left-0 flex flex-col overflow-y-auto overflow-x-hidden border-r border-line-subtle bg-surface-nav transition-[width,box-shadow] duration-200 ${open && !pinned ? 'shadow-[4px_0_16px_#0000001f]' : ''}`}
        style={{ width: open ? 312 : 67 }}
      >
        {open ? (
          <div className="flex h-full min-h-screen w-[312px] flex-col px-4 pb-6">
            <div className="flex h-[54px] items-center justify-between pl-2">
              <LogoWordmark />
              <button
                type="button"
                onClick={onTogglePin}
                aria-label={pinned ? 'Unpin navigation' : 'Pin navigation'}
                aria-pressed={pinned}
                title={pinned ? 'Unpin navigation' : 'Pin navigation open'}
                className={`flex h-8 w-8 items-center justify-center rounded hover:bg-surface-subtle ${pinned ? 'bg-[#e4edfd] text-brand' : 'text-ink-secondary'}`}
              >
                {pinned ? <PinOff size={18} strokeWidth={1.6} /> : <Pin size={18} strokeWidth={1.6} />}
              </button>
            </div>
            <div
              className="mt-2 flex h-14 items-center justify-between rounded-lg border border-line-subtle bg-white px-4 shadow-nav"
              aria-disabled="true"
            >
              <div>
                <div className="text-[10px] uppercase tracking-wide text-ink-secondary">Workspace</div>
                <div className="flex items-center gap-2 text-[14px] text-ink">
                  Demo workspace
                  <span className="rounded-full bg-[#e4edfd] px-2 py-[1px] text-[11px] text-brand">Staging</span>
                </div>
              </div>
              <ChevronsUpDown size={16} className="text-ink-secondary" />
            </div>
            <ul className="mt-4 flex flex-col gap-[2px]">
              {NAV_ITEMS.map((item) => (
                <li key={item.id}>
                  <NavRow item={item} />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex h-full min-h-screen w-[67px] flex-col items-center">
            <div className="flex h-[54px] items-center justify-center">
              <LogoMark size={26} />
            </div>
            <button
              type="button"
              aria-label="Open navigation"
              className="mt-2 flex h-[46px] w-[40px] items-center justify-center rounded-lg border border-line-subtle bg-white text-ink shadow-nav"
            >
              <ChevronsUpDown size={18} strokeWidth={1.6} />
            </button>
            <ul className="mt-6 flex flex-col items-center gap-[18px] text-ink-secondary" aria-hidden="true">
              {[LayoutGrid, Globe, FileText, MonitorPlay, Network, ClipboardList, Settings].map((Icon, i) => (
                <li key={i} className="flex h-[22px] w-[22px] items-center justify-center">
                  <Icon size={21} strokeWidth={1.5} />
                </li>
              ))}
            </ul>
            <div className="mt-auto mb-6 flex h-8 w-8 items-center justify-center rounded-full bg-brand text-[14px] font-medium text-white">
              S
            </div>
          </div>
        )}
      </nav>
    </div>
  )
}
