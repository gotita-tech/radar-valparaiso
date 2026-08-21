"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import LuxuryButton from "./ui/LuxuryButton";

const links = [
  { href: "#sobre-mi", label: "Sobre mí" },
  { href: "#servicios", label: "Servicios" },
  { href: "#metodologia", label: "Metodología" },
  { href: "#proyectos", label: "Proyectos" },
  { href: "#contacto", label: "Contacto" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Bloquea el scroll del body mientras el menú mobile está abierto, y permite cerrarlo con Escape.
  useEffect(() => {
    if (!menuOpen) return;

    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled || menuOpen
          ? "bg-ink-950/85 backdrop-blur-md border-b border-white/[0.06]"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-content mx-auto flex items-center justify-between px-6 md:px-10 h-20">
        <a
          href="#inicio"
          className="font-serif text-lg tracking-wide text-paper hover:text-gold transition-colors duration-300"
          onClick={() => setMenuOpen(false)}
        >
          Vicente Jara
        </a>

        <ul className="hidden md:flex items-center gap-10">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm tracking-wide text-paper-dim hover:text-gold transition-colors duration-300"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:block">
          <LuxuryButton href="#contacto" className="!px-5 !py-2 !text-xs">
            Agendar reunión
          </LuxuryButton>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          className="md:hidden inline-flex items-center justify-center w-10 h-10 -mr-2 text-paper hover:text-gold transition-colors duration-300"
        >
          {menuOpen ? (
            <X size={22} strokeWidth={1.5} />
          ) : (
            <Menu size={22} strokeWidth={1.5} />
          )}
        </button>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="md:hidden overflow-hidden border-t border-white/[0.06] bg-ink-950/95 backdrop-blur-md"
          >
            <ul className="flex flex-col px-6 py-6 gap-1">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block py-3 text-base text-paper-dim hover:text-gold transition-colors duration-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="px-6 pb-8 pt-2">
              <LuxuryButton href="#contacto" className="w-full">
                Agendar reunión
              </LuxuryButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
