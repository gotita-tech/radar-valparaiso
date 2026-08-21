"use client";

import { motion } from "framer-motion";
import { Mail, MessageCircle } from "lucide-react";
import HankoSeal from "./ui/HankoSeal";
import LuxuryButton from "./ui/LuxuryButton";
import { EMAIL, PHONE_DISPLAY, buildWhatsAppUrl } from "@/lib/site-config";

export default function CTAFinal() {
  const whatsappUrl = buildWhatsAppUrl();

  return (
    <section id="contacto" className="relative py-28 md:py-40 bg-ink-950 overflow-hidden">
      <div className="absolute inset-0 pattern-seigaiha opacity-25" aria-hidden="true" />
      <div className="absolute inset-0 pattern-ink-bloom" aria-hidden="true" />

      <div className="relative z-10 max-w-content mx-auto px-6 md:px-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <HankoSeal className="w-10 h-10" label="縁" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.3, delay: 0.06 }}
          className="font-serif text-3xl md:text-5xl text-paper max-w-3xl leading-tight text-balance"
        >
          Las mejores soluciones nacen cuando estrategia y tecnología trabajan juntas.
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.3, delay: 0.12 }}
          className="mt-10 flex flex-col items-center gap-6"
        >
          <LuxuryButton
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="!px-10 !py-4"
          >
            Hablemos por WhatsApp
          </LuxuryButton>

          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-sm text-paper-dim">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 hover:text-gold transition-colors duration-300"
            >
              <MessageCircle size={15} strokeWidth={1.5} />
              {PHONE_DISPLAY}
            </a>
            <a
              href={`mailto:${EMAIL}`}
              className="inline-flex items-center gap-2 hover:text-gold transition-colors duration-300"
            >
              <Mail size={15} strokeWidth={1.5} />
              {EMAIL}
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
