import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp, Wallet, Receipt, Users, Gem, AlertTriangle } from "lucide-react";
import { Shell, Card, Empty } from "@/components/Shell";
import { useStore, brl } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Visão geral — Semijoias" },
      { name: "description", content: "Painel de faturamento, estoque, despesas e revendedoras da sua loja de semijoias." },
      { property: "og:title", content: "Visão geral — Semijoias" },
      { property: "og:description", content: "Painel de faturamento, estoque, despesas e revendedoras da sua loja de semijoias." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0; const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 1200);
      setN(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{format(n)}</>;
}

function Kpi({ label, value, format, icon, delay, hint }: { label: string; value: number; format: (n: number) => string; icon: ReactNode; delay: number; hint?: string }) {
  return (
    <div className="animate-rise lift rounded-xl border border-border bg-card p-5" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between">
        <span className="field-label">{label}</span>
        <span className="rounded-full bg-accent p-2 text-primary">{icon}</span>
      </div>
      <div className="mt-3 truncate font-display text-2xl tabular-nums text-foreground sm:text-3xl"><CountUp value={value} format={format} /></div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

const int = (n: number) => String(Math.round(n));

function Dashboard() {
  const s = useStore();
  const faturamento = s.vendas.reduce((a, v) => a + v.total, 0);
  const lucro = s.vendas.reduce((a, v) => a + v.total - v.custo, 0);
  const despesas = s.despesas.reduce((a, d) => a + d.valor, 0);
  const pecasEstoque = s.pecas.reduce((a, p) => a + p.estoque, 0);
  const valorEstoque = s.pecas.reduce((a, p) => a + p.estoque * p.venda, 0);
  const baixo = s.pecas.filter((p) => p.estoque <= 2).sort((a, b) => a.estoque - b.estoque);

  // últimos 14 dias
  const dias = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - 13 + i); return d;
  });
  const serie = dias.map((d) => {
    const key = d.toDateString();
    return {
      dia: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      Faturamento: s.vendas.filter((v) => new Date(v.data).toDateString() === key).reduce((a, v) => a + v.total, 0),
      Despesas: s.despesas.filter((x) => new Date(x.data).toDateString() === key).reduce((a, x) => a + x.valor, 0),
    };
  });

  const porCat: Record<string, number> = {};
  s.vendas.forEach((v) => (porCat[v.categoria] = (porCat[v.categoria] || 0) + v.total));
  const cats = Object.entries(porCat).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const porCliente: Record<string, number> = {};
  s.vendas.forEach((v) => (porCliente[v.clienteId] = (porCliente[v.clienteId] || 0) + v.total));
  const ranking = Object.entries(porCliente)
    .map(([id, total]) => ({ c: s.clientes.find((c) => c.id === id), total }))
    .filter((r) => r.c).sort((a, b) => b.total - a.total).slice(0, 5);
  const maxRank = ranking[0]?.total || 1;

  const ultimas = [...s.vendas].reverse().slice(0, 5);
  const saudacao = (() => { const h = new Date().getHours(); return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite"; })();

  return (
    <Shell title="Visão geral" subtitle="Faturamento, estoque, despesas e revendedoras em tempo real.">
      <div className="animate-rise mb-6 overflow-hidden rounded-2xl bg-sidebar p-5 sm:p-7 text-sidebar-foreground">
        <div className="text-xs uppercase tracking-[0.25em] text-sidebar-foreground/60">{saudacao}</div>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-sm text-sidebar-foreground/70">Saldo de caixa</div>
            <div className="gold-shimmer font-display text-4xl sm:text-5xl tabular-nums"><CountUp value={faturamento - despesas} format={brl} /></div>
          </div>
          <div className="flex gap-8 text-sm">
            <div><div className="text-sidebar-foreground/60">Margem</div><div className="font-display text-2xl text-sidebar-primary">{faturamento ? Math.round((lucro / faturamento) * 100) : 0}%</div></div>
            <div><div className="text-sidebar-foreground/60">Vendas</div><div className="font-display text-2xl text-sidebar-primary">{s.vendas.length}</div></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <Kpi label="Faturamento" value={faturamento} format={brl} icon={<TrendingUp className="h-4 w-4" />} delay={60} />
        <Kpi label="Lucro bruto" value={lucro} format={brl} icon={<Wallet className="h-4 w-4" />} delay={120} />
        <Kpi label="Despesas" value={despesas} format={brl} icon={<Receipt className="h-4 w-4" />} delay={180} />
        <Kpi label="Peças em estoque" value={pecasEstoque} format={int} icon={<Gem className="h-4 w-4" />} delay={240} hint={`Valor: ${brl(valorEstoque)}`} />
        <Kpi label="Revendedoras" value={s.clientes.length} format={int} icon={<Users className="h-4 w-4" />} delay={300} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="animate-rise lg:col-span-2" style={{ animationDelay: "350ms" }}>
          <Card>
            <h2 className="section-title">Faturamento × despesas — últimos 14 dias</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={serie} margin={{ left: -10, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="gF" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.45} /><stop offset="100%" stopColor="var(--primary)" stopOpacity={0} /></linearGradient>
                    <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--muted-foreground)" stopOpacity={0.25} /><stop offset="100%" stopColor="var(--muted-foreground)" stopOpacity={0} /></linearGradient>
                  </defs>
                  <XAxis dataKey="dia" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => brl(v)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="Faturamento" stroke="var(--primary)" strokeWidth={2} fill="url(#gF)" animationDuration={1400} />
                  <Area type="monotone" dataKey="Despesas" stroke="var(--muted-foreground)" strokeWidth={1.5} fill="url(#gD)" animationDuration={1400} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <div className="animate-rise" style={{ animationDelay: "420ms" }}>
          <Card>
            <h2 className="section-title">Vendas por categoria</h2>
            {cats.length ? (
              <>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={cats} dataKey="value" innerRadius={48} outerRadius={72} paddingAngle={3} animationDuration={1200}>
                        {cats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => brl(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {cats.slice(0, 5).map((c, i) => (
                    <li key={c.name} className="flex items-center justify-between">
                      <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{c.name}</span>
                      <span className="tabular-nums text-muted-foreground">{brl(c.value)}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : <Empty>Sem vendas ainda.</Empty>}
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="animate-rise" style={{ animationDelay: "480ms" }}>
          <Card>
            <h2 className="section-title">Melhores revendedoras</h2>
            {ranking.length ? (
              <ul className="space-y-4">
                {ranking.map(({ c, total }, i) => (
                  <li key={c!.id}>
                    <div className="mb-1.5 flex justify-between text-sm"><span><span className="mr-2 font-display text-primary">{i + 1}º</span>{c!.nome}</span><span className="tabular-nums text-muted-foreground">{brl(total)}</span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="animate-rise h-full rounded-full bg-gradient-gold" style={{ width: `${(total / maxRank) * 100}%` }} /></div>
                  </li>
                ))}
              </ul>
            ) : <Empty>Nenhuma venda registrada.</Empty>}
          </Card>
        </div>
        <div className="animate-rise" style={{ animationDelay: "540ms" }}>
          <Card>
            <h2 className="section-title">Estoque baixo</h2>
            {baixo.length ? (
              <ul className="space-y-3">
                {baixo.slice(0, 6).map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" />{p.nome}</span>
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs tabular-nums">{p.estoque} un.</span>
                  </li>
                ))}
              </ul>
            ) : <Empty>Tudo em dia no estoque.</Empty>}
            <Link to="/estoque" className="mt-4 inline-block text-sm text-primary hover:underline">Ver estoque →</Link>
          </Card>
        </div>
        <div className="animate-rise" style={{ animationDelay: "600ms" }}>
          <Card>
            <h2 className="section-title">Últimas vendas</h2>
            {ultimas.length ? (
              <ul className="divide-y divide-border">
                {ultimas.map((v) => (
                  <li key={v.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <div>{s.pecas.find((p) => p.id === v.pecaId)?.nome ?? "Peça"}</div>
                      <div className="text-xs text-muted-foreground">{s.clientes.find((c) => c.id === v.clienteId)?.nome ?? "—"} · {v.pagamento}{v.parcelas && v.parcelas > 1 ? ` ${v.parcelas}x` : ""} · {new Date(v.data).toLocaleDateString("pt-BR")}</div>
                    </div>
                    <span className="tabular-nums font-medium">{brl(v.total)}</span>
                  </li>
                ))}
              </ul>
            ) : <Empty>Nenhuma venda ainda.</Empty>}
          </Card>
        </div>
      </div>
    </Shell>
  );
}
