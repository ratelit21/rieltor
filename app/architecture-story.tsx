"use client";

import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const chapters = [
  {
    number: "01",
    label: "Свет",
    heading: <>Свет, который <em>остаётся.</em></>,
    text: "Смотрим, куда выходят окна и как живёт пространство в разное время дня. На плане этого не увидеть.",
  },
  {
    number: "02",
    label: "Пространство",
    heading: <>Планировка, в которой <em>удобно.</em></>,
    text: "Проверяем не площадь ради площади, а маршруты, хранение и то, как будет устроен ваш обычный день.",
  },
  {
    number: "03",
    label: "Чувство дома",
    heading: <>Место, куда хочется <em>возвращаться.</em></>,
    text: "Находим баланс между адресом, окружением и ощущением спокойствия. Важна вся картина, не только цена.",
  },
];

export default function ArchitectureStory() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const root = sectionRef.current;
    if (!root) return;

    const picture = root.querySelector<HTMLElement>("[data-story-photo]");
    const blueprint = root.querySelector<HTMLElement>("[data-story-plan]");
    const counter = root.querySelector<HTMLElement>("[data-story-counter]");
    const progress = root.querySelector<HTMLElement>("[data-story-progress]");
    const beats = gsap.utils.toArray<HTMLElement>("[data-story-beat]", root);
    if (!picture || !blueprint || !counter || !progress || beats.length !== 3) return;

    const media = gsap.matchMedia();
    media.add("(min-width: 901px) and (prefers-reduced-motion: no-preference)", () => {
      let active = -1;
      const show = (index: number) => {
        if (active === index) return;
        active = index;
        root.dataset.chapter = String(index + 1);
        counter.textContent = `0${index + 1} / 03`;

        gsap.to(progress, { scaleX: (index + 1) / 3, duration: 0.85, ease: "power3.inOut", overwrite: true });
        gsap.to(picture, {
          xPercent: [0, -5, 4][index],
          yPercent: [0, 3, -2][index],
          scale: [1.09, 1.22, 1.13][index],
          duration: 1.55,
          ease: "power3.inOut",
          overwrite: true,
        });
        gsap.to(blueprint, {
          autoAlpha: index === 1 ? 1 : 0,
          scale: index === 1 ? 1 : 0.93,
          y: index === 1 ? 0 : 24,
          duration: 1.05,
          ease: "power3.inOut",
          overwrite: true,
        });
      };

      show(0);

      const triggers = beats.map((beat, index) =>
        ScrollTrigger.create({
          trigger: beat,
          start: "top 57%",
          end: "bottom 46%",
          onEnter: () => show(index),
          onEnterBack: () => show(index),
        }),
      );
      return () => {
        triggers.forEach((trigger) => trigger.kill());
        gsap.set([picture, blueprint, progress], { clearProps: "all" });
      };
    });

    return () => media.revert();
  }, { scope: sectionRef });

  return (
    <section className="archive-story" id="vzglyad" ref={sectionRef} aria-labelledby="story-title" data-chapter="1">
      <div className="archive-story__top">
        <p className="archive-kicker">Другой взгляд на квартиру</p>
        <p className="archive-story__intro" id="story-title">За каждым удачным выбором стоит <em>внимание к деталям.</em></p>
      </div>

      <div className="archive-story__layout">
        <div className="archive-story__chapters">
          {chapters.map((chapter) => (
            <article className="archive-story__chapter" data-story-beat key={chapter.number}>
              <div className="archive-story__chapter-index">
                <span>{chapter.number}</span>
                <span>{chapter.label}</span>
              </div>
              <h2>{chapter.heading}</h2>
              <p>{chapter.text}</p>
            </article>
          ))}
        </div>

        <div className="archive-story__visual" aria-hidden="true">
          <div className="archive-story__canvas">
            <div className="archive-story__photo" data-story-photo>
              <picture>
                <source media="(max-width: 720px)" srcSet={`${base}/images/hero-architecture-mobile.webp`} />
                <img src={`${base}/images/hero-architecture-desktop.webp`} alt="" width="1920" height="1280" loading="lazy" decoding="async" />
              </picture>
            </div>
            <div className="archive-story__wash" />
            <div className="archive-story__plan" data-story-plan>
              <img src={`${base}/images/plan-river-formatted.webp`} alt="" width="720" height="720" loading="lazy" decoding="async" />
              <span>Планировка · эскиз</span>
            </div>
            <div className="archive-story__corner archive-story__corner--tl" />
            <div className="archive-story__corner archive-story__corner--br" />
            <span className="archive-story__vertical">Личная коллекция / Уфа</span>
            <span className="archive-story__scan">Архитектура повседневности</span>
          </div>
          <div className="archive-story__foot">
            <span>Перспектива</span>
            <div className="archive-story__progress-track"><span data-story-progress /></div>
            <span data-story-counter>01 / 03</span>
          </div>
        </div>
      </div>
      <div className="archive-story__end">
        <span>В каждой детали — смысл.</span>
        <Link href="/kvartiry">Перейти к подборке <span aria-hidden="true">↗</span></Link>
      </div>
    </section>
  );
}
