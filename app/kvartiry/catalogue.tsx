"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";

const imageBasePath = process.env.GITHUB_ACTIONS === "true" ? "/rieltor" : "";

type RoomFilter = "all" | "studio" | "one" | "two" | "three";
type AreaFilter = "all" | "compact" | "middle" | "large";
type Apartment = { name: string; rooms: 0 | 1 | 2 | 3 | 4; area: number; image: string; description: string; details: string[] };

const apartments: Apartment[] = [
  { name: "Первый свет", rooms: 0, area: 31, image: `${imageBasePath}/images/plan-studio-formatted.webp`, description: "Компактная студия с цельной жилой зоной: всё необходимое остаётся под рукой, а светлая сторона работает на ощущение воздуха.", details: ["единое пространство", "место для хранения", "кухня вдоль стены"] },
  { name: "Тёплый контур", rooms: 1, area: 46, image: `${imageBasePath}/images/plan-one-room-formatted.webp`, description: "Отдельная спальня и спокойная кухня-гостиная. Удобный вариант для одного человека или пары без компромисса с личным пространством.", details: ["отдельная спальня", "кухня-гостиная", "гардеробная у входа"] },
  { name: "Речной силуэт", rooms: 2, area: 61, image: `${imageBasePath}/images/plan-river-formatted.webp`, description: "Светлая общая зона и приватная спальня отделены друг от друга. Планировка для тех, кому важна собранность без тесноты.", details: ["кухня-гостиная", "изолированная спальня", "хранение у входа"] },
  { name: "Городская тишина", rooms: 2, area: 51.1, image: `${imageBasePath}/images/plan-urban-silence.webp`, description: "Исходная планировка из каталога, приведённая к единому виду сайта без перерисовки схемы. Две отдельные комнаты, кухня-гостиная и лоджия.", details: ["две комнаты", "кухня-гостиная", "лоджия"] },
  { name: "Тихий сад", rooms: 2, area: 74, image: `${imageBasePath}/images/plan-garden-formatted.webp`, description: "Две самостоятельные комнаты и большая общая часть. Удобно, когда дома одновременно живут, работают и отдыхают.", details: ["две отдельные комнаты", "гардеробная", "место для большого стола"] },
  { name: "Высота", rooms: 3, area: 87, image: `${imageBasePath}/images/plan-height-formatted.webp`, description: "Три жилые комнаты, два санузла и спокойная кухня-гостиная — для семьи, которой важно личное пространство каждого.", details: ["три комнаты", "два санузла", "общее пространство в центре"] },
  { name: "Семейный масштаб", rooms: 4, area: 112, image: `${imageBasePath}/images/plan-family-formatted.webp`, description: "Большая общая зона, три спальни и кабинет. Планировка, в которой у каждого остаётся своё место, а дом собирает всех вместе.", details: ["три спальни и кабинет", "два санузла", "просторная гостиная"] },
];
const roomOptions: { value: RoomFilter; label: string }[] = [{ value: "all", label: "Все" }, { value: "studio", label: "Студия" }, { value: "one", label: "1 комната" }, { value: "two", label: "2 комнаты" }, { value: "three", label: "3+ комнаты" }];
const areaOptions: { value: AreaFilter; label: string }[] = [{ value: "all", label: "Любая" }, { value: "compact", label: "до 65 м²" }, { value: "middle", label: "65–80 м²" }, { value: "large", label: "от 80 м²" }];

function matchesRoom(apartment: Apartment, filter: RoomFilter) { return filter === "all" || (filter === "studio" && apartment.rooms === 0) || (filter === "one" && apartment.rooms === 1) || (filter === "two" && apartment.rooms === 2) || (filter === "three" && apartment.rooms >= 3); }
function matchesArea(apartment: Apartment, filter: AreaFilter) { return filter === "all" || (filter === "compact" && apartment.area < 65) || (filter === "middle" && apartment.area >= 65 && apartment.area < 80) || (filter === "large" && apartment.area >= 80); }

export default function Catalogue() {
  const [room, setRoom] = useState<RoomFilter>("all");
  const [area, setArea] = useState<AreaFilter>("all");
  const filtered = useMemo(() => apartments.filter((apartment) => matchesRoom(apartment, room) && matchesArea(apartment, area)), [room, area]);
  const reset = () => { setRoom("all"); setArea("all"); };
  const filtersApplied = room !== "all" || area !== "all";

  return <section className="archive-catalogue" aria-label="Каталог демонстрационных квартир"><div className="archive-filters"><div className="archive-filter-group"><span>Комнатность</span><div>{roomOptions.map((option) => <button key={option.value} type="button" aria-pressed={room === option.value} onClick={() => setRoom(option.value)}>{option.label}</button>)}</div></div><div className="archive-filter-group"><span>Площадь</span><div>{areaOptions.map((option) => <button key={option.value} type="button" aria-pressed={area === option.value} onClick={() => setArea(option.value)}>{option.label}</button>)}</div></div><div className="archive-filters__status"><p>В архиве: <strong>{filtered.length}</strong></p>{filtersApplied ? <button type="button" onClick={reset}>Сбросить</button> : null}</div></div>{filtered.length > 0 ? <div className="archive-list">{filtered.map((apartment, index) => <article className="archive-listing" key={apartment.name}><div className="archive-listing__visual"><Image src={apartment.image} alt={`Иллюстративная планировка «${apartment.name}»`} width={1456} height={1088} sizes="(max-width: 720px) 100vw, 58vw" /><span>Иллюстративная планировка</span></div><div className="archive-listing__copy"><p>0{index + 1} / {apartment.rooms === 0 ? "студия" : `${apartment.rooms} комнаты`} / {apartment.area} м²</p><h2>{apartment.name}</h2><p>{apartment.description}</p><ul>{apartment.details.map((detail) => <li key={detail}>{detail}</li>)}</ul><Link href="/podbor">Обсудить этот вариант <ArrowUpRight aria-hidden="true" /></Link></div></article>)}</div> : <div className="archive-empty"><p className="archive-kicker">Пока пусто</p><h2>Такого примера<br /><em>ещё нет в архиве.</em></h2><p>В рабочем каталоге подборка будет пополняться реальными предложениями. Сейчас можно сбросить фильтры или рассказать о задаче.</p><button type="button" onClick={reset}>Показать все примеры</button></div>}</section>;
}
