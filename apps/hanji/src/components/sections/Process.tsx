import Image from "next/image";
import { siteContent } from "@/content/placeholder";

export function Process() {
  const { process } = siteContent;

  return (
    <section id="process" className="bg-bg py-24 md:py-36" aria-labelledby="process-heading">
      <div className="mx-auto max-w-7xl px-5 md:px-10">
        <h2 id="process-heading" className="sr-only">
          과정
        </h2>

        <ul className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
          {process.map((step) => (
            <li key={step.id} data-gs="fade" className="flex flex-col items-center gap-4">
              <div className="bg-surface relative aspect-square w-full overflow-hidden rounded-sm">
                <Image
                  src={step.imageSrc}
                  alt={step.imageAlt}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover"
                  data-gs-parallax
                />
              </div>
              <div className="text-center">
                <p className="text-ink font-serif text-lg">{step.titleKo}</p>
                <p className="text-ink-faint text-xs tracking-[0.2em]">({step.titleEn})</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
