import { forwardRef, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
export const PasswordInput = forwardRef(({ className, ...props }, ref) => {
    const [show, setShow] = useState(false);
    return (<div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"/>
      <Input ref={ref} type={show ? "text" : "password"} className={cn("pl-10 pr-10 h-11 bg-background", className)} {...props}/>
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1} aria-label={show ? "Hide password" : "Show password"}>
        {show ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
      </button>
    </div>);
});
PasswordInput.displayName = "PasswordInput";
