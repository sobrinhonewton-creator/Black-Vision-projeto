/** EmptyState.jsx — Estado vazio reutilizável */

export default function EmptyState({ icon = "📭", title = "Nenhum item encontrado", description = "", action = null }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "3rem 2rem", textAlign: "center", gap: "1rem",
    }}>
      <div style={{ fontSize: "2.5rem", opacity: 0.6 }}>{icon}</div>
      <div>
        <div style={{ fontSize: ".95rem", fontWeight: 500, color: "var(--text)", marginBottom: ".35rem" }}>{title}</div>
        {description && (
          <div style={{ fontSize: ".8rem", color: "var(--text-muted)", maxWidth: 320, lineHeight: 1.5 }}>{description}</div>
        )}
      </div>
      {action}
    </div>
  );
}
