import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Новостройки в Уфе — личное сопровождение",
  description: "Подбор квартиры в новостройке с личным сопровождением риелтора.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
