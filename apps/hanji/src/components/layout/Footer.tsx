import { siteContent } from "@/content/placeholder";

export function Footer() {
  const { address, tel, email, copyright } = siteContent.footer;

  return (
    <footer className="border-line bg-bg-muted border-t py-10">
      <div className="text-ink-soft mx-auto flex max-w-7xl flex-col gap-6 px-5 text-sm md:flex-row md:items-start md:justify-between md:px-10">
        <div className="flex flex-col gap-1">
          <p className="text-ink font-serif text-base">고려한지 수의</p>
          <p>{address}</p>
          <p>
            Tel. {tel} · <span className="break-all">{email}</span>
          </p>
        </div>

        <div className="flex flex-col gap-3 md:items-end">
          <nav aria-label="푸터 링크">
            <ul className="text-ink-faint flex gap-4 text-xs tracking-[0.1em]">
              <li>
                <a href="#philosophy" className="hover:text-ink">
                  PHILOSOPHY
                </a>
              </li>
              <li>
                <a href="#collection" className="hover:text-ink">
                  COLLECTION
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-ink">
                  CONTACT
                </a>
              </li>
            </ul>
          </nav>
          <p className="text-ink-faint text-xs">{copyright}</p>
        </div>
      </div>
    </footer>
  );
}
