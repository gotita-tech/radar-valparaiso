import { Mail, MessageCircle } from "lucide-react";
import ShurikenMark from "./ui/ShurikenMark";
import { AUTHOR_NAME, EMAIL, buildWhatsAppUrl } from "@/lib/site-config";

export default function Footer() {
  const whatsappUrl = buildWhatsAppUrl();

  return (
    <footer className="bg-ink-950 border-t border-white/[0.06] py-10">
      <div className="max-w-content mx-auto px-6 md:px-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <ShurikenMark className="w-4 h-4" />
          <p className="text-paper-dim/60 text-xs tracking-wide">
            © {new Date().getFullYear()} {AUTHOR_NAME}. Todos los derechos reservados.
          </p>
        </div>

        <div className="flex items-center gap-5">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="text-paper-dim/60 hover:text-gold transition-colors duration-300"
          >
            <MessageCircle size={17} strokeWidth={1.5} />
          </a>
          <a
            href={`mailto:${EMAIL}`}
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
