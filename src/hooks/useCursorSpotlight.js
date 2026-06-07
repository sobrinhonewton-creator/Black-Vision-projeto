import { useEffect } from 'react'

export default function useCursorSpotlight() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isMobile = window.matchMedia('(max-width: 767px)').matches
    if (prefersReduced || isMobile) return

    const selector = '.card, .pricing-card'
    let activeCard = null
    let frameId = null

    const updateSpotlight = (event) => {
      if (!activeCard) return
      const rect = activeCard.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      activeCard.style.setProperty('--spotlight-x', `${x}px`)
      activeCard.style.setProperty('--spotlight-y', `${y}px`)
    }

    const handlePointerOver = (event) => {
      const card = event.target.closest(selector)
      if (!card || card === activeCard) return
      activeCard = card
      activeCard.classList.add('spotlight-active')
      updateSpotlight(event)
    }

    const handlePointerOut = (event) => {
      const related = event.relatedTarget
      if (!activeCard) return
      if (related && related.closest(selector) === activeCard) return
      activeCard.classList.remove('spotlight-active')
      activeCard.style.removeProperty('--spotlight-x')
      activeCard.style.removeProperty('--spotlight-y')
      activeCard = null
      if (frameId) {
        window.cancelAnimationFrame(frameId)
        frameId = null
      }
    }

    const handlePointerMove = (event) => {
      if (!activeCard) return
      if (frameId) return
      frameId = window.requestAnimationFrame(() => {
        updateSpotlight(event)
        frameId = null
      })
    }

    document.addEventListener('pointerover', handlePointerOver)
    document.addEventListener('pointerout', handlePointerOut)
    document.addEventListener('pointermove', handlePointerMove)

    return () => {
      document.removeEventListener('pointerover', handlePointerOver)
      document.removeEventListener('pointerout', handlePointerOut)
      document.removeEventListener('pointermove', handlePointerMove)
      if (frameId) window.cancelAnimationFrame(frameId)
    }
  }, [])
}
