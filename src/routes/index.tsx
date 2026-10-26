import { createFileRoute } from "@tanstack/react-router";
import { Shell, Card, Empty } from "@/components/Shell";
import { useStore, brl } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Visão geral — Semijoias" },
      { name: "description", content: "Painel de vendas, lucro e caixa da sua loja de semijoias." },
      { property: "og:title", content: "Visão geral — Semijoias" },
      { property: "og:description", content: "Painel de vendas, lucro e caixa da sua loja de semijoias." },
    ],
  }),
  component: Dashboard,
});

function Bars({ data }: { data: [string, number][] }) {
  if (!data.length) return <Empty>Sem dados ainda.</Empty>;
  const max = Math.max(...data.map((d) => d[1]));
  return (
    <div className="space-y-4">
      {data.map(([k, v]) => (
        <div key={k}>
          <div className="mb-1.5 flex justify-between text-sm"><span>{k}</span><span className="tabular-nums text-muted-foreground">{brl(v)}</span></div>
          <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-gradient-gold" style={{ width: `${(v / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

function group(list: { k: string; v: number }[]) {
  const m: Record<string, number> = {};
  list.forEach(({ k, v }) => (m[k] = (m[k] || 0) + v));
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}

function Dashboard() {
  const s = useStore();
  const vendas = s.vendas.reduce((a, v) => a + v.total, 0);
  const lucro = s.vendas.reduce((a, v) => a + v.total - v.custo, 0);
  const despesas = s.despesas.reduce((a, d) => a + d.valor, 0);
  const kpis = [
    ["Total em vendas", brl(vendas)],
    ["Lucro bruto", brl(lucro)],
    ["Saldo de caixa", brl(vendas - despesas)],
    ["Revendedoras", String(s.clientes.length)],
  ];
  return (
    <Shell title="Visão geral" subtitle="Desempenho de vendas e saúde financeira do negócio.">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map(([l, v], i) => (
          <Card key={l} className={i === 0 ? "card-feature" : ""}>
            <div className="field-label">{l}</div>
            <div className="mt-3 font-display text-3xl tabular-nums">{v}</div>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card><h2 className="section-title">Vendas por categoria</h2><Bars data={group(s.vendas.map((v) => ({ k: v.categoria, v: v.total })))} /></Card>
        <Card><h2 className="section-title">Formas de pagamento</h2><Bars data={group(s.vendas.map((v) => ({ k: v.pagamento, v: v.total })))} /></Card>
      </div>
    </Shell>
  );
}
