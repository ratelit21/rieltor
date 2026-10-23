"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { apartments, roomLabel } from "../apartments";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const roomsOptions = [
  ["all", "Все"], ["0", "Студия"], ["1", "1 комната"],
  ["2", "2 комнаты"], ["3", "3+ комнаты"],
] as const;
const areaOptions = [
  ["all", "Любая"], ["small", "до 65 м²"],
  ["middle", "65–80 м²"], ["large", "от 80 м²"],
] as const;

export default function Catalogue() {
  const root = useRef<HTMLElement>(null);
  const [rooms, setRooms] = useState("all");
  const [area, setArea] = useState("all");
  const filtered = useMemo(() => apartments.filter((item) => {
    const roomMatch = rooms === "all" || (rooms === "3" ? item.rooms >= 3 : item.rooms === Number(rooms));
    const areaMatch = area === "all" || (area === "small" ? item.area < 65 :
      area === "middle" ? item.area >= 65 && item.area < 80 : item.area >= 80);
    return roomMatch && areaMatch;
  }), [rooms, area]);

  useGSAP(() => {
    const container = root.current;
    if (!container) return;
    const media = gsap.matchMedia();
    media.add("(min-width: 901px) and (prefers-reduced-motion: no-preference)", () => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-listing]", container);
      for (const card of cards) {
        const frame = card.querySelector<HTMLElement>(".listing-image");
        const copy = card.querySelector<HTMLElement>(".listing-copy");
        if (!frame || !copy) continue;
        gsap.fromTo(frame,
          { clipPath: "inset(0 8% 0 8%)", y: 28 },
          { clipPath: "inset(0 0% 0 0%)", y: 0, duration: 1.25, ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 88%", once: true } },
        );
        gsap.fromTo(copy, { y: 20, opacity: 0.65 },
          { y: 0, opacity: 1, duration: 1, ease: "power2.out",
            scrollTrigger: { trigger: card, start: "top 84%", once: true } },
        );
      }
      ScrollTrigger.refresh();
    });
    return () => media.revert();
  }, { scope: root, dependencies: [rooms, area], revertOnUpdate: true });

  return (
    <section className="catalogue" ref={root} aria-label="Каталог демонстрационных квартир">
      <div className="filters">
        <fieldset><legend>Комнатность</legend>
          {roomsOptions.map(([value, label]) =>
            <button key={value} type="button" aria-pressed={rooms === value} onClick={() => setRooms(value)}>{label}</button>,
          )}
        </fieldset>
        <fieldset><legend>Площадь</legend>
          {areaOptions.map(([value, label]) =>
            <button key={value} type="button" aria-pressed={area === value} onClick={() => setArea(value)}>{label}</button>,
          )}
        </fieldset>
        <p className="filters__count">Найдено <strong>{filtered.length}</strong></p>
      </div>

      {filtered.length ? (
        <div className="listing-grid">
          {filtered.map((item, index) => (
            <article className="listing" data-listing key={item.slug}>
              <Link className="listing-image" href={`/kvartiry/${item.slug}`} aria-label={`Подробнее: ${item.name}`}>
                <Image src={item.image} alt={`Планировка «${item.name}»`} fill
                  sizes="(max-width: 720px) 100vw, 50vw" priority={index === 0} />
              </Link>
              <div className="listing-copy">
                <p>{roomLabel(item.rooms)} · {item.area} м²</p>
                <h2>{item.name}</h2>
                <span>{item.district}</span>
                <p>{item.description}</p>
                <Link href={`/kvartiry/${item.slug}`}><span className="listing-copy__action-label">Смотреть вариант</span><span className="listing-copy__arrow" aria-hidden="true">↗</span></Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty">
          <p className="eyebrow">Ничего не найдено</p>
          <h2>Измените <em>условия.</em></h2>
          <button type="button" onClick={() => { setRooms("all"); setArea("all"); }}>Сбросить фильтры</button>
        </div>
      )}
    </section>
  );
}
