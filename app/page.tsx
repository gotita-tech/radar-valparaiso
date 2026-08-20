import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Services from "@/components/Services";
import Methodology from "@/components/Methodology";
import Projects from "@/components/Projects";
import TechStack from "@/components/TechStack";
import ValueProposition from "@/components/ValueProposition";
import CTAFinal from "@/components/CTAFinal";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Services />
        <Methodology />
        <Projects />
        <TechStack />
        <ValueProposition />
        <CTAFinal />
      </main>
      <Footer />
    </>
  );
}
