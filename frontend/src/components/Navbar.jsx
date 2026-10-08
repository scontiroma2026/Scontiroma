import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, ShoppingBag, Store, User } from "lucide-react";
import { useState } from "react";
import BrandMark from "@/components/BrandMark";
import NavbarCommerciante from "@/components/NavbarCommerciante";
import { useInAreaCommerciante } from "@/components/AreaCommercianteClasse";

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const inAreaCommerciante = useInAreaCommerciante();
  const isMerchant = user && user.role === "merchant";

  const handleLogout = async () => {
    await logout();
    nav("/");
  };

  const navLinks = user
    ? isMerchant
      ? [
          { to: "/merchant/dashboard", label: "Dashboard" },
          { to: "/merchant/discount", label: "Il mio sconto" },
          { to: "/merchant/scan", label: "Scansiona" },
        ]
      : user.role === "admin"
      ? [{ to: "/admin", label: "Admin" }]
      : [
          { to: "/discounts", label: "Sconti" },
          { to: "/map", label: "Mappa" },
          { to: "/dashboard", label: "Il mio account" },
        ]
    : [
        { to: "/discounts", label: "Esplora sconti" },
        { to: "/map", label: "Mappa" },
      ];

  // Nell'area commerciante la barra è chiara (variante «Bianco vivo»); altrove resta quella scura.
  if (isMerchant && inAreaCommerciante) {
    return <NavbarCommerciante user={user} navLinks={navLinks} open={open} setOpen={setOpen} onLogout={handleLogout} />;
  }

  return (
    <header data-testid="navbar" className="sticky top-0 z-40 w-full border-b border-border bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" data-testid="brand-link" className="flex items-center gap-2">
          <div className="grad-fucsia-viola flex h-10 w-10 items-center justify-center rounded-2xl text-white font-serif text-lg glow-fucsia">S</div>
          <div className="flex flex-col leading-tight">
            <BrandMark inline className="text-xl tracking-tight text-foreground" />
            <span className="mt-0.5 text-[11px] uppercase tracking-[0.18em] text-ciano">Roma è tua</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-testid={`nav-${l.label.toLowerCase().replace(/\s+/g,'-')}`}
              className={({ isActive }) =>
                `text-sm transition-colors ${isActive ? "text-fucsia" : "text-muted-foreground hover:text-fucsia"}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <span className="flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-xs text-foreground">
                {isMerchant ? <Store size={14} className="text-ciano" /> : <User size={14} className="text-fucsia" />}
                {user.name || user.email}
              </span>
              <Button
                data-testid="logout-btn"
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-foreground hover:bg-muted"
              >
                <LogOut size={16} className="mr-1.5" /> Esci
              </Button>
            </>
          ) : (
            <>
              <Button
                data-testid="login-btn"
                variant="ghost"
                size="sm"
                onClick={() => nav("/login")}
                className="text-foreground hover:bg-muted"
              >
                Accedi
              </Button>
              <Button
                data-testid="register-btn"
                size="sm"
                onClick={() => nav("/register")}
                className="grad-fucsia-viola text-white hover:scale-105 transition rounded-full glow-fucsia"
              >
                Iscriviti <ShoppingBag size={14} className="ml-1.5" />
              </Button>
            </>
          )}
        </div>

        <button
          data-testid="mobile-menu-btn"
          className="md:hidden inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-espresso"
          onClick={() => setOpen(!open)}
        >
          <Menu size={22} />
        </button>
      </div>

      {open && (
        <div className="border-t border-warm bg-cream md:hidden">
          <div className="flex flex-col gap-1 px-6 py-4">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center rounded-md px-3 text-sm text-espresso hover:bg-parchment"
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <button
                onClick={handleLogout}
                className="mt-2 flex min-h-11 items-center gap-2 rounded-md px-3 text-sm text-espresso hover:bg-parchment"
              >
                <LogOut size={14} /> Esci
              </button>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-md px-3 text-sm text-espresso hover:bg-parchment">Accedi</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-md px-3 text-sm font-semibold text-terracotta">Iscriviti</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
