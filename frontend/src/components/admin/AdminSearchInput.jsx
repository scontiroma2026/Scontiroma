import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

/** Campo di ricerca standard per i tab admin. */
export const AdminSearchInput = ({ value, onChange, placeholder = "Cerca…", testId = "admin-search" }) => (
  <div className="relative w-full sm:w-64">
    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
    <Input
      data-testid={testId}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-9 pl-9 bg-black/40 border-white/10 text-sm text-white rounded-full"
    />
  </div>
);

export default AdminSearchInput;
