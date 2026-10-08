import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

/** Campo di ricerca standard per i tab admin. */
export const AdminSearchInput = ({ value, onChange, placeholder = "Cerca…", testId = "admin-search" }) => (
  <div className="relative w-full sm:w-64">
    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
    <Input
      data-testid={testId}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-11 pl-9 bg-muted border-border text-sm text-foreground rounded-full"
    />
  </div>
);

export default AdminSearchInput;
