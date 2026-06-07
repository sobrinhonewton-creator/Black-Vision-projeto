import { useEffect } from 'react'

export default function useScrollReveal() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.14, rootMargin: '0px 0px -80px 0px' }
    )

    const nodes = Array.from(document.querySelectorAll('.fade-up'))
    nodes.forEach((node) => observer.observe(node))

    return () => observer.disconnect()
  }, [])
}
