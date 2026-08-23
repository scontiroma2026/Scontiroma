import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2, Check, Search } from "lucide-react";
import api from "@/lib/api";

/**
 * Autocomplete per indirizzi italiani via Nominatim (proxy backend).
 * - value: stringa indirizzo corrente
 * - onChange(text, meta?): meta = {lat, lng, ...} se l'utente sceglie da lista
 * - required, disabled, placeholder, testId opzionali
 * Debounce 350ms, min 4 caratteri per iniziare a suggerire.
 */
export default function AddressAutocomplete({
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder = "Via, numero civico, CAP e città",
  label = "Indirizzo attività",
  helperText = "es. Via del Corso 100, 00186 Roma — digita e scegli dai suggerimenti",
  testId = "address-autocomplete",
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(false);
  const timerRef = useRef(null);
  const wrapRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (picked) return;
    const q = (value || "").trim();
    if (q.length < 4) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await api.get(`/geocode/suggest?q=${encodeURIComponent(q)}&limit=5`);
        setSuggestions(r.data.suggestions || []);
        setOpen((r.data.suggestions || []).length > 0);
      } catch {
        setSuggestions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => timerRef.current && clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Click outside chiude il dropdown
  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const handleInput = (e) => {
    setPicked(false);
    onChange(e.target.value);
  };

  const pick = (s) => {
    setPicked(true);
    onChange(s.display, {
      lat: s.lat,
      lng: s.lng,
      road: s.road,
      house_number: s.house_number,
      postcode: s.postcode,
      city: s.city,
    });
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative" data-testid={testId}>
      {label && (
        <Label>
          {label}{" "}
          {helperText && <span className="text-xs text-white/50">({helperText})</span>}
        </Label>
      )}
      <div className="relative mt-1">
        <MapPin
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
        />
        <Input
          data-testid={`${testId}-input`}
          type="text"
          required={required}
          disabled={disabled}
          value={value || ""}
          placeholder={placeholder}
          onChange={handleInput}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          autoComplete="street-address"
          className="pl-9 pr-9"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 size={14} className="animate-spin text-fucsia" />
          ) : picked ? (
            <Check size={14} className="text-green-400" />
          ) : (
            <Search size={14} className="text-white/30" />
          )}
        </div>
      </div>

      {/* Dropdown suggerimenti */}
      {open && suggestions.length > 0 && (
        <div
          data-testid={`${testId}-dropdown`}
          className="absolute z-50 top-full left-0 right-0 mt-1 rounded-xl border border-white/15 bg-[#141419] shadow-2xl overflow-hidden animate-in fade-in-0 slide-in-from-top-1"
        >
          <div className="text-[10px] uppercase tracking-wider text-fucsia px-3 py-2 border-b border-white/10 bg-black/40">
            {suggestions.length} indirizzi trovati — clicca per selezionare
          </div>
          <ul className="max-h-64 overflow-y-auto">
            {suggestions.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  data-testid={`${testId}-item-${i}`}
                  onClick={() => pick(s)}
                  className="w-full text-left px-3 py-2 hover:bg-fucsia/10 transition border-b border-white/5 last:border-b-0"
                >
                  <div className="flex items-start gap-2">
                    <MapPin size={12} className="text-fucsia mt-1 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-white truncate">{s.display}</div>
                      {s.full_display_name && s.full_display_name !== s.display && (
                        <div className="text-[10px] text-white/50 truncate">
                          {s.full_display_name}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <div className="text-[10px] text-white/40 px-3 py-1.5 border-t border-white/10 bg-black/40">
            Powered by OpenStreetMap · <span className="italic">Se non vedi il tuo indirizzo, prova un formato più preciso</span>
          </div>
        </div>
      )}

      {picked && (
        <div className="mt-1 text-[10px] text-green-400 flex items-center gap-1">
          <Check size={10} /> Indirizzo verificato — comparirà sulla mappa
        </div>
      )}
    </div>
  );
}
