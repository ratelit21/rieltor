"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, ViewTransition, useState } from "react";
import { apartments } from "../apartments";

function SelectionForm() {
  const params = useSearchParams();
  const selected = apartments.find((item) => item.slug === params.get("apartment"));
  const [note, setNote] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setNote(
      form.get("name") && form.get("contact")
        ? "Демо-форма заполнена. Заявка не отправлена: подключение появится после настройки сервера."
        : "Укажите имя и способ связи, чтобы продолжить.",
    );
  }

  return (
    <main className="contact">
      <header className="page-nav">
        <Link className="brand" href="/" aria-label="На главную">К.</Link>
        <span className="page-nav__label">Личный разговор</span>
        <Link className="nav-cta" href="/kvartiry">Подборка</Link>
      </header>

      <section className="contact-frame" aria-labelledby="contact-title">
        <div className="contact-story">
          <p className="eyebrow">Личный подбор · Уфа</p>
          <h1 id="contact-title">Давайте<br /><em>поговорим.</em></h1>
          <p className="contact-story__lead">
            Расскажите, какую квартиру ищете. Я помогу разобраться в вариантах,
            планировках и условиях — без длинных списков и лишнего шума.
          </p>
          {selected && (
            <div className="selected">
              <span className="selected__label">Выбранный вариант</span>
              <strong>{selected.name}</strong>
              <span>{selected.area} м²</span>
            </div>
          )}
          <div className="contact-story__aside">
            <span className="contact-story__rule" aria-hidden="true" />
            <p>От первого вопроса до решения — один человек на связи.</p>
          </div>
        </div>

        <div className="contact-panel">
          <div className="contact-panel__heading">
            <p className="eyebrow">Коротко о главном</p>
            <h2>С чего <em>начнём?</em></h2>
          </div>
          <form onSubmit={submit} noValidate>
            <label>
              Как к вам обращаться?
              <input required name="name" autoComplete="name" placeholder="Ваше имя" />
            </label>
            <label>
              Телефон или Telegram
              <input required name="contact" autoComplete="tel" placeholder="Как удобнее связаться" />
            </label>
            <label>
              Что важно?
              <textarea name="message" rows={3} placeholder="Например: отдельная спальня и много света" />
            </label>
            <button className="primary contact-form__submit" type="submit">Проверить запрос</button>
            <p className="form-note" aria-live="polite">
              {note || "Демонстрационная форма — данные никуда не отправляются."}
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}

export default function SelectionPage() {
  return (
    <ViewTransition default="site-page">
      <Suspense fallback={<main className="contact" />}>
        <SelectionForm />
      </Suspense>
    </ViewTransition>
  );
}
