import { ReactNode } from "react";
import { UtensilsCrossed } from "lucide-react";

interface AuthLayoutProps {
  illustration: string;
  illustrationAlt: string;
  children: ReactNode;
  subtitle?: string;
}

export const AuthLayout = ({ illustration, illustrationAlt, children, subtitle = "Student & Admin Portal" }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen w-full flex flex-col" style={{ background: "var(--gradient-page)" }}>
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-5xl bg-card rounded-2xl overflow-hidden grid md:grid-cols-2" style={{ boxShadow: "var(--shadow-card)" }}>
          {/* Illustration side */}
          <div className="hidden md:flex flex-col items-center justify-center p-10 relative" style={{ background: "var(--gradient-soft)" }}>
            <div className="flex flex-col items-center text-center mb-6">
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-button)" }}>
                <UtensilsCrossed className="h-7 w-7 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">School Canteen</h1>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
            <img src={illustration} alt={illustrationAlt} loading="lazy" width={1024} height={1024} className="max-h-[420px] w-auto object-contain" />
          </div>

          {/* Form side */}
          <div className="p-8 md:p-10">
            <div className="md:hidden flex flex-col items-center text-center mb-6">
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center mb-2" style={{ background: "var(--gradient-primary)" }}>
                <UtensilsCrossed className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold">School Canteen</h1>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </main>
      <footer className="py-4 text-center text-xs text-muted-foreground">
        © 2026 School Canteen System. All rights reserved.
      </footer>
    </div>
  );
};