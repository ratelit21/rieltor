import Catalogue from "./catalogue";
import Link from "next/link";
import { ViewTransition } from "react";

export default function ApartmentsPage() {
  return <ViewTransition default="site-page"><main className="archive-page"><header className="archive-page__nav"><Link className="archive-brand archive-brand--ink" href="/" aria-label="На главную">К.</Link><span>Архив выбора</span><Link className="nav-cta" href="/podbor">Написать</Link></header><section className="archive-page__intro"><p className="archive-kicker">Подборка квартир</p><h1>Варианты,<br /><em>к которым</em><br />стоит вернуться.</h1><p>Это демонстрационные примеры того, как будет выглядеть рабочая подборка. Актуальные данные и статус появятся после наполнения каталога.</p></section><Catalogue /><section className="archive-page__outro"><p className="archive-kicker">Не увидели своё</p><h2>Подбор не заканчивается<br />на том, что уже есть <em>в архиве.</em></h2><Link className="archive-button archive-button--dark" href="/podbor">Рассказать о задаче</Link></section></main></ViewTransition>;
}
