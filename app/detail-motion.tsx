"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export default function DetailMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(() => {
    const container = root.current;
    if (!container || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const picture = container.querySelector<HTMLElement>("figure");
    const copy = container.querySelector<HTMLElement>(".detail-grid > div");
    if (picture) {
      gsap.fromTo(picture, { clipPath: "inset(0 6% 0 6%)", y: 24 },
        { clipPath: "inset(0 0% 0 0%)", y: 0, duration: 1.3, ease: "power3.out" });
    }
    if (copy) {
      gsap.fromTo(copy, { y: 16, opacity: 0.85 },
        { y: 0, opacity: 1, duration: 1, ease: "power2.out" });
    }
  }, { scope: root });

  return <section className="detail-grid" ref={root}>{children}</section>;
}
