"use client";

import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

export function SectionAnimations() {
  useGSAP(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    // Hero entrance timeline
    const heroTargets = {
      title: document.querySelector<HTMLElement>('[data-gs="hero-title"]'),
      tagline: document.querySelector<HTMLElement>('[data-gs="hero-tagline"]'),
      image: document.querySelector<HTMLElement>('[data-gs="hero-image"]'),
      cta: document.querySelector<HTMLElement>('[data-gs="hero-cta"]'),
    };
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    if (heroTargets.image)
      tl.from(heroTargets.image, { autoAlpha: 0, scale: 0.98, duration: 1.2 }, 0);
    if (heroTargets.title) tl.from(heroTargets.title, { autoAlpha: 0, y: 30, duration: 0.9 }, 0.15);
    if (heroTargets.tagline)
      tl.from(heroTargets.tagline, { autoAlpha: 0, y: 20, duration: 0.7 }, 0.35);
    if (heroTargets.cta) tl.from(heroTargets.cta, { autoAlpha: 0, duration: 0.8 }, 0.6);

    // Generic fade-in on scroll
    const fades = gsap.utils.toArray<HTMLElement>('[data-gs="fade"]');
    fades.forEach((el) => {
      gsap.from(el, {
        autoAlpha: 0,
        y: 24,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });
    });

    // Collection grid stagger
    const staggerItems = gsap.utils.toArray<HTMLElement>('[data-gs="stagger-item"]');
    if (staggerItems.length > 0) {
      const parent = staggerItems[0]?.parentElement ?? undefined;
      gsap.from(staggerItems, {
        autoAlpha: 0,
        y: 24,
        duration: 0.7,
        stagger: 0.08,
        ease: "power2.out",
        scrollTrigger: {
          trigger: parent,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      });
    }

    // Process section parallax: images drift slightly faster than scroll
    const parallaxImages = gsap.utils.toArray<HTMLElement>('[data-gs-parallax]');
    parallaxImages.forEach((el) => {
      gsap.fromTo(
        el,
        { y: 24 },
        {
          y: -24,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    });

    // Header background on scroll
    const header = document.getElementById("site-header");
    if (header) {
      ScrollTrigger.create({
        start: "top -40",
        end: "max",
        onUpdate: (self) => {
          const scrolled = self.scroll() > 40;
          header.classList.toggle("is-scrolled", scrolled);
        },
      });
    }
  }, []);

  return null;
}
