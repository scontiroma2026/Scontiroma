import { QRCodeSVG } from "qrcode.react";
import { Printer } from "lucide-react";
import { useSearchParams } from "react-router-dom";

/**
 * Locandina promozionale A5 stampabile per i banchi dei commercianti.
 * URL diretto: /locandina (globale) o /locandina?ref=MERCHANT_ID (personalizzata).
 * Il QR punta a {origin}/register?ref=MERCHANT_ID — identico al QR mostrato
 * nella dashboard del commerciante: ogni iscrizione viene attribuita al negozio.
 */
export default function Locandina() {
  const [params] = useSearchParams();
  const ref = params.get("ref");
  // QR punta DIRETTAMENTE alla pagina di registrazione utente (con referral se presente).
  // Usa l'origin corrente: in produzione sarà scontiroma.it, in preview l'URL di test.
  const origin = window.location.origin;
  const APP_URL = ref
    ? `${origin}/register?ref=${encodeURIComponent(ref)}`
    : `${origin}/register`;

  // Assicura che Fraunces (700+800) sia effettivamente caricato prima di stampare,
  // altrimenti il browser ricade su serif di sistema e "Sconti Roma" cambia
  // completamente aspetto (utente ha segnalato "non si legge neanche ROMA").
  const openPrint = async () => {
    try {
      if (document?.fonts?.load) {
        await Promise.all([
          document.fonts.load("700 34pt Fraunces"),
          document.fonts.load("800 16pt Fraunces"),
          document.fonts.load("600 13pt Fraunces"),
        ]);
        await document.fonts.ready;
      }
    } catch (err) {
      console.warn("[locandina] font preload failed:", err?.message || err);
    }
    window.print();
  };

  return (
    <>
      {/* Stili di stampa: nasconde TUTTO il resto della pagina tranne .flyer,
          formato A5 su UN'UNICA pagina, forza colori identici all'anteprima. */}
      <style>{`
        @page { size: A5; margin: 0; }
        @media print {
          html, body {
            background: #0A0A0F !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 148mm !important;
            height: 210mm !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* 1) Nasconde ogni elemento della pagina (navbar, footer, cookie
             banner, toast, PWA banner, ecc.) rendendoli invisibili senza
             rimuoverli dal DOM (mantiene stabile il layout React). */
          body * { visibility: hidden !important; }

          /* 2) Rende visibile SOLO il flyer e tutto il suo contenuto */
          .flyer-wrap, .flyer-wrap * { visibility: visible !important; }

          /* 3) FORZA colori/sfondi identici all'anteprima anche in stampa.
             Senza queste regole, Safari/Firefox rimuovono i background scuri
             e "Roma" (pink su nero) diventa illeggibile. */
          .flyer-wrap, .flyer-wrap * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* 4) Posiziona il flyer esattamente in alto-a-sinistra, dimensione A5. */
          .flyer-wrap {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 148mm !important;
            height: 210mm !important;
            padding: 0 !important;
            margin: 0 !important;
            min-height: 0 !important;
            background: transparent !important;
            display: block !important;
          }
          .flyer {
            box-shadow: none !important;
            border-radius: 0 !important;
            width: 148mm !important;
            height: 210mm !important;
            margin: 0 !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .flyer * {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .no-print { display: none !important; }
        }
      `}</style>

      {/* Controlli visibili solo a schermo */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <button
          data-testid="flyer-print"
          onClick={openPrint}
          className="rounded-full bg-fucsia text-white px-4 py-2 text-sm font-semibold flex items-center gap-2 hover:scale-105 transition shadow-lg"
        >
          <Printer size={16} /> Stampa / Salva PDF
        </button>
      </div>

      <div className="flyer-wrap min-h-screen bg-black flex items-center justify-center p-6">
        <div
          className="flyer relative overflow-hidden"
          style={{
            width: "148mm",
            height: "210mm",
            background: "linear-gradient(135deg, #0A0A0F 0%, #1a0d24 100%)",
            color: "#F4F4F5",
            fontFamily: "'Inter', system-ui, sans-serif",
            boxShadow: "0 30px 80px rgba(255, 46, 147, 0.25)",
            borderRadius: "8px",
          }}
        >
          {/* Sfondo grafico astratto */}
          <div
            style={{
              position: "absolute",
              top: "-60mm",
              right: "-40mm",
              width: "160mm",
              height: "160mm",
              background: "radial-gradient(circle, rgba(255,46,147,0.20) 0%, transparent 65%)",
              filter: "blur(20px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-50mm",
              left: "-30mm",
              width: "120mm",
              height: "120mm",
              background: "radial-gradient(circle, rgba(0,229,255,0.15) 0%, transparent 65%)",
              filter: "blur(20px)",
            }}
          />

          {/* Contenuto */}
          <div style={{ position: "relative", padding: "9mm 8mm", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Header — brand */}
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.35em",
                  textTransform: "uppercase",
                  color: "#FFD93D",
                  fontWeight: 700,
                  marginBottom: "2mm",
                }}
              >
                Scopri · Scansiona · Risparmia
              </div>
              {/* Logo Colosseo — SVG inline per garantire la stampa fedele */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5mm" }}>
                <svg
                  viewBox="0 0 40 32"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  style={{ width: "16mm", height: "13mm", display: "block" }}
                >
                  <path
                    d="M 34.5 3 L 35.8 5.7 L 38.5 7 L 35.8 8.3 L 34.5 11 L 33.2 8.3 L 30.5 7 L 33.2 5.7 Z"
                    fill="#00E5FF"
                  />
                  <line x1="2.5" y1="27" x2="31.5" y2="27" stroke="#FF2E93" strokeWidth="2" strokeLinecap="round" />
                  <path
                    d="M 4 27 L 4 11 L 18 11 L 18 14 L 30 14 L 30 27"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M 6 26.5 L 6 20 Q 6 16.5 9 16.5 Q 12 16.5 12 20 L 12 26.5"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 13 26.5 L 13 19.5 Q 13 16 16.5 16 Q 20 16 20 19.5 L 20 26.5 Z"
                    fill="#FF2E93"
                  />
                  <path
                    d="M 21 26.5 L 21 20 Q 21 16.5 23.5 16.5 Q 26 16.5 26 20 L 26 26.5"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 27 26.5 L 27 21.5 Q 27 18.5 29 18.5 Q 31 18.5 31 21.5 L 31 26.5"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div
                style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontWeight: 700,
                  fontSize: "34pt",
                  lineHeight: 1,
                  color: "#fff",
                  letterSpacing: "-0.02em",
                }}
              >
                Sconti <span style={{ color: "#FF2E93" }}>Roma</span>
              </div>
              <div
                style={{
                  marginTop: "2mm",
                  fontSize: "10pt",
                  color: "rgba(244,244,245,0.75)",
                  fontStyle: "italic",
                }}
              >
                La città a metà prezzo, ogni giorno.
              </div>
            </div>

            {/* Divider */}
            <div
              style={{
                width: "20mm",
                height: "2px",
                background: "linear-gradient(90deg, #FF2E93, #00E5FF)",
                margin: "4mm auto",
              }}
            />

            {/* Cos'è l'app */}
            <div style={{ textAlign: "center", padding: "0 4mm" }}>
              <div
                style={{
                  fontSize: "11pt",
                  lineHeight: 1.55,
                  color: "rgba(244,244,245,0.9)",
                }}
              >
                Un abbonamento <strong style={{ color: "#FFD93D" }}>€2,99 al mese</strong> ti apre
                gli sconti di <strong style={{ color: "#FF2E93" }}>decine di locali</strong> di
                Roma: pizzerie, bar, pescherie, parrucchieri e molto altro.
                <br />
                <span style={{ color: "rgba(244,244,245,0.65)", fontSize: "10pt" }}>
                  Basta una scansione, mostri il QR al banco, paghi il prezzo scontato.
                </span>
              </div>
            </div>

            {/* 3 passaggi */}
            <div style={{ marginTop: "5mm", flex: 1 }}>
              <div
                style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontSize: "13pt",
                  fontWeight: 600,
                  color: "#fff",
                  textAlign: "center",
                  marginBottom: "3mm",
                }}
              >
                Come si fa in <span style={{ color: "#00E5FF" }}>3 passaggi</span>
              </div>

              {[
                { n: "1", title: "Scansiona il QR", desc: "Inquadra il codice qui sotto con la fotocamera del telefono." },
                { n: "2", title: "Iscriviti in 30 secondi", desc: "Crea l'account, scegli l'abbonamento a €2,99/mese." },
                { n: "3", title: "Sconti subito!", desc: "Sfoglia i negozi, genera il QR e mostralo al banco per pagare meno." },
              ].map((s) => (
                <div
                  key={s.n}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "4mm",
                    padding: "2mm 3mm",
                    marginBottom: "1.5mm",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "6px",
                  }}
                >
                  <div
                    style={{
                      flex: "0 0 8mm",
                      width: "8mm",
                      height: "8mm",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #FF2E93 0%, #7A5CFF 100%)",
                      color: "#fff",
                      fontWeight: 700,
                      fontFamily: "'Fraunces', Georgia, serif",
                      fontSize: "12pt",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 3px 10px rgba(255,46,147,0.4)",
                    }}
                  >
                    {s.n}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "10pt",
                        fontWeight: 600,
                        color: "#fff",
                        lineHeight: 1.2,
                      }}
                    >
                      {s.title}
                    </div>
                    <div
                      style={{
                        fontSize: "8.5pt",
                        color: "rgba(244,244,245,0.65)",
                        lineHeight: 1.35,
                        marginTop: "0.5mm",
                      }}
                    >
                      {s.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* QR Code + call to action */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6mm",
                padding: "5mm",
                background: "rgba(255,255,255,0.98)",
                borderRadius: "10px",
                marginTop: "auto",
              }}
            >
              <div
                style={{
                  flex: "0 0 32mm",
                  background: "#fff",
                  padding: "2mm",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <QRCodeSVG
                  value={APP_URL}
                  size={110}
                  level="H"
                  fgColor="#0A0A0F"
                  bgColor="#ffffff"
                  includeMargin={false}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "8pt",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "#7A5CFF",
                    fontWeight: 700,
                    marginBottom: "1mm",
                  }}
                >
                  Inquadra e iscriviti
                </div>
                <div
                  style={{
                    fontFamily: "'Fraunces', Georgia, serif",
                    fontSize: "16pt",
                    fontWeight: 700,
                    color: "#0A0A0F",
                    lineHeight: 1.1,
                  }}
                >
                  scontiroma.it
                </div>
                <div
                  style={{
                    marginTop: "1.5mm",
                    fontSize: "8pt",
                    color: "rgba(10,10,15,0.65)",
                    lineHeight: 1.35,
                  }}
                >
                  Solo <strong style={{ color: "#FF2E93" }}>€2,99/mese</strong> · Cancelli quando vuoi · Nessuna penale
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                marginTop: "2.5mm",
                textAlign: "center",
                fontSize: "7.5pt",
                color: "rgba(244,244,245,0.4)",
                letterSpacing: "0.05em",
              }}
            >
              Sconti Roma · <a href="mailto:info@scontiroma.it" style={{ color: "rgba(0,229,255,0.7)", textDecoration: "none" }}>info@scontiroma.it</a> · La città a metà prezzo, ogni giorno.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
