import { TriangleAlert, X } from 'lucide-react'
import type { Banner as BannerData } from '../data'

export function FailureBanner({ banner, onDismiss }: { banner: BannerData; onDismiss: () => void }) {
  const noun = banner.count === 1 ? 'delivery' : 'deliveries'
  return (
    <div
      role="alert"
      className="relative mx-4 mb-4 rounded-lg border border-error-border bg-error-bg px-4 py-4"
      data-testid="banner"
    >
      <div className="flex items-start gap-3">
        <TriangleAlert size={18} strokeWidth={1.6} className="mt-[3px] shrink-0 text-error-strong" aria-hidden="true" />
        <div className="flex flex-col gap-2">
          <div className="text-[18px] font-semibold leading-6 text-error-strong">
            One destination is failing: {banner.count} {noun} to {banner.destination}
          </div>
          <div className="text-[15px] leading-6 text-ink">
            <span className="font-medium">Cause:</span> {banner.cause}
          </div>
          <div className="text-[15px] leading-6 text-ink">We are already on it.</div>
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss alert"
        className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded text-ink"
      >
        <X size={16} />
      </button>
    </div>
  )
}
