import { useEffect, useState } from 'react'

// Minimal hash router: works from any plain static host or from a file.
export type Route = { path: string; params: URLSearchParams }

function parse(): Route {
  const raw = window.location.hash.replace(/^#/, '') || '/'
  const [path, query = ''] = raw.split('?')
  return { path: path || '/', params: new URLSearchParams(query) }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(parse)
  useEffect(() => {
    const on = () => setRoute(parse())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}

export function go(path: string, params?: Record<string, string>) {
  const q = params && Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : ''
  window.location.hash = `#${path}${q}`
}
