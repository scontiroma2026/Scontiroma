import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, ShoppingBag, Store, User } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
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
      : [
          { to: "/discounts", label: "Sconti" },
          { to: "/dashboard", label: "Il mio account" },
        ]
    : [{ to: "/discounts", label: "Esplora sconti" }];

  return (
    <header data-testid="navbar" className="sticky top-0 z-40 w-full border-b border-warm bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" data-testid="brand-link" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-terracotta text-white font-serif text-lg">S</div>
          <div className="flex flex-col leading-tight">
            <span className="font-serif text-xl font-semibold tracking-tight text-espresso">Sconti Roma</span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-gold">Assaggia la città</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-testid={`nav-${l.label.toLowerCase().replace(/\s+/g,'-')}`}
              className={({ isActive }) =>
                `text-sm transition-colors ${isActive ? "text-terracotta" : "text-espresso/80 hover:text-terracotta"}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <span className="flex items-center gap-2 rounded-full bg-parchment px-3 py-1.5 text-xs text-espresso">
                {isMerchant ? <Store size={14} /> : <User size={14} />}
                {user.name || user.email}
              </span>
              <Button
                data-testid="logout-btn"
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-espresso hover:bg-parchment"
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
                className="text-espresso hover:bg-parchment"
              >
                Accedi
              </Button>
              <Button
                data-testid="register-btn"
                size="sm"
                onClick={() => nav("/register")}
                className="bg-terracotta text-white hover:bg-terracotta/90"
              >
                Iscriviti <ShoppingBag size={14} className="ml-1.5" />
              </Button>
            </>
          )}
        </div>

        <button
          data-testid="mobile-menu-btn"
          className="md:hidden rounded-md p-2 text-espresso"
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
                className="rounded-md px-3 py-2 text-sm text-espresso hover:bg-parchment"
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <button
                onClick={handleLogout}
                className="mt-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-espresso hover:bg-parchment"
              >
                <LogOut size={14} /> Esci
              </button>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm text-espresso hover:bg-parchment">Accedi</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm text-terracotta">Iscriviti</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
