import { useEffect } from 'react'
import type { Tema } from '../domain/tipos'

/** Aplica el tema en <html data-theme>. «auto» deja que mande el sistema. */
export function useTema(tema: Tema) {
  useEffect(() => {
    const raiz = document.documentElement
    if (tema === 'auto') raiz.removeAttribute('data-theme')
    else raiz.setAttribute('data-theme', tema === 'oscuro' ? 'dark' : 'light')
    const oscuro =
      tema === 'oscuro' || (tema === 'auto' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', oscuro ? '#15120E' : '#F5F1E6')
  }, [tema])
}
