import { useCallback, useEffect, useRef, useState } from 'react'
import { useInView } from '../hooks/useInView.js'

const PROJECTS = [
  {
    title: 'Adrielle Silva Studio',
    category: 'Beleza & estética',
    location: 'Ilhéus · BA',
    description:
      'Landing page para apresentar serviços, experiência e facilitar pedidos de atendimento.',
    image: '/images/projects/adrielle-silva-studio.webp',
    alt: 'Landing page do Adrielle Silva Studio criada pela BlackVision',
  },
  {
    title: 'Dene Bolos',
    category: 'Confeitaria artesanal',
    location: 'Itapetinga · BA',
    description:
      'Portfólio de produtos com navegação direta para orçamento e encomendas.',
    image: '/images/projects/dene-bolos.webp',
    alt: 'Landing page da Dene Bolos criada pela BlackVision',
  },
  {
    title: 'Guma Sorvetes',
    category: 'Alimentação & experiência',
    location: 'Itacaré · BA',
    description:
      'Presença digital para valorizar a marca, os sabores e a localização em Itacaré.',
    image: '/images/projects/guma-sorvetes.webp',
    alt: 'Landing page da Guma Sorvetes criada pela BlackVision',
  },
  {
    title: 'SC Cakes Atelier',
    category: 'Confeitaria sob encomenda',
    location: 'Guarulhos · SP',
    description:
      'Site institucional com especialidades, galeria e caminho rápido para orçamento.',
    image: '/images/projects/sc-cakes-atelier.webp',
    alt: 'Landing page da SC Cakes Atelier criada pela BlackVision',
  },
  {
    title: 'Spa Maria Gomes',
    category: 'Bem-estar & estética',
    location: 'Itacaré · BA',
    description:
      'Landing page para apresentar protocolos, autoridade e agendamento pelo WhatsApp.',
    image: '/images/projects/spa-maria-gomes.webp',
    alt: 'Landing page do Spa Maria Gomes criada pela BlackVision',
  },
]

const TRANSITION_MS = 720
const AUTO_ROTATE_MS = 3000

function ArrowIcon({ direction = 'right' }) {
  const transform = direction === 'left' ? 'rotate(180 12 12)' : undefined
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" transform={transform} />
    </svg>
  )
}

function PauseIcon({ paused }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      {paused ? <path d="M4.25 2.8v10.4L12.5 8 4.25 2.8Z" /> : <path d="M3.5 2.5h3v11h-3v-11Zm6 0h3v11h-3v-11Z" />}
    </svg>
  )
}

