import { forwardRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

const PasswordInput = forwardRef(function PasswordInput({ className = "", ...props }, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input ref={ref} type={visible ? "text" : "password"} className={`pr-10 ${className}`} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? "Nascondi password" : "Mostra password"}
        data-testid={props["data-testid"] ? `${props["data-testid"]}-toggle` : undefined}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-white/50 hover:text-fucsia hover:bg-white/5 transition"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
});

export default PasswordInput;
