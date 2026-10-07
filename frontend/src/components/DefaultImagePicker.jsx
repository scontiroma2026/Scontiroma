import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Images, Check, Loader2 } from "lucide-react";

/**
 * Picker per la libreria di 100 immagini di default (10 categorie × 10).
 * Il merchant può aprire un dialog, scegliere una categoria e selezionare una foto.
 */
export default function DefaultImagePicker({ onSelect, selectedUrl }) {
  const [open, setOpen] = useState(false);
  const [library, setLibrary] = useState(null);
  const [activeCat, setActiveCat] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || library) return;
    setLoading(true);
    api.get("/default-images")
      .then((r) => {
        setLibrary(r.data.library);
        setActiveCat(Object.keys(r.data.library)[0]);
      })
      .finally(() => setLoading(false));
  }, [open, library]);

  const pick = (url) => {
    onSelect(url);
    setOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        data-testid="open-default-images-btn"
        className="h-11 rounded-full border-2 border-ac-teal bg-white px-4 font-extrabold text-ac-teal hover:bg-ac-tealBg hover:text-ac-teal"
      >
        <Images size={16} className="mr-2" />
        Scegli da libreria (100 foto)
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          data-testid="default-images-dialog"
          className="max-w-5xl max-h-[85vh] overflow-hidden bg-white border-ac-line text-ac-ink flex flex-col"
        >
          <DialogHeader>
            <DialogTitle className="font-serif text-3xl font-bold text-ac-ink">
              Libreria immagini <span className="text-ac-rosa">(100 foto)</span>
            </DialogTitle>
            <DialogDescription className="text-sm text-ac-soft">
              Scegli una foto già ottimizzata se non vuoi caricare la tua.
            </DialogDescription>
          </DialogHeader>

          {loading && (
            <div className="flex-1 flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-ac-rosa" size={32} />
            </div>
          )}

          {library && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Tab categorie */}
              <div className="flex flex-wrap gap-2 pb-4 border-b border-ac-line">
                {Object.keys(library).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCat(cat)}
                    data-testid={`cat-tab-${cat.replace(/\s+/g, "-").toLowerCase()}`}
                    className={`min-h-11 text-xs font-extrabold uppercase tracking-wider px-4 rounded-full transition ${
                      activeCat === cat
                        ? "bg-ac-rosa text-white"
                        : "bg-ac-tint text-ac-soft hover:bg-ac-violaBg hover:text-ac-ink"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Grid foto della categoria attiva */}
              <div className="flex-1 overflow-y-auto pt-4 pr-1">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {(library[activeCat] || []).map((url, i) => {
                    const isSelected = selectedUrl === url;
                    return (
                      <button
                        key={url}
                        type="button"
                        onClick={() => pick(url)}
                        data-testid={`lib-img-${i}`}
                        className={`group relative aspect-video rounded-lg overflow-hidden border-2 transition ${
                          isSelected
                            ? "border-ac-rosa"
                            : "border-ac-line hover:border-ac-teal"
                        }`}
                      >
                        <img
                          src={url}
                          alt={`${activeCat} ${i + 1}`}
                          loading="lazy"
                          className="w-full h-full object-cover transition group-hover:scale-105"
                        />
                        {isSelected && (
                          <div className="absolute top-2 right-2 h-7 w-7 rounded-full bg-ac-rosa flex items-center justify-center text-white">
                            <Check size={14} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition flex items-end justify-center pb-2 text-xs text-white">
                          Usa questa foto
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
