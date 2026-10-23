import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { apartments, roomLabel } from "../../apartments";

export function generateStaticParams() { return apartments.map(({ slug }) => ({ slug })); }
export default async function ApartmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const apartment = apartments.find((item) => item.slug === slug); if (!apartment) notFound();
  return <ViewTransition default="site-page"><main className="detail"><header className="page-nav"><Link className="brand" href="/">К.</Link><Link href="/kvartiry">К подборке</Link><Link className="nav-cta" href={`/podbor?apartment=${apartment.slug}`}>Обсудить</Link></header><section className="detail-grid"><div><p className="eyebrow">{apartment.district} · демонстрационный вариант</p><h1>{apartment.name}</h1><p className="detail-lead">{apartment.description}</p><dl><div><dt>Формат</dt><dd>{roomLabel(apartment.rooms)}</dd></div><div><dt>Площадь</dt><dd>{apartment.area} м²</dd></div></dl><ul>{apartment.details.map((detail) => <li key={detail}>{detail}</li>)}</ul><Link className="primary" href={`/podbor?apartment=${apartment.slug}`}>Выбрать этот вариант</Link></div><figure><Image src={apartment.image} alt={`Планировка «${apartment.name}»`} fill priority sizes="(max-width: 800px) 100vw, 50vw"/><figcaption>Иллюстративная планировка</figcaption></figure></section></main></ViewTransition>;
}
