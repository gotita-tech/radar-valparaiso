"use client";

import { motion } from "framer-motion";

export default function About() {
  return (
    <section id="sobre-mi" className="relative py-28 md:py-36 bg-ink-950">
      <div className="max-w-content mx-auto px-6 md:px-10 grid md:grid-cols-12 gap-12 md:gap-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.3 }}
          className="md:col-span-4"
        >
          <span className="font-jp text-gold text-xs tracking-widest2 uppercase">Sobre mí</span>
          <h2 className="font-serif text-3xl md:text-4xl text-paper mt-4 leading-tight">
            Curiosidad disciplinada
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.3, delay: 0.08 }}
          className="md:col-span-8 space-y-6 text-paper-dim text-lg leading-relaxed"
        >
          <p>
            Empecé a interesarme por la tecnología no por la herramienta en sí, sino por lo que
            permite resolver. Esa distinción sigue guiando cómo trabajo: antes de escribir una
            línea de código o proponer un modelo de IA, entiendo qué problema real hay detrás y
            qué pasa si se resuelve mal para el negocio que lo pidió.
          </p>
          <p>
            Como programador especializado en Inteligencia Artificial, no construyo páginas web
            estáticas: construyo sistemas web que piensan. Agentes que responden consultas de
            clientes a cualquier hora, formularios que califican leads solos, paneles que
            aprenden del comportamiento de quien visita. La diferencia entre una web común y una
            impulsada por IA es la diferencia entre un folleto digital y un empleado que nunca
            duerme.
          </p>
          <p>
            Me muevo con comodidad entre la estrategia y la ejecución técnica: puedo sentarme a
            definir un roadmap con un cliente y, al día siguiente, estar dentro del código
            construyendo la solución. Esa capacidad de moverme entre ambos mundos —sin perder
            precisión en ninguno— es lo que hace que un proyecto con IA se traduzca en resultados
            de negocio medibles, no solo en tecnología llamativa.
          </p>
          <p>
            Sigo aprendiendo de forma constante. El terreno de la IA cambia cada pocos meses, y
            mantenerme al día no es una opción, es parte del oficio. Prefiero eso: un trabajo que
            exige seguir pensando.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
