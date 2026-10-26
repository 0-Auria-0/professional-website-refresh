import { Link } from "@tanstack/react-router";
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
        <div className="border-t border-sidebar-border px-6 py-5 text-xs text-sidebar-foreground/60">Dados salvos neste navegador</div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <nav className="flex gap-1 overflow-x-auto bg-sidebar p-2 md:hidden">
          {nav.map(({ to, label }) => (
            <Link key={to} to={to} activeOptions={{ exact: true }} className="nav-link whitespace-nowrap">{label}</Link>
          ))}
        </nav>
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 md:px-10">
          <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
            <div>
              <h1 className="font-display text-4xl text-foreground">{title}</h1>
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
