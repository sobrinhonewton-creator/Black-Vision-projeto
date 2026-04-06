import { useInView } from '../hooks/useInView.js'

const steps = [
  {
    number: '01',
    title: 'Diagnóstico Gratuito',
    description:
      'Reunião estratégica de 30 min para entender seus desafios, objetivos e oportunidades de automação.',
  },
  {
    number: '02',
    title: 'Proposta Personalizada',
    description:
      'Plano de ação detalhado com escopo, tecnologia, cronograma e investimento — sem surpresas.',
  },
  {
    number: '03',
    title: 'Desenvolvimento Ágil',
    description:
      'Sprints semanais com entregas visíveis e feedback constante. Você acompanha tudo em tempo real.',
  },
  {
    number: '04',
    title: 'Entrega & Suporte',
    description:
      'Go-live com treinamento da equipe, documentação completa e suporte contínuo pós-lançamento.',
  },
]

export default function Process() {
  const [ref, inView] = useInView()

  return (
    <section id="process">
      <div className="divider" />
      <div
        className="container"
        ref={ref}
        style={{ paddingTop: 'clamp(3.5rem, 9vw, 7rem)', paddingBottom: 'clamp(3.5rem, 9vw, 7rem)' }}
      >
        <div
          className={`fade-up ${inView ? 'visible' : ''}`}
          style={{ textAlign: 'center', maxWidth: '560px', margin: '0 auto 3rem' }}
        >
          <div className="section-label" style={{ justifyContent: 'center' }}>
            Como Funciona
          </div>
          <h2>
            Do zero ao{' '}
            <span className="gold-text">resultado em semanas.</span>
          </h2>
          <p style={{ marginTop: '1rem' }}>
            Um processo claro e previsível do início ao fim. Sem jargão, sem enrolação.
          </p>
        </div>

        <div className="process-steps">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className={`process-step fade-up delay-${i + 1} ${inView ? 'visible' : ''}`}
            >
              <div className="step-number">{step.number}</div>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.65rem', lineHeight: 1.3 }}>
                {step.title}
              </h3>
              <p style={{ fontSize: '0.85rem' }}>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
