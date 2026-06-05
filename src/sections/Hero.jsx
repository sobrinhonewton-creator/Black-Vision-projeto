import { useEffect, useRef } from 'react'
import { useInView } from '../hooks/useInView.js'
import useContentStore from '../store/contentStore.js'
import { trackWhatsAppClick, trackPlanView } from '../services/tracking.js'

export default function Hero() {
  const [ref, inView] = useInView({ threshold: 0.05 })
  const bgRef = useRef(null)
  
  const { content } = useContentStore()
  const { heroTitle, heroSubtitle, heroBadge, waNumber, waMsg } = content || {}

  const dynamicWaLink = `https://wa.me/${(waNumber || "").replace(/\D/g, "")}?text=${encodeURIComponent(waMsg || "")}`

  /* Parallax leve — desativado em mobile via CSS (media query) */
  useEffect(() => {
    const bg = bgRef.current
    if (!bg) return

    /* Detecta preferência de movimento */
    const prefersReduced =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    let frame
    const onScroll = () => {
      frame = requestAnimationFrame(() => {
        const y = window.scrollY
        bg.style.transform = `translateY(${y * 0.25}px)`
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <section className="hero" id="home">
      {/* Fundo com parallax */}
      <div
        ref={bgRef}
        className="hero-bg parallax-layer"
        role="presentation"
        aria-hidden="true"
      />

      {/* Gradiente de fade na base */}
      <div className="hero-bg-fade" aria-hidden="true" />

      {/* Glow dourado */}
      <div className="hero-glow" aria-hidden="true" />

      <div className="container">
        <div className="hero-inner" ref={ref}>

          {/* Coluna de texto */}
          <div className="hero-content">
            <div className={`fade-up ${inView ? 'visible' : ''}`}>
              <div className="badge" style={{ marginBottom: '1.75rem' }}>
                <span>⚡</span>
                <span>{heroBadge || 'Sistemas · Automação · Inteligência Artificial'}</span>
              </div>
            </div>

            <h1 className={`fade-up delay-1 ${inView ? 'visible' : ''}`}>
              {heroTitle || 'Transforme seu negócio com tecnologia que gera resultado.'}
            </h1>

            <p
              className={`fade-up delay-2 ${inView ? 'visible' : ''}`}
              style={{
                fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
                maxWidth: '520px',
                marginTop: '1.25rem',
              }}
            >
              {heroSubtitle || 'Construímos sistemas web de alta performance, automatizamos processos operacionais e implementamos IA para empresas que querem crescer de forma consistente e mensurável.'}
            </p>

            <div className={`hero-actions fade-up delay-3 ${inView ? 'visible' : ''}`}>
              <a
                href={dynamicWaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary pulse"
                onClick={() => trackWhatsAppClick()}
              >
                <WaIcon />
                Quero Crescer com IA
              </a>
              <a
                href="#solutions"
                className="btn btn-outline"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById('solutions')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                Ver Soluções →
              </a>
            </div>

            <div className={`hero-stats fade-up delay-4 ${inView ? 'visible' : ''}`}>
              {STATS.map(([num, label]) => (
                <div key={label}>
                  <div className="hero-stat-number">{num}</div>
                  <div className="hero-stat-label">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Coluna visual (desktop only) */}
          <div className={`hero-visual fade-up delay-2 ${inView ? 'visible' : ''}`}>
            <img
              src="/images/img-sistemas.webp"
              alt="Sistema web de alta performance"
              className="hero-visual-img"
              loading="eager"
              width="420"
              height="525"
            />
            <div className="hero-visual-badge glass">
              <div className="hero-visual-badge-dot" />
              <div className="hero-visual-badge-text">
                Projeto em produção
                <span>Entregue em 3 semanas · ROI positivo em 60 dias</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

/* ── Sub-componentes ── */
const STATS = [
  ['150+', 'Projetos entregues'],
  ['98%',  'Clientes satisfeitos'],
  ['3×',   'ROI médio em 90 dias'],
  ['24h',  'Suporte dedicado'],
]

function WaIcon() {
  return (
    <svg width="17" height="17" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
    </svg>
  )
}
