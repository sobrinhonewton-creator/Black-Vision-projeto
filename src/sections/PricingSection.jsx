/**
 * PricingSection.jsx
 * Seção de planos com glassmorphism, neon, blur-on-hover e partículas CSS.
 * Zero dependências externas — apenas React + useInView existente.
 */

import { useState } from 'react'
import { useInView } from '../hooks/useInView.js'
import PricingCard from '../components/PricingCard.jsx'
import useContentStore from '../store/contentStore.js'
/* ── Partículas CSS estáticas (sem JS pesado) ────── */
const PARTICLES = [
  { size: 3, top: '12%', left: '8%',  delay: '0s',   dur: '6s'  },
  { size: 2, top: '78%', left: '15%', delay: '1.5s', dur: '8s'  },
  { size: 4, top: '35%', left: '92%', delay: '0.8s', dur: '7s'  },
  { size: 2, top: '88%', left: '85%', delay: '2.1s', dur: '5s'  },
  { size: 3, top: '20%', left: '75%', delay: '3.2s', dur: '9s'  },
  { size: 2, top: '55%', left: '5%',  delay: '1.1s', dur: '6.5s'},
  { size: 3, top: '65%', left: '50%', delay: '4s',   dur: '7.5s'},
  { size: 2, top: '8%',  left: '45%', delay: '0.4s', dur: '8.5s'},
]

/* ── Componente principal ────────────────────────── */
export default function PricingSection() {
  const [ref, inView] = useInView({ threshold: 0.08 })
  const [hoveredTier, setHoveredTier] = useState(null)
  
  const { content } = useContentStore()
  const plans = content?.plans || []
  const waNumber = content?.waNumber || ""
  
  const dynamicWaLinkBase = `https://wa.me/${waNumber.replace(/\D/g, "")}?text=Olá! Tenho interesse no plano `
  const dynamicWaLinkGeneral = `https://wa.me/${waNumber.replace(/\D/g, "")}?text=Tenho dúvidas sobre os planos`

  /* Blur nos cards vizinhos quando um é hovered */
  const getCardMod = (tier) => {
    if (!hoveredTier || hoveredTier === tier) return ''
    return 'pricing-card--dimmed'
  }

  return (
    <section id="pricing" className="pricing-section" aria-labelledby="pricing-title">
      {/* ── Partículas de fundo ── */}
      <div className="pricing-particles" aria-hidden="true">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="pricing-particle"
            style={{
              width:  p.size,
              height: p.size,
              top:    p.top,
              left:   p.left,
              animationDelay:    p.delay,
              animationDuration: p.dur,
            }}
          />
        ))}
      </div>

      {/* ── Glow central de fundo ── */}
      <div className="pricing-bg-glow" aria-hidden="true" />

      <div className="container" ref={ref}>
        {/* ── Cabeçalho ── */}
        <div
          className={`pricing-header fade-up ${inView ? 'visible' : ''}`}
        >
          <div className="section-label" style={{ justifyContent: 'center' }}>
            Planos & Investimento
          </div>

          <h2 id="pricing-title">
            Escolha o plano{' '}
            <span className="gold-text">certo para você.</span>
          </h2>

          <p className="pricing-header__sub">
            Sem taxas ocultas. Sem surpresas. Entregamos resultado mensurável
            desde o primeiro dia.
          </p>

          {/* Trust badges */}
          <div className="pricing-trust" role="list">
            {[
              '✓ Sem contrato longo',
              '✓ Suporte incluso',
              '✓ Resultado garantido',
            ].map((t) => (
              <span key={t} className="pricing-trust__item" role="listitem">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* ── Grid de cards ── */}
        <div className="pricing-grid" role="list">
          {plans.map((plan, index) => (
            <div
              key={plan.tier || index}
              className={getCardMod(plan.tier)}
              role="listitem"
              onMouseEnter={() => setHoveredTier(plan.tier)}
              onMouseLeave={() => setHoveredTier(null)}
            >
              <PricingCard
                {...plan}
                ctaLink={dynamicWaLinkBase + plan.name}
                delay={index * 120}
                visible={inView}
              />
            </div>
          ))}
        </div>

        {/* ── Nota de rodapé ── */}
        <p
          className={`pricing-footnote fade-up delay-5 ${inView ? 'visible' : ''}`}
        >
          Todos os planos incluem reunião de briefing gratuita.{' '}
          <a
            href={dynamicWaLinkGeneral}
            target="_blank"
            rel="noopener noreferrer"
            className="pricing-footnote__link"
          >
            Dúvidas? Fale conosco →
          </a>
        </p>
      </div>
    </section>
  )
}
