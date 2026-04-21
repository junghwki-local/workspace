import Image from "next/image";
import { siteContent } from "@/content/placeholder";

export function Artist() {
  const { nameKo, nameEn, avatarSrc, bio } = siteContent.artist;

  return (
    <section id="artist" className="bg-bg py-24 md:py-36" aria-labelledby="artist-heading">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-5 md:flex-row md:items-start md:gap-16 md:px-10">
        <div
          data-gs="fade"
          className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full md:h-40 md:w-40"
        >
          <Image
            src={avatarSrc}
            alt={`${nameKo} 작가`}
            fill
            sizes="(min-width: 768px) 160px, 128px"
            className="object-cover"
          />
        </div>

        <div data-gs="fade" className="flex flex-col gap-4 text-center md:text-left">
          <h2 id="artist-heading" className="text-ink font-serif text-2xl md:text-3xl">
            작가 소개
          </h2>
          <p className="text-ink text-base">
            {nameKo} <span className="text-ink-faint text-sm">({nameEn})</span>
          </p>
          <p className="text-ink-soft max-w-xl text-sm leading-loose md:text-base">{bio}</p>
        </div>
      </div>
    </section>
  );
}
