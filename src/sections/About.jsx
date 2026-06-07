import { useInView } from '../hooks/useInView.js'

const WA_LINK =
  'https://wa.me/557381068594?text=Ol%C3%A1!%20Quero%20agendar%20uma%20reuni%C3%A3o%20estrat%C3%A9gica%20gratuita%20com%20a%20Black%20Vision.'

const CARDS = [
  { icon: '🎯', title: 'Foco em ROI',         desc: 'Cada decisão técnica justificada por impacto financeiro real.' },
  { icon: '⚡', title: 'Entregas Rápidas',    desc: 'Primeiros resultados visíveis em menos de 2 semanas.' },
  { icon: '🔒', title: 'Código Limpo',        desc: 'Arquitetura escalável, documentada e sem vendor lock-in.' },
  { icon: '📊', title: 'Transparência Total', desc: 'Relatórios semanais e acesso ao painel em tempo real.' },
]

export default function About() {
  const [ref, inView] = useInView()

  return (
    <section id="about" style={{ position: 'relative' }}>
      <div className="divider" />
      <div className="cta-glow" aria-hidden="true" />

      <div
        className="container"
        ref={ref}
        style={{
          textAlign:     'center',
          position:      'relative',
          zIndex:        1,
          paddingTop:    'clamp(3.5rem, 9vw, 7rem)',
          paddingBottom: 'clamp(3.5rem, 9vw, 7rem)',
        }}
      >
        <div className={`fade-up ${inView ? 'visible' : ''}`}>
          <div className="section-label" style={{ justifyContent: 'center' }}>
            Por que a Black Vision
          </div>
          <h2 style={{ maxWidth: '700px', margin: '0 auto 1.5rem' }}>
            Não somos uma agência.
            <br />
            <span className="gold-text">Somos seu parceiro de crescimento.</span>
          </h2>
          <p style={{ maxWidth: '580px', margin: '0 auto 2.5rem', fontSize: '1.05rem' }}>
            Combinamos design de alto nível, engenharia de software e automação
            inteligente para entregar soluções com métricas claras e ROI mensurável.
          </p>
        </div>

        <div className="about-grid">
          {CARDS.map((c, i) => (
            <div
              key={c.title}
              className={`about-card fade-up delay-${i + 1} ${inView ? 'visible' : ''}`}
            >
              <div className="about-card-icon">{c.icon}</div>
              <div className="about-card-title">{c.title}</div>
              <div className="about-card-desc">{c.desc}</div>
            </div>
          ))}
        </div>

        <div className={`cta-actions fade-up delay-5 ${inView ? 'visible' : ''}`}>
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary pulse"
            data-terminal-command="audit --process-flow"
            style={{ fontSize: '1rem', padding: '1rem 2.5rem' }}
          >
            Agendar Diagnóstico Gratuito →
          </a>
          <a
            href="#solutions"
            className="btn btn-outline"
            onClick={(e) => {
              e.preventDefault()
              document.getElementById('solutions')?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            Ver Soluções
          </a>
        </div>
      </div>
    </section>
  )
}
