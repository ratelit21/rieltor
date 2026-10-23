import Catalogue from "./catalogue";

export default function ApartmentsPage() {
  return <main className="archive-page"><header className="archive-page__nav"><a className="archive-brand archive-brand--ink" href="/" aria-label="На главную">К.</a><span>Архив выбора</span><a href="/podbor">Написать ↗</a></header><section className="archive-page__intro"><p className="archive-kicker">Подборка квартир</p><h1>Варианты,<br /><em>к которым</em><br />стоит вернуться.</h1><p>Это демонстрационные примеры того, как будет выглядеть рабочая подборка. Актуальные данные и статус появятся после наполнения каталога.</p></section><Catalogue /><section className="archive-page__outro"><p className="archive-kicker">Не увидели своё</p><h2>Подбор не заканчивается<br />на тем, что уже есть <em>в архиве.</em></h2><a className="archive-button archive-button--dark" href="/podbor">Рассказать о задаче <span aria-hidden="true">↗</span></a></section></main>;
}
