// Opzioni del menu «Zona»: le aree (circa 16) con titolo descrittivo; valore breve salvato sul negozio.
export default function ZoneOptions({ areas, zones, optionClassName }) {
  if (areas && areas.length) {
    return areas.map((a) => <option key={a.value} value={a.value} className={optionClassName}>{a.label}</option>);
  }
  return zones.map((z) => <option key={z} value={z} className={optionClassName}>{z}</option>);
}
