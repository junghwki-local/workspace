export interface SiteContent {
  site: {
    brand: string;
    tagline: { ko: string; en: string };
    navLabels: Array<{ id: NavId; ko: string; en: string }>;
  };
  hero: {
    titleKo: string;
    taglineKo: string;
    taglineEn: string;
    ctaLabel: string;
    imageSrc: string;
    imageAlt: string;
  };
  philosophy: {
    heading: string;
    body: string;
  };
  process: ProcessStep[];
  collection: CollectionItem[];
  artist: {
    nameKo: string;
    nameEn: string;
    avatarSrc: string;
    bio: string;
  };
  contact: {
    heading: string;
  };
  footer: {
    address: string;
    tel: string;
    email: string;
    copyright: string;
  };
}

export type NavId = "philosophy" | "process" | "collection" | "artist" | "contact";

export interface ProcessStep {
  id: string;
  titleKo: string;
  titleEn: string;
  imageSrc: string;
  imageAlt: string;
}

export interface CollectionItem {
  id: string;
  nameKo: string;
  nameEn: string;
  imageSrc: string;
  imageAlt: string;
}
