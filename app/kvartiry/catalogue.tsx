"use client";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { apartments, roomLabel } from "../apartments";

export default function Catalogue() {
  const [rooms, setRooms] = useState("all"); const [area, setArea] = useState("all");
  const filtered = useMemo(() => apartments.filter((a) => (rooms === "all" || rooms === "3" ? rooms === "3" ? a.rooms >= 3 : true : a.rooms === Number(rooms)) && (area === "all" || area === "small" ? area === "small" ? a.area < 65 : true : area === "middle" ? a.area >= 65 && a.area < 80 : a.area >= 80)), [rooms, area]);
  return <section className="catalogue" aria-label="Каталог демонстрационных квартир"><div className="filters"><fieldset><legend>Комнатность</legend>{[["all","Все"],["0","Студия"],["1","1 комната"],["2","2 комнаты"],["3","3+ комнаты"]].map(([value,label]) => <button key={value} type="button" aria-pressed={rooms===value} onClick={() => setRooms(value)}>{label}</button>)}</fieldset><fieldset><legend>Площадь</legend>{[["all","Любая"],["small","до 65 м²"],["middle","65–80 м²"],["large","от 80 м²"]].map(([value,label]) => <button key={value} type="button" aria-pressed={area===value} onClick={() => setArea(value)}>{label}</button>)}</fieldset><p>Найдено <strong>{filtered.length}</strong></p></div>{filtered.length ? <div className="listing-grid">{filtered.map((a,index) => <article className="listing" key={a.slug}><Link className="listing-image" href={`/kvartiry/${a.slug}`} aria-label={`Подробнее: ${a.name}`}><Image src={a.image} alt={`Планировка «${a.name}»`} fill sizes="(max-width: 700px) 100vw, 50vw" priority={index < 2}/><span>Планировка</span></Link><div className="listing-copy"><p>{roomLabel(a.rooms)} · {a.area} м²</p><h2>{a.name}</h2><span>{a.district}</span><p>{a.description}</p><Link href={`/kvartiry/${a.slug}`}>Смотреть вариант</Link></div></article>)}</div> : <div className="empty"><p className="eyebrow">Ничего не найдено</p><h2>Измените <em>условия.</em></h2><button type="button" onClick={() => {setRooms("all");setArea("all")}}>Сбросить фильтры</button></div>}</section>;
}
