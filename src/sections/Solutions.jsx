import { useRef } from 'react'
import { trackCardClick } from "../services/tracking.js";
import { useInView } from '../hooks/useInView.js'
import useContentStore from '../store/contentStore.js'

const FALLBACK_IMAGES = [
  '/images/img-web.webp',
  '/images/img-automacao.webp',
  '/images/img-sistemas.webp'
]

export default function Solutions() {
  const [ref, inView] = useInView()
  const { content } = useContentStore()
  const cards = content?.cards?.filter(c => c.active) || []
  const tiltFrame = useRef(null)

  const handleTiltMove = (event) => {
    if (window.matchMedia('(max-width: 767px), (prefers-reduced-motion: reduce)').matches) return
    const card = event.currentTarget
    const rect = card.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    const rotateX = (y - 0.5) * 14
    const rotateY = (x - 0.5) * -14
    const moveX = (x - 0.5) * 12
    const moveY = (y - 0.5) * 12
    const content = card.querySelector('.solution-card-content')
    const bg = card.querySelector('.solution-card-bg')

    if (tiltFrame.current) window.cancelAnimationFrame(tiltFrame.current)
    tiltFrame.current = window.requestAnimationFrame(() => {
      card.style.transform = `perspective(950px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
      if (bg) bg.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.06)`
      if (content) content.style.transform = `translate(${moveX * 0.45}px, ${moveY * 0.45}px)`
    })
  }

  const handleTiltLeave = (event) => {
    const card = event.currentTarget
    const content = card.querySelector('.solution-card-content')
    const bg = card.querySelector('.solution-card-bg')
    if (tiltFrame.current) {
      window.cancelAnimationFrame(tiltFrame.current)
      tiltFrame.current = null
    }
    card.style.transform = ''
    if (bg) bg.style.transform = ''
    if (content) content.style.transform = ''
  }

  return (
    <section id="solutions">
      <div className="divider" />
      <div className="container" ref={ref} style={{ paddingTop: 'clamp(3.5rem, 9vw, 7rem)', paddingBottom: 'clamp(3.5rem, 9vw, 7rem)' }}>

        {/* Cabeçalho */}
        <div className={`fade-up ${inView ? 'visible' : ''}`} style={{ maxWidth: '560px' }}>
          <div className="section-label">Nossas Soluções</div>
          <h2>
            Tecnologia que{' '}
            <span className="gold-text">impulsiona resultados.</span>
          </h2>
          <p style={{ marginTop: '1rem' }}>
            Do sistema web ao agente de IA, entregamos soluções completas que conectam
            tecnologia ao crescimento real do seu negócio.
          </p>
        </div>

        {/* Grid de cards com imagem */}
        <div className="solutions-grid">
          {cards.map((s, i) => (
            <div
              key={s.tag || i}
              className={`solution-card fade-up delay-${i + 1} ${inView ? 'visible' : ''}`}
              onMouseMove={handleTiltMove}
              onMouseLeave={handleTiltLeave}
              onClick={() => trackCardClick()}
            >
              {/* Imagem de fundo */}
              <div
                className="solution-card-bg"
                style={{ backgroundImage: `url('${FALLBACK_IMAGES[i % FALLBACK_IMAGES.length]}')` }}
                role="presentation"
                aria-hidden="true"
              />

              {/* Overlay */}
              <div className="solution-card-overlay" aria-hidden="true" />

              {/* Conteúdo */}
              <div className="solution-card-content">
                <div className="solution-icon">{s.icon}</div>
                <div className="solution-tag">{s.tag}</div>
                <div className="solution-title">{s.title}</div>
                <p className="solution-desc">{s.desc}</p>
                <ul className="solution-features">
                  {(s.features || []).map((f) => (
                    <li key={f}>
                      <span className="check">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
