import Image from "next/image";
import { siteContent } from "@/content/placeholder";

export function Collection() {
  const { collection } = siteContent;

  return (
    <section
      id="collection"
      className="bg-surface py-24 md:py-36"
      aria-labelledby="collection-heading"
    >
      <div className="mx-auto max-w-7xl px-5 md:px-10">
        <h2
          id="collection-heading"
          data-gs="fade"
          className="text-ink mb-12 text-center font-serif text-3xl md:mb-16 md:text-4xl"
        >
          작품
        </h2>

        <ul className="grid grid-cols-2 gap-5 md:grid-cols-3 md:gap-8">
          {collection.map((item) => (
            <li key={item.id} data-gs="stagger-item" className="flex flex-col items-center gap-3">
              <div className="bg-bg-panel relative aspect-[3/4] w-full overflow-hidden rounded-sm">
                <Image
                  src={item.imageSrc}
                  alt={item.imageAlt}
                  fill
                  sizes="(min-width: 768px) 33vw, 50vw"
                  className="object-contain"
                />
              </div>
              <div className="text-center">
                <p className="text-ink font-serif text-sm md:text-base">{item.nameKo}</p>
                <p className="text-ink-faint text-[10px] tracking-[0.2em] md:text-xs">
                  ({item.nameEn})
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
