import { useInView } from '../hooks/useInView.js'
import useContentStore from '../store/contentStore.js'
import { trackWhatsAppClick } from '../services/tracking.js'

export default function Hero() {
  const [ref, inView] = useInView({ threshold: 0.05 })
  const { content } = useContentStore()
  const { heroTitle, heroSubtitle, heroBadge, waNumber, waMsg } = content || {}
  const waLink = `https://wa.me/${(waNumber || '').replace(/\D/g, '')}?text=${encodeURIComponent(waMsg || '')}`

  return (
    <section className="hero hero-rebrand" id="home" ref={ref}>
      <div className="hero-grid" aria-hidden="true" />
      <div className="vision-core" aria-hidden="true">
        <div className="vision-core__halo vision-core__halo--one" />
        <div className="vision-core__halo vision-core__halo--two" />
        <div className="vision-core__iris"><span>BV</span></div>
      </div>

      <div className="container hero-stage">
        <div className={`hero-kicker fade-up ${inView ? 'visible' : ''}`}>
          <span className="hero-kicker__dot" />
          {heroBadge || 'Sistemas · Automação · Inteligência Artificial'}
        </div>

        <h1 className={`hero-display fade-up delay-1 ${inView ? 'visible' : ''}`}>
          {heroTitle || 'Transforme seu negócio com tecnologia que gera resultado.'}
        </h1>

        <p className={`hero-lead fade-up delay-2 ${inView ? 'visible' : ''}`}>
          {heroSubtitle || 'Construímos sistemas, automações e inteligência aplicada para empresas que querem operar melhor e crescer com previsibilidade.'}
        </p>

        <div className={`hero-actions hero-actions--center fade-up delay-3 ${inView ? 'visible' : ''}`}>
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary hero-primary" onClick={trackWhatsAppClick}>
            Construir meu próximo nível <ArrowIcon />
          </a>
          <a href="#solutions" className="btn btn-outline" onClick={(event) => { event.preventDefault(); document.getElementById('solutions')?.scrollIntoView({ behavior: 'smooth' }) }}>
            Explorar soluções
          </a>
        </div>

        <div className={`hero-proof fade-up delay-4 ${inView ? 'visible' : ''}`}>
          <div className="hero-proof__signal"><span /> Operação digital ativa</div>
          {STATS.map(([value, label]) => <div className="hero-proof__metric" key={label}><strong>{value}</strong><span>{label}</span></div>)}
        </div>
      </div>
    </section>
  )
}

const STATS = [['150+', 'projetos'], ['98%', 'satisfação'], ['3×', 'ROI médio']]

function ArrowIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
}
