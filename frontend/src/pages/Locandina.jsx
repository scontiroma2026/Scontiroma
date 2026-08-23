import { QRCodeSVG } from "qrcode.react";
import { Printer, Download } from "lucide-react";

/**
 * Locandina promozionale A5 stampabile per i banchi dei commercianti.
 * URL diretto: /locandina (non nel menu principale)
 * Colori/font coerenti con l'app: fucsia (#FF2E93), ciano (#00E5FF), gold (#FFD93D),
 * viola (#7A5CFF), font Fraunces (serif) + Inter (sans).
 */
export default function Locandina() {
  const APP_URL = "https://scontiroma.it";
  const openPrint = () => window.print();

  return (
    <>
      {/* Stili di stampa: nasconde tutto tranne .flyer, formato A5 */}
      <style>{`
        @page { size: A5; margin: 0; }
        @media print {
          html, body { background: #0A0A0F !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .flyer-wrap { padding: 0 !important; min-height: auto !important; }
          .flyer {
            box-shadow: none !important;
            border-radius: 0 !important;
            width: 148mm !important;
            height: 210mm !important;
            page-break-after: avoid;
          }
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
          <div style={{ position: "relative", padding: "12mm 10mm", height: "100%", display: "flex", flexDirection: "column" }}>
            {/* Header — brand */}
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.35em",
                  textTransform: "uppercase",
                  color: "#FFD93D",
                  fontWeight: 700,
                  marginBottom: "4mm",
                }}
              >
                Scopri · Scansiona · Risparmia
              </div>
              <div
                style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontWeight: 700,
                  fontSize: "38pt",
                  lineHeight: 1,
                  color: "#fff",
                  letterSpacing: "-0.02em",
                }}
              >
                Sconti <span style={{ color: "#FF2E93" }}>Roma</span>
              </div>
              <div
                style={{
                  marginTop: "3mm",
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
                margin: "6mm auto",
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
            <div style={{ marginTop: "8mm", flex: 1 }}>
              <div
                style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontSize: "13pt",
                  fontWeight: 600,
                  color: "#fff",
                  textAlign: "center",
                  marginBottom: "5mm",
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
                    padding: "3mm 4mm",
                    marginBottom: "2.5mm",
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
                marginTop: "4mm",
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
