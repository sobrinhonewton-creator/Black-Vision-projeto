/** Spinner.jsx — Loading spinner reutilizável */

export default function Spinner({ size = 20, color = "#c9a84c", className = "" }) {
  const border = Math.max(2, Math.floor(size / 10));
  return (
    <>
      <style>{`
        @keyframes _spin { to { transform: rotate(360deg); } }
        ._spinner { animation: _spin .7s linear infinite; border-radius: 50%; display: inline-block; flex-shrink: 0; }
      `}</style>
      <span
        className={`_spinner ${className}`}
        style={{
          width:  size,
          height: size,
          border: `${border}px solid rgba(255,255,255,.12)`,
          borderTopColor: color,
        }}
        role="status"
        aria-label="Carregando"
      />
    </>
  );
}
