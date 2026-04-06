import { trackCardClick } from "../services/tracking";
import { useInView } from '../hooks/useInView.js'

const solutions = [
  {
    icon: '🌐',
    tag: 'Sistemas Web',
    title: 'Sites & Plataformas de Alta Performance',
    description:
      'Landing pages, e-commerces e sistemas web construídos para converter. Lighthouse 95+, SEO técnico e UX que gera vendas.',
    features: ['Carregamento < 2s', 'SEO Técnico Avançado', 'Conversão Otimizada', 'Dashboard Admin'],
    /* Nome da imagem em public/images/ */
    image: '/images/img-web.webp',
  },
  {
    icon: '⚙️',
    tag: 'Automação',
    title: 'Automação de Processos Operacionais',
    description:
      'Elimine tarefas repetitivas, integre sistemas e crie fluxos automáticos que economizam tempo e reduzem erros.',
    features: ['Make / n8n / Zapier', 'Integração de ERPs', 'WhatsApp Automático', 'Relatórios em Tempo Real'],
    image: '/images/img-automacao.webp',
  },
  {
    icon: '🤖',
    tag: 'IA Aplicada',
    title: 'Soluções com Inteligência Artificial',
    description:
      'Chatbots inteligentes, análise preditiva e automação cognitiva. IA que realmente trabalha pelo seu negócio.',
    features: ['Chatbot com IA', 'Análise de Dados', 'Geração de Conteúdo', 'Personalização em Escala'],
    image: '/images/img-sistemas.webp',
  },
]

export default function Solutions() {
  const [ref, inView] = useInView()

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
          {solutions.map((s, i) => (
            <div
  key={s.tag}
  className={`solution-card fade-up delay-${i + 1} ${inView ? 'visible' : ''}`}
  onClick={() => trackCardClick()}
            >
              {/* Imagem de fundo */}
              <div
                className="solution-card-bg"
                style={{ backgroundImage: `url('${s.image}')` }}
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
                <p className="solution-desc">{s.description}</p>
                <ul className="solution-features">
                  {s.features.map((f) => (
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