export default function Projects() {
  const [sectionRef, inView] = useInView({ threshold: 0.16 })
  const [activeIndex, setActiveIndex] = useState(0)
  const [leavingIndex, setLeavingIndex] = useState(null)
  const [userPaused, setUserPaused] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const transitionTimerRef = useRef(null)
  const lastTriggerRef = useRef(null)
  const closeButtonRef = useRef(null)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReduceMotion(media.matches)
    updatePreference()
    media.addEventListener?.('change', updatePreference)
    return () => media.removeEventListener?.('change', updatePreference)
  }, [])

  useEffect(() => () => window.clearTimeout(transitionTimerRef.current), [])

  const activateProject = useCallback(
    (nextIndex) => {
      if (nextIndex === activeIndex || leavingIndex !== null) return

      if (reduceMotion) {
        setActiveIndex(nextIndex)
        return
      }

      window.clearTimeout(transitionTimerRef.current)
      setLeavingIndex(activeIndex)
      setActiveIndex(nextIndex)
      transitionTimerRef.current = window.setTimeout(
        () => setLeavingIndex(null),
        TRANSITION_MS
      )
    },
    [activeIndex, leavingIndex, reduceMotion]
  )

  const showNext = useCallback(() => {
    activateProject((activeIndex + 1) % PROJECTS.length)
  }, [activateProject, activeIndex])

  const showPrevious = useCallback(() => {
    activateProject((activeIndex - 1 + PROJECTS.length) % PROJECTS.length)
  }, [activateProject, activeIndex])

  useEffect(() => {
    if (!inView || userPaused || reduceMotion || selectedProject) {
      return undefined
    }

    const timer = window.setTimeout(showNext, AUTO_ROTATE_MS)
    return () => window.clearTimeout(timer)
  }, [inView, reduceMotion, selectedProject, showNext, userPaused])

  const openProject = (project, event) => {
    lastTriggerRef.current = event.currentTarget
    setSelectedProject(project)
  }

  const closeProject = useCallback(() => {
    setSelectedProject(null)
    window.requestAnimationFrame(() => lastTriggerRef.current?.focus())
  }, [])

  useEffect(() => {
    if (!selectedProject) return undefined

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeProject()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    closeButtonRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeProject, selectedProject])

  const cardState = (index) => {
    if (index === leavingIndex) return 'is-leaving'
    const offset = (index - activeIndex + PROJECTS.length) % PROJECTS.length
    return `is-stack-${offset}`
  }

  return (
    <section id="projects" className="projects-showcase" ref={sectionRef} aria-labelledby="projects-title">
      <div className="projects-showcase__wash" aria-hidden="true" />

      <div className="container projects-showcase__inner">
        <header className={`projects-intro fade-up ${inView ? 'visible' : ''}`}>
          <div className="projects-eyebrow"><span>03</span> — Portfólio BlackVision</div>
          <h2 id="projects-title" className="projects-title">
            <span>Projetos reais, criados para</span>
            <em>fortalecer marcas e negócios.</em>
          </h2>
          <p className="projects-description">
            Uma seleção de experiências digitais desenvolvidas pela BlackVision, unindo estratégia,
            design e tecnologia para gerar autoridade, clareza e novas oportunidades.
          </p>
        </header>

        <div
          className={`projects-stage fade-up delay-2 ${inView ? 'visible' : ''}`}
        >
          <div className="projects-deck" aria-live="polite">
            {PROJECTS.map((project, index) => {
              const isActive = index === activeIndex
              const state = cardState(index)

              return (
                <article
                  className={`project-card ${state}`}
                  key={project.title}
                  aria-hidden={!isActive}
                  onClick={() => !isActive && activateProject(index)}
                >
                  <div className="project-card__browser" aria-hidden="true">
                    <span className="project-card__browser-dots"><i /><i /><i /></span>
                    <span>BLACKVISION · PROJETO REAL</span>
                    <span>{String(index + 1).padStart(2, '0')} / {String(PROJECTS.length).padStart(2, '0')}</span>
                  </div>

                  <div className="project-card__preview">
                    <img
                      src={project.image}
                      alt={project.alt}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      width="1600"
                      height="700"
                    />
                    <span className="project-card__proof">Landing page</span>
                  </div>

                  <div className="project-card__body">
                    <div className="project-card__meta">
                      <span>{project.category}</span>
                      <span>{project.location}</span>
                    </div>
                    <h3>{project.title}</h3>
                    <p>{project.description}</p>
                    <button
                      type="button"
                      className="project-card__open"
                      tabIndex={isActive ? 0 : -1}
                      onClick={(event) => {
                        event.stopPropagation()
                        openProject(project, event)
                      }}
                    >
                      Ver projeto <ArrowIcon />
                    </button>
                  </div>
                </article>
              )
            })}
          </div>

          <div className="projects-controls" role="group" aria-label="Controles do portfólio">
            <button type="button" onClick={showPrevious} aria-label="Mostrar projeto anterior">
              <ArrowIcon direction="left" />
            </button>
            <span className="projects-counter">
              <strong>{String(activeIndex + 1).padStart(2, '0')}</strong>
              <i />
              <span>{String(PROJECTS.length).padStart(2, '0')}</span>
            </span>
            <button type="button" onClick={showNext} aria-label="Mostrar próximo projeto">
              <ArrowIcon />
            </button>
            <button
              type="button"
              className="projects-autoplay"
              onClick={() => setUserPaused((paused) => !paused)}
              aria-label={userPaused ? 'Retomar rotação automática' : 'Pausar rotação automática'}
              aria-pressed={userPaused}
            >
              <PauseIcon paused={userPaused} />
            </button>
          </div>
        </div>
      </div>

      {selectedProject && (
        <div
          className="project-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeProject()
          }}
        >
          <div
            className="project-modal__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-modal-title"
          >
            <div className="project-modal__header">
              <div>
                <span>{selectedProject.category} · {selectedProject.location}</span>
                <h3 id="project-modal-title">{selectedProject.title}</h3>
                <p>Visualização da landing page desenvolvida pela BlackVision.</p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeProject}
                aria-label="Fechar projeto ampliado"
              >
                ×
              </button>
            </div>
            <div className="project-modal__image">
              <img src={selectedProject.image} alt={selectedProject.alt} width="1600" height="700" />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
