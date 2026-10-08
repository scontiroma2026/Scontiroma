import { Link, NavLink } from "react-router-dom";
import { LogOut, Menu, Store, X } from "lucide-react";
import BrandMark from "@/components/BrandMark";

/**
 * Barra in alto dell'area commerciante (variante «Bianco vivo»): fondo bianco,
 * filo colorato fucsia-viola-teal, titolo in Fraunces, «AREA COMMERCIANTE» in viola.
 * Stessi collegamenti e stessi data-testid della barra scura usata nel resto del sito.
 */
export default function NavbarCommerciante({ user, navLinks, open, setOpen, onLogout }) {
  return (
    <header
      data-testid="navbar"
      className="sticky top-0 z-40 w-full bg-white"
      style={{ borderBottom: "3px solid transparent", borderImage: "linear-gradient(90deg,#D6355C,#F4A81D,#0E8FA8) 1" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" data-testid="brand-link" className="flex min-h-11 items-center gap-2.5">
          <BrandMark iconOnly className="text-[26px] text-ac-ink" />
          <span className="flex flex-col leading-tight">
            <span className="font-serif text-lg font-bold text-ac-ink">Sconti Roma</span>
            <span className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-ac-teal">Area commerciante</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Menu principale">
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-testid={`nav-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={({ isActive }) =>
                `flex min-h-11 items-center rounded-xl px-4 text-sm font-bold transition-colors ${
                  isActive ? "bg-ac-rosaSoft text-ac-rosa" : "text-ac-soft hover:bg-ac-tint hover:text-ac-ink"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <span className="flex min-h-11 items-center gap-2 rounded-full border border-ac-line bg-ac-tint px-4 text-xs font-bold text-ac-ink">
            <Store size={14} className="text-ac-teal" />
            {user.name || user.email}
          </span>
          <button
            type="button"
            data-testid="logout-btn"
            onClick={onLogout}
            className="flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-ac-soft hover:bg-ac-tint hover:text-ac-ink"
          >
            <LogOut size={16} /> Esci
          </button>
        </div>

        <button
          type="button"
          data-testid="mobile-menu-btn"
          aria-label={open ? "Chiudi il menu" : "Apri il menu"}
          aria-expanded={open}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-ac-line bg-ac-tint text-ac-ink md:hidden"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-ac-line bg-white md:hidden">
          <div className="flex flex-col gap-1 px-4 py-3">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex min-h-12 items-center rounded-xl px-4 text-base font-bold ${
                    isActive ? "bg-ac-rosaSoft text-ac-rosa" : "text-ac-ink hover:bg-ac-tint"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={onLogout}
              className="mt-1 flex min-h-12 items-center gap-2 rounded-xl px-4 text-base font-bold text-ac-soft hover:bg-ac-tint"
            >
              <LogOut size={16} /> Esci
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
