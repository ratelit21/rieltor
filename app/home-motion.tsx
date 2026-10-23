"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type HomeMotionProps = Readonly<{ children: React.ReactNode }>;

export default function HomeMotion({ children }: HomeMotionProps) {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const hero = scope.current?.querySelector<HTMLElement>(".archive-hero");
      const image = scope.current?.querySelector<HTMLElement>(".archive-hero__image img");
      const veil = scope.current?.querySelector<HTMLElement>(".archive-hero__veil");
      const intro = scope.current?.querySelector<HTMLElement>(".archive-intro");
      const nav = scope.current?.querySelector<HTMLElement>(".archive-nav");
      const heading = scope.current?.querySelector<HTMLElement>(".archive-hero h1");
      const kicker = scope.current?.querySelector<HTMLElement>(".archive-hero__copy .archive-kicker");
      const lead = scope.current?.querySelector<HTMLElement>(".archive-hero__lead");
      const actions = scope.current?.querySelector<HTMLElement>(".archive-actions");
      const caption = scope.current?.querySelector<HTMLElement>(".archive-hero__caption");
      const note = scope.current?.querySelector<HTMLElement>(".archive-demo-note");

      if (!hero || !image || !veil || !intro || !nav || !heading || !kicker || !lead || !actions || !caption || !note) return;

      const media = gsap.matchMedia();
      media.add(
        {
          desktop: "(min-width: 721px)",
          reduce: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const { desktop, reduce } = context.conditions as { desktop: boolean; reduce: boolean };
          if (reduce) return;

          gsap.set(image, { animation: "none", transformOrigin: "60% 52%", willChange: "transform" });
          gsap.set(veil, { autoAlpha: 0.15 });
          gsap.set([nav, kicker, lead, actions, caption, note], { autoAlpha: 0, y: 24 });
          gsap.set(heading, { autoAlpha: 0, y: 74, clipPath: "inset(0 0 100% 0)", willChange: "transform, clip-path" });

          gsap.timeline({ defaults: { ease: "power3.out" } })
            .fromTo(image, { scale: 1.2 }, { scale: 1, duration: 2.1, ease: "power2.out" }, 0)
            .to(veil, { autoAlpha: 1, duration: 1.4, ease: "power2.out" }, 0)
            .to(nav, { autoAlpha: 1, y: 0, duration: 0.56 }, 0.18)
            .to(kicker, { autoAlpha: 1, y: 0, duration: 0.48 }, 0.54)
            .to(heading, { autoAlpha: 1, y: 0, clipPath: "inset(0 0 0% 0)", duration: 1.05, ease: "power4.out" }, 0.64)
            .to([lead, actions], { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.12 }, 1.14)
            .to([caption, note], { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.08 }, 1.36);

          if (desktop) {
            gsap.timeline({
              scrollTrigger: {
                trigger: hero,
                start: "top top",
                end: "bottom top",
                scrub: 0.85,
              },
            })
              .to(image, { scale: 1.13, yPercent: 7, ease: "none" }, 0)
              .to(veil, { autoAlpha: 0.42, ease: "none" }, 0)
              .to([kicker, heading, lead, actions, caption, note], { yPercent: -18, autoAlpha: 0, ease: "none", stagger: 0.015 }, 0.42);

            gsap.fromTo(intro, { y: 110, clipPath: "inset(14% 0 0 0)" }, {
              y: 0,
              clipPath: "inset(0% 0 0 0)",
              ease: "power2.out",
              scrollTrigger: { trigger: intro, start: "top 94%", end: "top 38%", scrub: 0.8 },
            });
          }
        },
      );

      return () => media.revert();
    },
    { scope },
  );

  return <main className="archive-home" ref={scope}>{children}</main>;
}
