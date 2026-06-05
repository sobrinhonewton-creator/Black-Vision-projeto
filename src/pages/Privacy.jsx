import { Link } from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

export default function Privacy() {
  return (
    <>
      <Header />
      <main style={{ paddingTop: "120px", paddingBottom: "60px", minHeight: "80svh", background: "var(--bg)", color: "var(--text)" }}>
        <div className="container" style={{ maxWidth: "800px" }}>
          <h1 style={{ fontSize: "2.5rem", fontFamily: "var(--font-title)", marginBottom: "2rem", color: "var(--gold-2)" }}>Política de Privacidade</h1>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", lineHeight: 1.6, color: "var(--text-muted)" }}>
            <p>
              Sua privacidade é importante para nós. É política da Black Vision respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar.
            </p>
            
            <h2 style={{ color: "var(--text)", fontSize: "1.25rem", marginTop: "1rem" }}>1. Informações que coletamos</h2>
            <p>
              Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço. Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento.
            </p>

            <h2 style={{ color: "var(--text)", fontSize: "1.25rem", marginTop: "1rem" }}>2. Uso das informações</h2>
            <p>
              Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço solicitado. Quando armazenamos dados, os protegemos dentro de meios comercialmente aceitáveis ​​para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou modificação não autorizados.
            </p>

            <h2 style={{ color: "var(--text)", fontSize: "1.25rem", marginTop: "1rem" }}>3. Compartilhamento de dados</h2>
            <p>
              Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei.
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
