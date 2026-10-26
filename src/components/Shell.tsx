import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { ReactNode } from "react";
import { LayoutDashboard, Users, Gem, ShoppingBag, Receipt } from "lucide-react";

const nav = [
  { to: "/", label: "Visão geral", icon: LayoutDashboard },
  { to: "/clientes", label: "Revendedoras", icon: Users },
  { to: "/estoque", label: "Peças & estoque", icon: Gem },
  { to: "/vendas", label: "Vendas & caixa", icon: ShoppingBag },
  { to: "/despesas", label: "Despesas", icon: Receipt },
] as const;

export function Shell({ title, subtitle, action, children }: { title: string; subtitle: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="px-6 pb-8 pt-8">
          <div className="font-display text-2xl tracking-wide">Semijoias</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.25em] text-sidebar-primary">Gestão & ateliê</div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} activeOptions={{ exact: true }} className="nav-link">
              <Icon className="h-4 w-4" strokeWidth={1.6} /> {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border px-6 py-5 text-xs text-sidebar-foreground/60">
          <div>Dados salvos na nuvem</div>
          <button className="mt-2 text-sidebar-primary hover:underline" onClick={async () => { await supabase.auth.signOut(); window.location.href = "/auth"; }}>Sair da conta</button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-30 flex items-center justify-between bg-sidebar px-4 py-3 text-sidebar-foreground md:hidden">
          <div className="font-display text-xl tracking-wide">Semijoias</div>
          <button className="text-xs text-sidebar-primary" onClick={async () => { await supabase.auth.signOut(); window.location.href = "/auth"; }}>Sair</button>
        </div>
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-sidebar-border bg-sidebar pb-[env(safe-area-inset-bottom)] md:hidden">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} activeOptions={{ exact: true }}
              className="flex flex-col items-center gap-1 py-2 text-[10px] text-sidebar-foreground/60 [&.active]:text-sidebar-primary">
              <Icon className="h-5 w-5" strokeWidth={1.6} />
              <span className="truncate">{label.split(" ")[0]}</span>
            </Link>
          ))}
        </nav>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 sm:px-5 md:px-10 md:py-10">
          <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5 md:mb-8 md:pb-6">
            <div className="min-w-0">
              <h1 className="font-display text-3xl text-foreground md:text-4xl">{title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            </div>
            {action}
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return <div className="py-12 text-center text-sm text-muted-foreground">{children}</div>;
}
