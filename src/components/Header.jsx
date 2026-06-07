import { useState, useEffect, useCallback, useRef } from 'react'

const WA_LINK =
  'https://wa.me/557381068594?text=Ol%C3%A1!%20Quero%20saber%20mais%20sobre%20os%20servi%C3%A7os%20da%20Black%20Vision.'

const NAV_LINKS = [
  ['Soluções',      'solutions'],
  ['Como Funciona', 'process'],
  ['Planos',        'pricing'],
  ['Resultados',    'testimonials'],
  ['Contato',       'contact'],
]

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const tickingRef = useRef(false)

  /* Scroll handler com rAF — sem jank */
  const handleScroll = useCallback(() => {
    if (!tickingRef.current) {
      window.requestAnimationFrame(() => {
        setScrolled(window.scrollY > 40)
        const documentHeight = document.documentElement.scrollHeight - window.innerHeight
        const progress = documentHeight > 0 ? (window.scrollY / documentHeight) * 100 : 0
        setScrollProgress(Math.max(0, Math.min(100, progress)))
        tickingRef.current = false
      })
      tickingRef.current = true
    }
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  /* Bloqueia scroll do body quando menu aberto */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const scrollTo = (id) => {
    setMenuOpen(false)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToTop = () => {
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <header className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-progress" style={{ width: `${scrollProgress}%` }} aria-hidden="true" />
        <div className="container">
          <nav className="nav-inner">
            {/* Logo */}
            <a href="#" className="nav-logo" onClick={(e) => { e.preventDefault(); scrollToTop() }}>
              <span className="shimmer">Black Vision</span>
            </a>

            {/* Desktop links */}
            <ul className="nav-links">
              {NAV_LINKS.map(([label, id]) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={(e) => { e.preventDefault(); scrollTo(id) }}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* CTA desktop */}
              <div className="nav-cta">
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
                  </svg>
                  WhatsApp
                </a>
              </div>

              {/* Hamburger */}
              <button
                className={`nav-burger ${menuOpen ? 'open' : ''}`}
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
                aria-expanded={menuOpen}
              >
                <span />
                <span />
                <span />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile drawer */}
      <nav className={`nav-mobile ${menuOpen ? 'open' : ''}`} aria-hidden={!menuOpen}>
        {NAV_LINKS.map(([label, id]) => (
          <a
            key={id}
            href={`#${id}`}
            onClick={(e) => { e.preventDefault(); scrollTo(id) }}
          >
            {label}
          </a>
        ))}
        <a
          href={WA_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
          style={{ marginTop: '1rem' }}
        >
          Falar no WhatsApp
        </a>
      </nav>
    </>
  )
}
