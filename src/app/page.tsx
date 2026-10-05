import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileDock } from "@/components/layout/MobileDock";
import { Casas, Condicoes, Condominio, Contato, Hero, Localizacao } from "@/components/sections/Sections";
import { Lazer } from "@/components/sections/Lazer";
import { Entorno } from "@/components/sections/Entorno";
import { Manifesto } from "@/components/sections/Manifesto";

// Ordem das seções = ordem da copy (docs/ARQUITETURA.md)
export default function Home() {
  return (
    <>
      <Header />
      <main id="topo">
        <Hero />
        <Localizacao />
        <Condominio />
        <Casas />
        <Lazer />
        <Entorno />
        <Condicoes />
        <Manifesto />
        <Contato />
      </main>
      <Footer />
      <MobileDock />
    </>
  );
}
