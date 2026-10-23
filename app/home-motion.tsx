"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type HomeMotionProps = Readonly<{ children: React.ReactNode }>;

export default function HomeMotion({ children }: HomeMotionProps) {
  const scope = useRef<HTMLElement>(null);

  useGSAP(() => {
    const root = scope.current;
    if (!root) return;
    const hero = root.querySelector<HTMLElement>(".archive-hero");
    const photo = root.querySelector<HTMLElement>(".archive-hero__image img");
    const intro = root.querySelector<HTMLElement>(".archive-intro");
    const heading = root.querySelector<HTMLElement>(".archive-hero h1");
    if (!hero || !photo || !intro || !heading) return;

    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      // Keep all text visible before hydration: no hidden-first-frame layout.
      gsap.fromTo(photo, { scale: 1.12 }, { scale: 1, duration: 2, ease: "power2.out" });
      gsap.fromTo(heading,
        { y: 24, clipPath: "inset(0 0 13% 0)" },
        { y: 0, clipPath: "inset(0 0 0% 0)", duration: 1.15, delay: 0.14, ease: "power3.out" },
      );
      const lead = root.querySelectorAll<HTMLElement>(".archive-hero__lead, .archive-actions");
      gsap.fromTo(lead, { y: 14, opacity: 0.85 }, { y: 0, opacity: 1, duration: 0.9, delay: 0.5, stagger: 0.13, ease: "power2.out" });

      const desktop = gsap.matchMedia();
      desktop.add("(min-width: 901px)", () => {
        gsap.to(photo, {
          scale: 1.15,
          yPercent: 5,
          ease: "none",
          scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.8 },
        });
        gsap.fromTo(intro, { y: 85, clipPath: "inset(0 5% 0 5%)" }, {
          y: 0, clipPath: "inset(0 0% 0 0%)", ease: "none",
          scrollTrigger: { trigger: intro, start: "top 98%", end: "top 30%", scrub: 0.65 },
        });
      });
      return () => desktop.revert();
    });

    return () => media.revert();
  }, { scope });

  return <main className="archive-home" ref={scope}>{children}</main>;
}
