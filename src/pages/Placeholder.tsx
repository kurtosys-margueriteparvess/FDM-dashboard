import { ArrowLeft } from 'lucide-react'
import { fmtShort } from '../dates'
import { isAvailable } from '../data'
import type { Route } from '../router'

const TITLES: Record<string, string> = {
  '/deliveries': 'Deliveries',
  '/files-received': 'Files received',
  '/golden-source': 'Golden source',
}

/**
 * Placeholder page in the same shell. Each page is a separate area to be designed later.
 * The date and filter passed from the Overview tile arrive in the URL.
 */
export function Placeholder({ route }: { route: Route }) {
  const title = TITLES[route.path] ?? 'Page'
  const date = route.params.get('date')
  const filter = route.params.get('filter')
  return (
    <div className="px-6 pb-10 pt-6" data-testid="placeholder-page">
      <a href="#/" className="mb-4 inline-flex items-center gap-2 text-[14px] font-medium text-brand hover:underline">
        <ArrowLeft size={16} aria-hidden="true" /> Back to Overview
      </a>
      <h1 className="m-0 text-[24px] font-medium leading-8 text-ink">{title}</h1>
      {(date || filter) && (
        <p className="m-0 mt-2 text-[15px] text-ink-secondary" data-testid="placeholder-context">
          {date && isAvailable(date) ? fmtShort(date) : ''}
          {date && filter ? ' · ' : ''}
          {filter ? `Filter: ${filter}` : ''}
        </p>
      )}
      <div className="mt-6 flex h-[420px] items-center justify-center rounded-2xl border border-dashed border-line-strong bg-surface-nav text-[15px] text-ink-secondary">
        This page is a placeholder. It will be designed later.
      </div>
    </div>
  )
}
