import { useEffect, useMemo, useRef, useState } from 'react'

const DEFAULT_COMMANDS = [
  {
    command: 'ai-status --pipeline',
    output: 'Analisando fluxos de automação... OK · 4 pipelines ativos · desempenho estável.',
  },
  {
    command: 'deploy --ia-workflow',
    output: 'Workflow IP de IA em execução. Deployment em 2.4s. Taxa de conversão estimada +23%.',
  },
  {
    command: 'audit --process-flow',
    output: 'Verificação de compliance concluída. Redução de erros estimada em 18%.',
  },
]

const commandFromButtonLabel = (label) => {
  const text = label?.toLowerCase() || ''
  if (text.includes('ia') || text.includes('crescer')) return 'deploy --ia-workflow'
  if (text.includes('diagnóstico') || text.includes('agendar')) return 'audit --process-flow'
  if (text.includes('whatsapp')) return 'ai-status --pipeline'
  return 'optimize --automation'
}

const makeOutput = (command) => {
  if (command.includes('deploy')) {
    return 'Agent de IA configurado. Focus no cliente ativo; automações em produção.'
  }
  if (command.includes('audit')) {
    return 'Auditoria concluída. Todos os processos rastreados com expectativa de economia de 28%.'
  }
  if (command.includes('status')) {
    return 'Sistema saudável. 12 integrações ativas; tempo médio de resposta 42ms.'
  }
  return 'Otimização executada. Rede de processos adaptativa ativada em 100%.'
}

export default function TerminalDemo() {
  const prefersReduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )
  const [history, setHistory] = useState([
    { text: 'blackvision@ai:~$ Iniciando terminal de demonstração...', type: 'system' },
  ])
  const [typing, setTyping] = useState('')
  const queueRef = useRef([])
  const typingRef = useRef(false)
  const timerRef = useRef(null)

  const enqueue = (command) => {
    queueRef.current.push({ command, output: makeOutput(command) })
    if (!typingRef.current) {
      processQueue()
    }
  }

  const processQueue = () => {
    if (typingRef.current || queueRef.current.length === 0) return
    const next = queueRef.current.shift()
    typingRef.current = true
    setHistory((prev) => [
      ...prev,
      { text: `blackvision@ai:~$ ${next.command}`, type: 'prompt' },
    ])
    typeText(next.output, () => {
      typingRef.current = false
      processQueue()
    })
  }

  const typeText = (text, onDone) => {
    if (prefersReduced) {
      setHistory((prev) => [...prev, { text, type: 'output' }])
      onDone()
      return
    }

    let index = 0
    setTyping('')
    const step = () => {
      if (index <= text.length) {
        setTyping(text.slice(0, index))
        index += 1
        timerRef.current = window.setTimeout(step, 26)
      } else {
        setTyping('')
        setHistory((prev) => [...prev, { text, type: 'output' }])
        onDone()
      }
    }
    step()
  }

  useEffect(() => {
    if (prefersReduced) {
      setHistory([
        { text: 'blackvision@ai:~$ Terminal simplificado ativado.', type: 'system' },
        { text: 'blackvision@ai:~$ ai-status --pipeline', type: 'prompt' },
        { text: 'Sistema saudável. 12 integrações ativas; tempo médio de resposta 42ms.', type: 'output' },
      ])
      return
    }

    DEFAULT_COMMANDS.forEach((cmd, index) => {
      window.setTimeout(() => enqueue(cmd.command), 1800 * (index + 1))
    })

    return () => {
      window.clearTimeout(timerRef.current)
    }
  }, [])

  useEffect(() => {
    const handleClick = (event) => {
      const button = event.target.closest('.btn-primary.pulse')
      if (!button) return
      const command = button.dataset.terminalCommand || commandFromButtonLabel(button.textContent)
      enqueue(command)
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  useEffect(() => {
    const handler = (event) => {
      const command = event.detail?.command || 'optimize --automation'
      enqueue(command)
    }

    window.addEventListener('blackvision-terminal-command', handler)
    return () => window.removeEventListener('blackvision-terminal-command', handler)
  }, [])

  return (
    <div className="terminal-demo fade-up delay-5">
      <div className="terminal-demo__header">
        <div>
          <span className="terminal-demo__dot" />
          <span className="terminal-demo__dot terminal-demo__dot--soft" />
          <span className="terminal-demo__dot terminal-demo__dot--darker" />
        </div>
        <span className="terminal-demo__title">Terminal Premium AI · Demo</span>
      </div>

      <div className="terminal-demo__screen" role="log" aria-live="polite">
        {history.map((line, index) => (
          <div key={`${line.text}-${index}`} className={`terminal-demo__line terminal-demo__line--${line.type}`}>
            {line.text}
          </div>
        ))}
        {typing ? (
          <div className="terminal-demo__line terminal-demo__line--typing">
            {typing}
            <span className="terminal-demo__cursor" aria-hidden="true" />
          </div>
        ) : null}
      </div>

      <div className="terminal-demo__hint">
        Clique nos botões dourados para acionar comandos de automação em tempo real.
      </div>
    </div>
  )
}
