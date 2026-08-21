type ShurikenMarkProps = {
  className?: string;
};

/**
 * Firma discreta del oficio: un shuriken trazado como sello, no como
 * personaje. Mantiene el espíritu "ninja" del brief (precisión, sigilo,
 * ejecución) sin introducir una mascota caricaturesca que rompería el
 * posicionamiento de lujo minimalista ya definido para la marca.
 *
 * Decorativo y no-interactivo salvo por un leve giro al pasar el cursor;
 * aria-hidden porque no aporta información, solo firma.
 */
export default function ShurikenMark({ className = "" }: ShurikenMarkProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 text-gold/70 transition-transform duration-700 ease-out hover:rotate-45 motion-reduce:transition-none motion-reduce:hover:rotate-0 ${className}`}
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round">
        <path d="M20 3 L23 17 L37 20 L23 23 L20 37 L17 23 L3 20 L17 17 Z" />
        <circle cx="20" cy="20" r="2.5" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}
