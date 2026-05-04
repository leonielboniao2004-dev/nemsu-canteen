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
    <div className="min-h-screen w-full flex flex-col relative overflow-hidden" style={{ background: "var(--gradient-page)" }}>
      {/* Decorative mesh background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--gradient-mesh)" }}
      />
      {/* Soft floating orbs */}
      <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-40" style={{ background: "var(--gradient-primary)" }} />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full blur-3xl opacity-30" style={{ background: "linear-gradient(135deg, hsl(220 90% 70%), hsl(280 90% 75%))" }} />

      <main className="relative flex-1 flex items-center justify-center p-4 sm:p-6">
        <div
          className="w-full max-w-5xl bg-card/95 backdrop-blur-xl rounded-3xl overflow-hidden grid md:grid-cols-2 border border-border/50 animate-slide-up"
          style={{ boxShadow: "var(--shadow-elevated)" }}
        >
          {/* Illustration side */}
          <div className="hidden md:flex flex-col items-center justify-center p-10 relative overflow-hidden" style={{ background: "var(--gradient-soft)" }}>
            <div aria-hidden className="absolute -top-16 -right-16 h-48 w-48 rounded-full blur-2xl opacity-50" style={{ background: "var(--gradient-primary)" }} />
            <div className="flex flex-col items-center text-center mb-6">
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-3 relative" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-button)" }}>
                <UtensilsCrossed className="h-7 w-7 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">School Canteen</h1>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
            <img
              src={illustration}
              alt={illustrationAlt}
              loading="lazy"
              width={1024}
              height={1024}
              className="relative max-h-[420px] w-auto object-contain drop-shadow-xl"
            />
          </div>

          {/* Form side */}
          <div className="p-6 sm:p-8 md:p-10">
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
      <footer className="relative py-4 text-center text-xs text-muted-foreground">
        © 2026 School Canteen System. All rights reserved.
      </footer>
    </div>
  );
};