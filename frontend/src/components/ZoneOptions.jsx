// Opzioni del menu «Zona»: raggruppate per municipio se il server le manda così, altrimenti elenco semplice.
export default function ZoneOptions({ groups, zones, optionClassName }) {
  if (groups && groups.length) {
    return groups.map((g) => (
      <optgroup key={g.name} label={g.name}>
        {g.zones.map((z) => <option key={z} value={z} className={optionClassName}>{z}</option>)}
      </optgroup>
    ));
  }
  return zones.map((z) => <option key={z} value={z} className={optionClassName}>{z}</option>);
}
