const IG_LINK = 'https://www.instagram.com/blackvision.br/'
const WA_LINK = 'https://wa.me/557381068594'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          {/* Logo + tagline */}
          <div>
            <div className="nav-logo" style={{ marginBottom: '0.5rem' }}>
              <span className="shimmer">Black Vision</span>
            </div>
            <p style={{ fontSize: '0.8rem', maxWidth: '260px', lineHeight: 1.5 }}>
              Sistemas Web, Automação e IA para empresas que querem crescer.
            </p>
          </div>

          {/* Links */}
          <ul className="footer-links">
            <li>
              <a
                href="#solutions"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById('solutions')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                Soluções
              </a>
            </li>
            <li>
              <a
                href="#process"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById('process')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                Como Funciona
              </a>
            </li>
            <li>
              <a
                href="#testimonials"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                Resultados
              </a>
            </li>
            <li>
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </li>
            <li>
              <a href={IG_LINK} target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            </li>
          </ul>

          {/* Copyright */}
          <p className="footer-copy">
            © {year} Black Vision. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
