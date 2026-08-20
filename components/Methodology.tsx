"use client";

import { motion } from "framer-motion";

const steps = [
  {
    n: "01",
    jp: "理解",
    title: "Comprender el problema",
    text: "Antes de proponer nada, entiendo el contexto real: procesos, restricciones y objetivos.",
  },
  {
    n: "02",
    jp: "設計",
    title: "Diseñar la solución",
    text: "Planteo una arquitectura clara, con las decisiones técnicas justificadas de principio a fin.",
  },
  {
    n: "03",
    jp: "構築",
    title: "Construir",
    text: "Desarrollo con foco en calidad, mantenibilidad y tiempos realistas de entrega.",
  },
  {
    n: "04",
    jp: "最適化",
    title: "Optimizar",
    text: "Reviso rendimiento, costes y experiencia de uso una vez el sistema está en marcha.",
  },
  {
    n: "05",
    jp: "拡張",
    title: "Escalar",
    text: "Preparo la solución para crecer: más volumen, más usuarios, más casos de uso.",
  },
];

export default function Methodology() {
  return (
    <section id="metodologia" className="relative py-28 md:py-36 bg-ink-950">
      <div className="max-w-content mx-auto px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.3 }}
          className="text-center mb-16 md:mb-20"
        >
          <span className="font-jp text-gold text-xs tracking-widest2 uppercase">Metodología</span>
          <h2 className="font-serif text-3xl md:text-4xl text-paper mt-4">Cómo trabajo</h2>
        </motion.div>

        <div className="relative">
          <div className="hidden md:block absolute top-6 left-0 right-0 rule-gold" aria-hidden="true" />
          <div className="grid md:grid-cols-5 gap-10 md:gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                className="relative flex md:flex-col gap-4 md:gap-0"
              >
                <div className="relative z-10 shrink-0 w-12 h-12 rounded-full border border-gold/50 bg-ink-950 flex items-center justify-center font-serif text-gold text-sm md:mb-6">
                  {step.n}
                </div>
                <div>
                  <span className="font-jp text-gold/70 text-xs">{step.jp}</span>
                  <h3 className="font-serif text-lg text-paper mt-1 mb-2">{step.title}</h3>
                  <p className="text-paper-dim text-sm leading-relaxed">{step.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
