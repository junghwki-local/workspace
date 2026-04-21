import { siteContent } from "@/content/placeholder";

export function Philosophy() {
  const { heading, body } = siteContent.philosophy;

  return (
    <section
      id="philosophy"
      className="bg-surface py-24 md:py-36"
      aria-labelledby="philosophy-heading"
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-5 text-center md:px-10">
        <h2
          id="philosophy-heading"
          data-gs="fade"
          className="text-ink font-serif text-2xl leading-[1.5] whitespace-pre-line md:text-4xl"
        >
          {heading}
        </h2>
        <p data-gs="fade" className="text-ink-soft max-w-2xl text-sm leading-loose md:text-base">
          {body}
        </p>
      </div>
    </section>
  );
}
