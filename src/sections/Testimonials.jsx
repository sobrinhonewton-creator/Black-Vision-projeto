import { useInView } from '../hooks/useInView.js'

const testimonials = [
  {
    quote:
      'A Black Vision entregou nosso sistema em 3 semanas. As automações reduziram 60% do trabalho manual. O ROI veio em menos de 2 meses.',
    name: 'Ricardo Almeida',
    role: 'CEO, Construtora Almeida',
    initials: 'RA',
  },
  {
    quote:
      'Chatbot com IA que atende 24/7 e qualifica leads automaticamente. Triplicamos o volume de atendimentos sem contratar mais ninguém.',
    name: 'Fernanda Costa',
    role: 'Diretora Comercial, MedClinic',
    initials: 'FC',
  },
  {
    quote:
      'Nosso e-commerce caiu de 8s para 1.2s de carregamento. As conversões subiram 45% no primeiro mês. Profissionais de verdade.',
    name: 'Gabriel Santos',
    role: 'Fundador, Loja Própria',
    initials: 'GS',
  },
]

export default function Testimonials() {
  const [ref, inView] = useInView()

  return (
    <section id="testimonials">
      <div className="divider" />
      <div
        className="container"
        ref={ref}
        style={{ paddingTop: 'clamp(3.5rem, 9vw, 7rem)', paddingBottom: 'clamp(3.5rem, 9vw, 7rem)' }}
      >
        <div
          className={`fade-up ${inView ? 'visible' : ''}`}
          style={{ textAlign: 'center', maxWidth: '560px', margin: '0 auto' }}
        >
          <div className="section-label" style={{ justifyContent: 'center' }}>
            Resultados Reais
          </div>
          <h2>
            Empresas que{' '}
            <span className="gold-text">transformaram</span>{' '}
            seus negócios.
          </h2>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className={`card fade-up delay-${i + 1} ${inView ? 'visible' : ''}`}
            >
              <div className="stars">{'★★★★★'}</div>
              <p className="testimonial-quote">"{t.quote}"</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">{t.initials}</div>
                <div>
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
