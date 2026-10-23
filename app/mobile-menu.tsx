"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  return <div className="mobile-menu">
    <button type="button" className="mobile-menu__toggle" aria-label={open ? "Закрыть меню" : "Открыть меню"} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
    </button>
    {open ? <div className="mobile-menu__panel"><Link href="/kvartiry" onClick={() => setOpen(false)}>Подборка</Link><Link href="/podbor" onClick={() => setOpen(false)}>Написать риелтору</Link></div> : null}
  </div>;
}
