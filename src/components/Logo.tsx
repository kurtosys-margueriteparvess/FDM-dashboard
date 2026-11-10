// Neutral placeholder mark and wordmark, drawn as SVG.
export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="5" fill="#0342e4" />
      <rect x="5.5" y="12" width="3" height="6.5" rx="1" fill="#fff" />
      <rect x="10.5" y="8" width="3" height="10.5" rx="1" fill="#fff" />
      <rect x="15.5" y="5" width="3" height="13.5" rx="1" fill="#fff" />
    </svg>
  )
}

export function LogoWordmark() {
  return (
    <span className="flex items-center gap-2">
      <LogoMark size={24} />
      <span className="text-[20px] font-bold tracking-tight text-brand">DATA ASSURANCE</span>
    </span>
  )
}
