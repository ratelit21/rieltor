import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import HomeMotion from "./home-motion";
import MobileMenu from "./mobile-menu";

const imageBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function Home() {
  return (
    <ViewTransition default="site-page"><HomeMotion>
      <section className="archive-hero" aria-labelledby="hero-title">
        <div className="archive-hero__image" aria-hidden="true"><Image src={`${imageBasePath}/images/hero-architecture.png`} alt="" fill priority sizes="100vw" /></div>
        <div className="archive-hero__veil" aria-hidden="true" />
        <header className="archive-nav" data-hero-enter><Link className="archive-brand" href="/" aria-label="На главную">К.</Link><p>Личная подборка<br />новостроек Уфы</p><nav aria-label="Основная навигация"><Link href="/kvartiry">Подборка</Link><Link href="/podbor">Написать</Link></nav><MobileMenu /></header>
        <div className="archive-hero__copy" data-hero-enter><p className="archive-kicker">Выбор без витрины</p><h1 id="hero-title">Не просто<br /><em>новая квартира.</em></h1><p className="archive-hero__lead">Собираю новостройки, в которых есть смысл жить: разбираю планировки, условия и нюансы до того, как вы примете решение.</p><div className="archive-actions"><Link className="archive-button" href="/kvartiry">Открыть подборку</Link><Link className="archive-text-link" href="/podbor">Обсудить свой запрос</Link></div></div>
        <div className="archive-hero__caption" data-hero-enter><span>01—</span><p>Тот самый дом начинается<br />с ясного выбора.</p></div><p className="archive-demo-note" data-hero-enter>Демонстрационная версия · предложения — примеры оформления</p>
      </section>
      <section className="archive-intro" aria-labelledby="intro-title"><p className="archive-kicker">Как устроен подбор</p><h2 id="intro-title">Сначала <em>суть</em>,<br />потом метры.</h2><div className="archive-intro__body"><p>Не отправляю длинные списки. Отбираю варианты, объясняю, чем они отличаются, и остаюсь рядом до ключей.</p><Link className="intro-cta" href="/kvartiry">Смотреть текущую подборку</Link></div></section>
      <section className="archive-principles" aria-label="Принципы работы"><article><span>01</span><h3>Планировка<br />в масштабе жизни</h3><p>Смотрим не на рекламную схему, а на свет, хранение и ежедневные сценарии.</p></article><article><span>02</span><h3>Спокойный<br />разговор</h3><p>Можно задать любой вопрос и не торопиться с решением.</p></article><article><span>03</span><h3>Один человек<br />на связи</h3><p>От первого варианта до договора — без переводов между отделами.</p></article></section>
      <section className="archive-callout"><p className="archive-kicker">Если в подборке нет своего</p><h2>Расскажите,<br /><em>что должно совпасть.</em></h2><Link className="archive-button archive-button--dark" href="/podbor">Написать риелтору</Link></section>
    </HomeMotion></ViewTransition>
  );
}
