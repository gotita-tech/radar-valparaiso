"use client";

import { motion } from "framer-motion";
import { BrainCircuit, Code2, Compass } from "lucide-react";

const services = [
  {
    icon: BrainCircuit,
    title: "Inteligencia Artificial",
    items: ["Automatización", "Agentes de IA", "Integraciones"],
  },
  {
    icon: Code2,
    title: "Desarrollo",
    items: ["Aplicaciones web", "Herramientas internas", "Soluciones personalizadas"],
  },
  {
    icon: Compass,
    title: "Consultoría",
    items: ["Estrategia tecnológica", "Optimización de procesos", "Transformación digital"],
  },
];

export default function Services() {
  return (
    <section id="servicios" className="relative py-28 md:py-36 bg-ink-900/40">
      <div className="max-w-content mx-auto px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.3 }}
          className="text-center mb-16 md:mb-20"
        >
          <span className="font-jp text-gold text-xs tracking-widest2 uppercase">Servicios</span>
          <h2 className="font-serif text-3xl md:text-4xl text-paper mt-4">
            Dónde puedo ayudarte
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {services.map((service, i) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
                className="group relative rounded-2xl border border-white/[0.07] bg-ink-950/60 p-8 hover:border-gold/40 transition-colors duration-300"
              >
                <Icon
                  size={28}
                  strokeWidth={1.25}
                  className="text-gold mb-6 group-hover:scale-105 transition-transform duration-300"
                />
                <h3 className="font-serif text-xl text-paper mb-5">{service.title}</h3>
                <ul className="space-y-2.5">
                  {service.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-paper-dim text-sm">
                      <span className="mt-2 h-px w-3 bg-gold/50 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
