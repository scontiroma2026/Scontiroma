import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Clock,
  HelpCircle,
  MessageCircle,
  Shield,
  Store,
} from "lucide-react";

export default function Support() {
  const openMail = "mailto:info@scontiroma.it?subject=Assistenza%20Sconti%20Roma";

  return (
    <main
      data-testid="support-page"
      className="mx-auto max-w-3xl px-6 py-12 text-white/85"
    >
      <Link
        to="/"
        data-testid="support-back"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold hover:text-terracotta transition"
      >
        <ArrowLeft size={14} /> Torna alla home
      </Link>

      <div className="mt-6 border-b border-white/10 pb-6">
        <div className="text-xs uppercase tracking-[0.2em] text-gold">
          Ti diamo una mano
        </div>
        <h1 className="mt-2 font-serif text-4xl sm:text-5xl text-white">
          Centro assistenza
        </h1>
        <p className="mt-3 text-sm text-white/60">
          Rispondiamo entro <strong className="text-white">24 ore</strong> nei
          giorni lavorativi.
        </p>
      </div>

      {/* Main CTA */}
      <a
        data-testid="support-mail-cta"
        href={openMail}
        className="mt-8 group flex items-center gap-4 rounded-2xl border border-fucsia/30 bg-gradient-to-br from-fucsia/15 to-viola/10 p-6 hover:border-fucsia/60 transition"
      >
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-fucsia/20 text-fucsia">
          <Mail size={26} />
        </div>
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wider text-fucsia">
            Scrivici — apri la tua app di posta
          </div>
          <div className="mt-1 font-serif text-2xl text-white group-hover:text-fucsia transition">
            info@scontiroma.it
          </div>
          <div className="mt-1 text-xs text-white/60">
            Hai bisogno di aiuto? Scrivici a{" "}
            <strong className="text-white">info@scontiroma.it</strong>, ti
            risponderemo entro 24 ore!
          </div>
        </div>
      </a>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white/60">
        <Clock size={14} className="text-gold" />
        Lun-Ven 9:00-19:00 · Sab 10:00-14:00 · Chiuso domenica e festivi
      </div>

      {/* Info categories */}
      <h2 className="mt-10 font-serif text-2xl text-white">
        Chi devo scrivere?
      </h2>

      <div className="mt-4 grid gap-3">
        <ContactRow
          testid="row-info"
          icon={<MessageCircle size={18} />}
          color="fucsia"
          title="Assistenza generale"
          email="info@scontiroma.it"
          note="Problemi di login, pagamento, uso dei QR, domande sugli sconti"
        />
        <ContactRow
          testid="row-privacy"
          icon={<Shield size={18} />}
          color="ciano"
          title="Privacy e dati personali (GDPR)"
          email="privacy@scontiroma.it"
          note="Cancellazione account, export dati, revoca consensi, reclamo"
        />
        <ContactRow
          testid="row-partner"
          icon={<Store size={18} />}
          color="neon"
          title="Commercianti e partner"
          email="partner@scontiroma.it"
          note="Aggiungere / modificare / rimuovere il tuo negozio, richieste B2B"
        />
      </div>

      {/* FAQ shortcut */}
      <div
        data-testid="support-links"
        className="mt-10 rounded-2xl border border-white/10 bg-black/40 p-6"
      >
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gold">
          <HelpCircle size={14} /> Documenti utili
        </div>
        <ul className="mt-3 space-y-2 text-sm">
          <li>
            <Link
              to="/recesso"
              className="text-white/80 hover:text-fucsia underline-offset-4 hover:underline"
            >
              → Come annullare l'abbonamento (Diritto di Recesso 14 giorni)
            </Link>
          </li>
          <li>
            <Link
              to="/termini"
              className="text-white/80 hover:text-fucsia underline-offset-4 hover:underline"
            >
              → Termini e Condizioni d'Uso
            </Link>
          </li>
          <li>
            <Link
              to="/privacy"
              className="text-white/80 hover:text-fucsia underline-offset-4 hover:underline"
            >
              → Privacy Policy
            </Link>
          </li>
          <li>
            <Link
              to="/cookies"
              className="text-white/80 hover:text-fucsia underline-offset-4 hover:underline"
            >
              → Cookie Policy
            </Link>
          </li>
        </ul>
      </div>
    </main>
  );
}

function ContactRow({ testid, icon, color, title, email, note }) {
  const colorMap = {
    fucsia: "text-fucsia border-fucsia/30 bg-fucsia/10",
    ciano: "text-ciano border-ciano/30 bg-ciano/10",
    neon: "text-neon border-neon/30 bg-neon/10",
  };
  return (
    <a
      data-testid={testid}
      href={`mailto:${email}`}
      className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/40 p-4 hover:border-white/25 transition"
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${colorMap[color]}`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white">{title}</div>
        <div className={`mt-0.5 text-sm ${colorMap[color].split(" ")[0]} truncate`}>
          {email}
        </div>
        <div className="mt-1 text-xs text-white/60">{note}</div>
      </div>
    </a>
  );
}
