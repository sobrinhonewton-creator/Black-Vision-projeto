import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100svh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", background: "var(--bg)",
      color: "var(--text)", textAlign: "center", padding: "2rem"
    }}>
      <h1 style={{ fontSize: "5rem", fontFamily: "var(--font-title)", color: "var(--gold-2)", marginBottom: "1rem" }}>404</h1>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 500, marginBottom: "1rem" }}>Página não encontrada</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "2rem", maxWidth: "400px" }}>
        A página que você está procurando não existe ou foi movida.
      </p>
      <Link to="/" className="btn btn-primary pulse">
        Voltar para a Home
      </Link>
    </div>
  );
}
