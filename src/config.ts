import type { ReactNode } from 'react'

/**
 * "Today" for the whole prototype. Everything derives from this one constant.
 * It is early morning on this day: files are received and scheduled, nothing has
 * been sent or checked yet. Any day of the week works, but avoid a Sunday (nothing runs on Sundays).
 */
export const TODAY = '2026-08-14' // Friday

/** How many days before today have data. Older dates are blocked in the date picker. */
export const DATA_HORIZON_DAYS = 16

/** Number of days shown on the graph, ending today. */
export const GRAPH_DAYS = 13

/** "Last refreshed" time on the early-morning day. */
export const LAST_REFRESHED_MORNING = '08:25'
/** "Last refreshed" time on every other day. */
export const LAST_REFRESHED_PAST = '12:25'

/** Accuracy target shown on the Assurance card. */
export const ACCURACY_TARGET = 97

/** The asset manager shown in the header. Invented. */
export const ASSET_MANAGER = 'Harlow Asset Management'

/**
 * When true, figure tiles on the Overview open the matching placeholder page.
 * Set to false to make the tiles do nothing.
 */
export const TILES_NAVIGATE = false

export type NavItem = {
  id: string
  label: string
  /** Name of a lucide icon, resolved in SideNav.tsx */
  icon: string
  /** Hash route, e.g. '/deliveries'. Omit for items that go nowhere. */
  route?: string
  /** false = visible but not clickable (no hover, no pointer cursor, aria-disabled) */
  enabled: boolean
  /** Indent level in the expanded navigation */
  level: 0 | 1 | 2 | 3
  /** Shows a chevron, as in the Figma. Purely visual: groups are not collapsible in this prototype. */
  chevron?: 'up' | 'down'
  /** Visual state for the current page or its parents */
  state?: 'parent' | 'active-parent' | 'active'
  /** Small grey section label instead of an item */
  heading?: boolean
}

/**
 * Side navigation, as in the Figma frame "Dashboard - side nav open".
 * Edit labels, icons, order and `enabled` here. All items are visible but
 * not clickable for this test (the menu opens on hover and can be pinned).
 *
 * [MENU ITEMS: to be clarified. Replace or extend the entries below.]
 */
export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboards', label: 'Dashboards', icon: 'LayoutGrid', enabled: false, level: 0, chevron: 'down' },
  { id: 'dxm', label: 'DXM', icon: 'Globe', enabled: false, level: 0, chevron: 'down' },
  { id: 'documents', label: 'Documents', icon: 'FileText', enabled: false, level: 0, chevron: 'down' },
  { id: 'studio', label: 'Studio', icon: 'MonitorPlay', enabled: false, level: 0, chevron: 'down' },
  { id: 'data', label: 'Data', icon: 'Network', enabled: false, level: 0, chevron: 'up', state: 'parent' },
  { id: 'data-hub', label: 'Data hub', icon: '', enabled: false, level: 1, heading: true },
  { id: 'data-data', label: 'Data', icon: 'ChartLine', enabled: false, level: 1 },
  { id: 'disclaimers', label: 'Disclaimers', icon: 'FileText', enabled: false, level: 1 },
  { id: 'commentaries', label: 'Commentaries', icon: 'MessageSquare', enabled: false, level: 1 },
  { id: 'translations', label: 'Translations', icon: 'Languages', enabled: false, level: 1 },
  { id: 'segmentation', label: 'Segmentation', icon: 'Table', enabled: false, level: 1 },
  { id: 'fund-managers', label: 'Fund Managers', icon: 'Users', enabled: false, level: 1 },
  { id: 'health-check', label: 'Health Check', icon: 'Heart', enabled: false, level: 1 },
  { id: 'datasets-hub', label: 'Datasets', icon: 'Database', enabled: false, level: 1 },
  { id: 'tools-gallery', label: 'Tools Gallery', icon: 'Shapes', enabled: false, level: 1 },
  { id: 'layouts', label: 'Layouts', icon: 'PanelsTopLeft', enabled: false, level: 1 },
  { id: 'fda', label: 'Fund Data Assurance', icon: 'Network', enabled: false, level: 1, chevron: 'up', state: 'active-parent' },
  { id: 'overview', label: 'Overview', icon: 'Globe', route: '/', enabled: false, level: 2, state: 'active' },
  { id: 'files-received', label: 'Files received', icon: 'Inbox', route: '/files-received', enabled: false, level: 2 },
  { id: 'deliveries', label: 'Deliveries', icon: 'Send', route: '/deliveries', enabled: false, level: 2 },
  { id: 'destinations', label: 'Destinations', icon: 'Network', enabled: false, level: 2 },
  { id: 'fund-explorer', label: 'Fund explorer', icon: 'Library', enabled: false, level: 2 },
  { id: 'user-guide', label: 'User guide', icon: 'Bookmark', enabled: false, level: 2 },
  { id: 'datasets', label: 'Datasets', icon: 'Database', enabled: false, level: 1 },
  { id: 'data-loader', label: 'Data Loader', icon: 'Upload', enabled: false, level: 1 },
  { id: 'system-admin', label: 'System Administration', icon: 'Settings', enabled: false, level: 0, chevron: 'down' },
]

export type IconRenderer = (name: string, size?: number) => ReactNode
