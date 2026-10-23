export type Apartment = { slug: string; name: string; rooms: number; area: number; image: string; district: string; description: string; details: string[] };
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const apartments: Apartment[] = [
  { slug: "pervyy-svet", name: "Первый свет", rooms: 0, area: 31, image: `${base}/images/plan-studio-formatted.webp`, district: "Зелёная роща", description: "Компактная студия с цельной жилой зоной и светлой стороной.", details: ["единое пространство", "место для хранения", "кухня вдоль стены"] },
  { slug: "teplyy-kontur", name: "Тёплый контур", rooms: 1, area: 46, image: `${base}/images/plan-one-room-formatted.webp`, district: "Центр", description: "Отдельная спальня и спокойная кухня-гостиная для одного человека или пары.", details: ["отдельная спальня", "кухня-гостиная", "гардеробная у входа"] },
  { slug: "rechnoy-siluet", name: "Речной силуэт", rooms: 2, area: 61, image: `${base}/images/plan-river-formatted.webp`, district: "Затон", description: "Светлая общая зона и приватные комнаты в собранной планировке.", details: ["кухня-гостиная", "изолированные комнаты", "хранение у входа"] },
  { slug: "gorodskaya-tishina", name: "Городская тишина", rooms: 2, area: 51.1, image: `${base}/images/plan-urban-silence.webp`, district: "Проспект Октября", description: "Две отдельные комнаты, кухня-гостиная и лоджия без лишней площади.", details: ["две комнаты", "кухня-гостиная", "лоджия"] },
  { slug: "tihiy-sad", name: "Тихий сад", rooms: 2, area: 74, image: `${base}/images/plan-garden-formatted.webp`, district: "Южный", description: "Две самостоятельные комнаты и большая общая часть для жизни и работы.", details: ["две отдельные комнаты", "гардеробная", "место для большого стола"] },
  { slug: "vysota", name: "Высота", rooms: 3, area: 87, image: `${base}/images/plan-height-formatted.webp`, district: "Инорс", description: "Три жилые комнаты, два санузла и тихая кухня-гостиная для семьи.", details: ["три комнаты", "два санузла", "общее пространство"] },
];
export const roomLabel = (rooms: number) => rooms === 0 ? "студия" : `${rooms} комн.`;
