"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { Suspense, ViewTransition } from "react";
import { apartments } from "../apartments";

function SelectionForm() {
  const params = useSearchParams(); const selected = apartments.find((item) => item.slug === params.get("apartment")); const [note, setNote] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); setNote(form.get("name") && form.get("contact") ? "Демо-форма заполнена. Заявка не отправлена: подключение появится после настройки сервера." : "Укажите имя и способ связи, чтобы продолжить."); }
  return <main className="contact"><header className="page-nav page-nav--light"><Link className="brand" href="/">К.</Link><span className="page-nav__label">Личный разговор</span><Link className="nav-cta" href="/kvartiry">Подборка</Link></header><section className="contact-frame"><div><p className="eyebrow">Первый шаг</p><h1>Давайте<br/><em>поговорим.</em></h1><p>Опишите, какая квартира нужна. Отвечу лично и без авторассылок.</p>{selected && <p className="selected">Вы выбрали: <strong>{selected.name}</strong>, {selected.area} м²</p>}</div><form onSubmit={submit} noValidate><label>Как к вам обращаться?<input required name="name" autoComplete="name" placeholder="Ваше имя"/></label><label>Телефон или Telegram<input required name="contact" autoComplete="tel" placeholder="Как удобнее связаться"/></label><label>Что важно?<textarea name="message" rows={4} placeholder="Например: отдельная спальня и много света"/></label><button className="primary contact-form__submit" type="submit">Проверить запрос</button><p className="form-note" aria-live="polite">{note || "Демо-форма: данные никуда не отправляются."}</p></form></section></main>;
}

export default function SelectionPage() { return <ViewTransition default="site-page"><Suspense fallback={<main className="contact" />}><SelectionForm /></Suspense></ViewTransition>; }
