import { Link } from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

export default function Terms() {
  return (
    <>
      <Header />
      <main style={{ paddingTop: "120px", paddingBottom: "60px", minHeight: "80svh", background: "var(--bg)", color: "var(--text)" }}>
        <div className="container" style={{ maxWidth: "800px" }}>
          <h1 style={{ fontSize: "2.5rem", fontFamily: "var(--font-title)", marginBottom: "2rem", color: "var(--gold-2)" }}>Termos de Uso</h1>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", lineHeight: 1.6, color: "var(--text-muted)" }}>
            <p>
              Estes termos de serviço regulam o uso deste site e dos serviços oferecidos pela Black Vision. Ao acessá-lo você concorda com estes termos.
            </p>
            
            <h2 style={{ color: "var(--text)", fontSize: "1.25rem", marginTop: "1rem" }}>1. Serviços Oferecidos</h2>
            <p>
              A Black Vision oferece desenvolvimento de sistemas web, automação de processos e soluções de inteligência artificial. Os detalhes e o escopo de cada projeto são definidos em contrato específico firmado entre as partes.
            </p>

            <h2 style={{ color: "var(--text)", fontSize: "1.25rem", marginTop: "1rem" }}>2. Pagamentos e Reembolsos</h2>
            <p>
              Os pagamentos são processados por gateways de pagamento parceiros (Stripe ou Mercado Pago). As políticas de reembolso seguem o código de defesa do consumidor e são detalhadas nos contratos individuais de prestação de serviços.
            </p>

            <h2 style={{ color: "var(--text)", fontSize: "1.25rem", marginTop: "1rem" }}>3. Propriedade Intelectual</h2>
            <p>
              Todo o código, design e conteúdo criados sob medida para o cliente tornam-se propriedade do mesmo após a quitação integral do projeto, salvo acordo em contrário no contrato de prestação de serviços.
            </p>
          </div>
          
          <div style={{ marginTop: "3rem" }}>
            <Link to="/" className="btn btn-outline">← Voltar para a Home</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
