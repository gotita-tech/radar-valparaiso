"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  Bot,
  FileCode2,
  Braces,
  Layers,
  Atom,
  Triangle,
  Container,
  Database,
  Terminal,
} from "lucide-react";

const stack = [
  { name: "OpenAI", icon: Sparkles },
  { name: "Claude", icon: Bot },
  { name: "Python", icon: Terminal },
  { name: "JavaScript", icon: Braces },
  { name: "TypeScript", icon: FileCode2 },
  { name: "Next.js", icon: Layers },
  { name: "React", icon: Atom },
  { name: "Vercel", icon: Triangle },
  { name: "Docker", icon: Container },
  { name: "PostgreSQL", icon: Database },
];

export default function TechStack() {
  return (
    <section className="relative py-24 md:py-32 bg-ink-950 border-y border-white/[0.06]">
      <div className="max-w-content mx-auto px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.3 }}
          className="text-center mb-14"
        >
          <span className="font-jp text-gold text-xs tracking-widest2 uppercase">Herramientas</span>
          <h2 className="font-serif text-3xl md:text-4xl text-paper mt-4">Con qué trabajo</h2>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {stack.map((tech, i) => {
            const Icon = tech.icon;
            return (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.25, delay: (i % 5) * 0.05 }}
                className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/[0.06] bg-ink-900/40 py-7 hover:border-gold/40 hover:bg-ink-900/70 transition-colors duration-300"
              >
                <Icon size={22} strokeWidth={1.25} className="text-gold" />
                <span className="text-xs tracking-wide text-paper-dim">{tech.name}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
