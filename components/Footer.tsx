import { Linkedin, Github, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-ink-950 border-t border-white/[0.06] py-10">
      <div className="max-w-content mx-auto px-6 md:px-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <p className="text-paper-dim/60 text-xs tracking-wide">
          © {new Date().getFullYear()} Vicente Tomás Jara Valdés. Todos los derechos reservados.
        </p>

        <div className="flex items-center gap-5">
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="text-paper-dim/60 hover:text-gold transition-colors duration-300"
          >
            <Linkedin size={17} strokeWidth={1.5} />
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="text-paper-dim/60 hover:text-gold transition-colors duration-300"
          >
            <Github size={17} strokeWidth={1.5} />
          </a>
          <a
            href="mailto:vicentetomasjara@gmail.com"
            aria-label="Email"
            className="text-paper-dim/60 hover:text-gold transition-colors duration-300"
          >
            <Mail size={17} strokeWidth={1.5} />
          </a>
        </div>
      </div>
    </footer>
  );
}
