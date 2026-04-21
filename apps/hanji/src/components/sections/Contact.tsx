import { siteContent } from "@/content/placeholder";
import { ConsultForm } from "@/components/ui/ConsultForm";

export function Contact() {
  const { heading } = siteContent.contact;

  return (
    <section id="contact" className="bg-surface py-24 md:py-36" aria-labelledby="contact-heading">
      <div className="mx-auto flex max-w-xl flex-col gap-8 px-5 md:px-10">
        <h2
          id="contact-heading"
          data-gs="fade"
          className="text-ink text-center font-serif text-2xl md:text-3xl"
        >
          {heading}
        </h2>
        <div data-gs="fade">
          <ConsultForm />
        </div>
      </div>
    </section>
  );
}
