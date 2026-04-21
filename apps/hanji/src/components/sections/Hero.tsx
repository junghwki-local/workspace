import Image from "next/image";
import { siteContent } from "@/content/placeholder";

export function Hero() {
  const { titleKo, taglineKo, taglineEn, ctaLabel, imageSrc, imageAlt } = siteContent.hero;

  return (
    <section
      id="top"
      className="bg-bg relative flex min-h-[100svh] flex-col justify-center overflow-hidden pt-24 pb-16 md:pt-32"
      aria-label="히어로"
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-5 md:grid-cols-[1fr_auto] md:gap-16 md:px-10">
        <div className="flex flex-col gap-6 md:order-1">
          <h1
            data-gs="hero-title"
            className="text-ink font-serif text-4xl leading-tight md:text-6xl lg:text-7xl"
          >
            {titleKo}
          </h1>
          <div data-gs="hero-tagline" className="flex flex-col gap-1">
            <p className="text-ink-soft text-base md:text-lg">{taglineKo}</p>
            <p className="text-ink-faint text-xs tracking-[0.2em] md:text-sm">{taglineEn}</p>
          </div>
        </div>

        <div
          data-gs="hero-image"
          className="relative aspect-[3/4] w-full md:order-2 md:w-[420px] lg:w-[520px]"
        >
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            priority
            sizes="(min-width: 1024px) 520px, (min-width: 768px) 420px, 100vw"
            className="object-contain"
          />
        </div>
      </div>

      <a
        data-gs="hero-cta"
        href="#philosophy"
        className="text-ink-soft mx-auto mt-16 flex flex-col items-center gap-2 text-xs tracking-[0.25em] md:mt-20"
      >
        <span>{ctaLabel}</span>
        <span aria-hidden className="bg-ink-faint block h-10 w-px" />
      </a>
    </section>
  );
}
