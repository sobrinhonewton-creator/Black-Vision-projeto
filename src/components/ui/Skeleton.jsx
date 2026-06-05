/** Skeleton.jsx — Skeleton loading state */

export function Skeleton({ width = "100%", height = 20, radius = 8, className = "" }) {
  return (
    <>
      <style>{`
        @keyframes _sk_wave {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        ._skeleton {
          background: linear-gradient(90deg, rgba(255,255,255,.04) 25%, rgba(255,255,255,.08) 50%, rgba(255,255,255,.04) 75%);
          background-size: 200% auto;
          animation: _sk_wave 1.5s ease-in-out infinite;
          display: block;
        }
      `}</style>
      <span
        className={`_skeleton ${className}`}
        style={{ width, height, borderRadius: radius, display: "block" }}
        aria-hidden="true"
      />
    </>
  );
}

export function SkeletonText({ lines = 3, lastWidth = "60%" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={16}
          width={i === lines - 1 ? lastWidth : "100%"}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div style={{ padding: "1.5rem", border: "1px solid rgba(255,255,255,.06)", borderRadius: 16, display: "flex", flexDirection: "column", gap: "1rem" }}>
      <Skeleton height={20} width="40%" />
      <SkeletonText lines={2} lastWidth="70%" />
      <Skeleton height={36} radius={8} />
    </div>
  );
}
