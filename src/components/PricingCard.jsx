/**
 * PricingCard.jsx
 * Card individual de plano — conectado ao checkout via useCheckout hook.
 * Mantém todo o visual/CSS original intacto.
 * Única mudança: botão CTA agora dispara o checkout ao invés de link WhatsApp.
 */

import { useNavigate } from 'react-router-dom'

/**
 * @param {object}  props
 * @param {string}  props.tier
 * @param {string}  props.name
 * @param {string}  props.price
 * @param {string}  props.priceSub
 * @param {string}  props.tagline
 * @param {string[]} props.features
 * @param {string}  props.audience
 * @param {string}  props.ctaLabel
 * @param {string}  props.ctaLink     — mantido como fallback WhatsApp
 * @param {boolean} props.highlighted
 * @param {string}  props.badge
 * @param {boolean} props.visible
 * @param {number}  props.delay
 * @param {boolean} [props.useCheckout] — se true, usa checkout interno (default: true)
 */
export default function PricingCard({
  tier = 'basic',
  name,
  price,
  priceSub,
  tagline,
  features = [],
  audience,
  ctaLabel,
  ctaLink,
  highlighted = false,
  badge,
  visible = false,
  delay = 0,
  useCheckoutFlow = true,
}) {
  const navigate = useNavigate()

  const handleCTA = (e) => {
    // Plano Pro → WhatsApp direto (sem checkout)
    if (tier === 'pro' || !useCheckoutFlow) return // deixa href funcionar

    e.preventDefault()
    navigate(`/checkout?plan=${tier}`)
  }

  return (
    <div
      className={[
        'pricing-card',
        `pricing-card--${tier}`,
        highlighted ? 'pricing-card--highlighted' : '',
        visible ? 'pricing-card--visible' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ animationDelay: `${delay}ms` }}
      role="article"
      aria-label={`Plano ${name}`}
    >
      {/* ── Borda neon animada (apenas no Advanced) ── */}
      {highlighted && (
        <div className="pricing-card__neon-border" aria-hidden="true" />
      )}

      {/* ── Brilho de canto ── */}
      <div className="pricing-card__glow-corner" aria-hidden="true" />

      {/* ── Badge ── */}
      {badge && (
        <div className="pricing-badge">
          <span className="pricing-badge__dot" />
          {badge}
        </div>
      )}

      {/* ── Header: nome + preço ── */}
      <div className="pricing-card__header">
        <div className="pricing-card__tier-label">{tier.toUpperCase()}</div>
        <h3 className="pricing-card__name">{name}</h3>

        <div className="pricing-card__price-wrap">
          <span className="pricing-card__price">{price}</span>
          {priceSub && (
            <span className="pricing-card__price-sub">{priceSub}</span>
          )}
        </div>

        <p className="pricing-card__tagline">{tagline}</p>
      </div>

      {/* ── Divider ── */}
      <div className="pricing-card__divider" aria-hidden="true" />

      {/* ── Features ── */}
      <ul className="pricing-card__features" aria-label="Recursos incluídos">
        {features.map((f, i) => (
          <li key={i} className="pricing-card__feature">
            <span className="pricing-card__check" aria-hidden="true">
              {highlighted ? '◆' : '✓'}
            </span>
            {f}
          </li>
        ))}
      </ul>

      {/* ── Audience chip ── */}
      {audience && (
        <div className="pricing-card__audience">
          <span className="pricing-card__audience-label">Ideal para:</span>
          {audience}
        </div>
      )}

      {/* ── CTA ── */}
      <a
        href={ctaLink}
        target={tier === 'pro' ? '_blank' : undefined}
        rel={tier === 'pro' ? 'noopener noreferrer' : undefined}
        onClick={handleCTA}
        className={[
          'pricing-card__cta',
          highlighted ? 'pricing-card__cta--primary' : 'pricing-card__cta--ghost',
        ].join(' ')}
        aria-label={`${ctaLabel} — Plano ${name}`}
      >
        {ctaLabel}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </a>
    </div>
  )
}
