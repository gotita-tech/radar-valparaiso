type HankoSealProps = {
  className?: string;
  label?: string;
};

/**
 * Elemento de firma del diseño: un sello (hanko) trazado a mano,
 * como los que un artesano estampa para autentificar su trabajo.
 * Se repite, discreto, en los puntos donde el visitante pasa de una
 * idea a la siguiente.
 */
export default function HankoSeal({ className = "", label = "策" }: HankoSealProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="4"
        y="4"
        width="56"
        height="56"
        rx="3"
        fill="none"
        stroke="#C9A227"
        strokeWidth="1.5"
      />
      <rect
        x="9"
        y="9"
        width="46"
        height="46"
        rx="1"
        fill="none"
        stroke="#C9A227"
        strokeWidth="0.5"
        opacity="0.6"
      />
      <text
        x="32"
        y="41"
        textAnchor="middle"
        fontSize="26"
        fill="#C9A227"
        style={{ fontFamily: "var(--font-noto-serif-jp)" }}
      >
        {label}
      </text>
    </svg>
  );
}
