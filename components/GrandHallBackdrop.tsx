/**
 * Fondo ambiental fijo para toda la página. Se inspira en el claroscuro y la
 * composición simétrica de un gran salón renacentista —luz cálida
 * concentrada en el centro, arcos en perspectiva perdiéndose en la
 * penumbra— sin reproducir ninguna obra ni figura reconocible. Es
 * puramente arquitectónico y atmosférico.
 */
export default function GrandHallBackdrop() {
  return (
    <svg
      viewBox="0 0 1440 1000"
      preserveAspectRatio="xMidYMid slice"
      className="fixed inset-0 w-full h-full -z-10 opacity-[0.35]"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="hallGlow" cx="50%" cy="38%" r="65%">
          <stop offset="0%" stopColor="#4a3a12" stopOpacity="0.55" />
          <stop offset="35%" stopColor="#241d0c" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0a0a0a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="archFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9A227" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#C9A227" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="floorFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0a0a" stopOpacity="0" />
          <stop offset="100%" stopColor="#0a0a0a" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      <rect width="1440" height="1000" fill="url(#hallGlow)" />

      {/* Arcos en perspectiva, simétricos a ambos lados, perdiéndose hacia el punto de fuga central */}
      {[0, 1, 2, 3, 4].map((i) => {
        const inset = i * 95;
        const topY = 40 + i * 42;
        return (
          <g key={i} opacity={0.9 - i * 0.14}>
            <path
              d={`M ${inset} 1000 L ${inset + 40} ${topY + 260} Q ${720} ${topY} ${1440 - inset - 40} ${topY + 260} L ${1440 - inset} 1000`}
              fill="none"
              stroke="url(#archFade)"
              strokeWidth="1.5"
            />
          </g>
        );
      })}

      {/* Haz de luz central, cálido y difuso, como una única fuente alta */}
      <ellipse cx="720" cy="120" rx="260" ry="340" fill="url(#hallGlow)" opacity="0.6" />

      <rect width="1440" height="1000" fill="url(#floorFade)" />
    </svg>
  );
}
