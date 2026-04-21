import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Philosophy } from "@/components/sections/Philosophy";
import { Process } from "@/components/sections/Process";
import { Collection } from "@/components/sections/Collection";
import { Artist } from "@/components/sections/Artist";
import { Contact } from "@/components/sections/Contact";
import { SectionAnimations } from "@/components/animations/SectionAnimations";

export default function Page() {
  return (
    <>
      <a
        href="#main"
        className="focus:bg-ink focus:text-bg sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded focus:px-4 focus:py-2"
      >
        본문 바로가기
      </a>

      <Header />

      <main id="main">
        <Hero />
        <Philosophy />
        <Process />
        <Collection />
        <Artist />
        <Contact />
      </main>

      <Footer />

      <SectionAnimations />
    </>
  );
}
