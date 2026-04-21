import type { SiteContent } from "./types";

export const siteContent: SiteContent = {
  site: {
    brand: "고려한지 수의",
    tagline: {
      ko: "전통과 현대가 만나는 정갈한 아름다움",
      en: "WHERE TRADITION MEETS SERENITY",
    },
    navLabels: [
      { id: "philosophy", ko: "철학", en: "PHILOSOPHY" },
      { id: "process", ko: "과정", en: "PROCESS" },
      { id: "collection", ko: "작품", en: "COLLECTION" },
      { id: "artist", ko: "아티스트", en: "ARTIST" },
      { id: "contact", ko: "문의", en: "CONTACT" },
    ],
  },
  hero: {
    titleKo: "고려한지 수의",
    taglineKo: "전통과 현대가 만나는 정갈한 아름다움",
    taglineEn: "WHERE TRADITION MEETS SERENITY",
    ctaLabel: "EXPLORE",
    imageSrc: "/placeholder/hero.svg",
    imageAlt: "한지 수의",
  },
  philosophy: {
    heading: "천년의 숨결을 간직한 한지,\n영원한 안식을 위한 고결한 예복.",
    body: "고려한지 수의는 전통 한지의 장인 정신과 현대적 감각을 접목하여, 고인의 마지막 길을 가장 정갈하고 품격 있게 배웅할 수 있도록 고안된 장례 예복입니다. 한 장 한 장 수작업으로 떠낸 닥섬유 한지 위에 전통 자수 기법을 더해, 세월이 흘러도 변하지 않는 고요한 아름다움을 담았습니다.",
  },
  process: [
    {
      id: "papermaking",
      titleKo: "제지",
      titleEn: "Papermaking",
      imageSrc: "/placeholder/process-1.svg",
      imageAlt: "전통 제지 과정",
    },
    {
      id: "sewing",
      titleKo: "봉제",
      titleEn: "Sewing",
      imageSrc: "/placeholder/process-2.svg",
      imageAlt: "수작업 봉제 과정",
    },
    {
      id: "creation",
      titleKo: "창작",
      titleEn: "Creation",
      imageSrc: "/placeholder/process-3.svg",
      imageAlt: "디자인 창작 과정",
    },
  ],
  collection: [
    {
      id: "soonbaek",
      nameKo: "순백",
      nameEn: "Pure White",
      imageSrc: "/placeholder/garment-1.svg",
      imageAlt: "순백 수의",
    },
    {
      id: "danye",
      nameKo: "단아",
      nameEn: "Serenity",
      imageSrc: "/placeholder/garment-2.svg",
      imageAlt: "단아 수의",
    },
    {
      id: "gowon",
      nameKo: "고원",
      nameEn: "Nobility",
      imageSrc: "/placeholder/garment-3.svg",
      imageAlt: "고원 수의",
    },
    {
      id: "suhye",
      nameKo: "수혜",
      nameEn: "Grace",
      imageSrc: "/placeholder/garment-4.svg",
      imageAlt: "수혜 수의",
    },
    {
      id: "goryeom",
      nameKo: "고렴",
      nameEn: "Dignity",
      imageSrc: "/placeholder/garment-5.svg",
      imageAlt: "고렴 수의",
    },
    {
      id: "pungryu",
      nameKo: "풍류",
      nameEn: "Elegance",
      imageSrc: "/placeholder/garment-6.svg",
      imageAlt: "풍류 수의",
    },
  ],
  artist: {
    nameKo: "이영희",
    nameEn: "Lee Young-hee",
    avatarSrc: "/placeholder/artist.svg",
    bio: "40년간 한지 공예 외길을 걸어온 장인. 무형문화재 전수자로서 전통 한지 제작 기법을 현대적으로 재해석하여, 수의라는 엄숙한 예복 속에 한국의 정서와 미감을 담아내고 있습니다. 국내외 다수의 전시와 학회에 참여하며 한지의 가치를 알리는 데 힘쓰고 있습니다.",
  },
  contact: {
    heading: "문의 및 상담 예약",
  },
  footer: {
    address: "서울특별시 종로구 인사동길 00",
    tel: "02-000-0000",
    email: "hello@goryeohanji.kr",
    copyright: "© 2026 고려한지 수의. All Rights Reserved.",
  },
};
