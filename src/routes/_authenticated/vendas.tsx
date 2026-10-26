import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Gem, Check } from "lucide-react";
import { Shell, Card, Field, Empty } from "@/components/Shell";
import { useStore, actions, brl } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/vendas")({
  head: () => ({
    meta: [
      { title: "Vendas & caixa — Semijoias" },
      { name: "description", content: "Registre vendas escolhendo peças pelo catálogo visual." },
      { property: "og:title", content: "Vendas & caixa — Semijoias" },
      { property: "og:description", content: "Registre vendas pelo catálogo visual." },
    ],
  }),
  component: Vendas,
});

const PAG = ["Pix", "Dinheiro", "Cartão de débito", "Cartão de crédito", "Fiado"];

function Vendas() {
  const s = useStore();
  const [clienteId, setCliente] = useState("");
  const [pecaId, setPeca] = useState("");
  const [qtd, setQtd] = useState("1");
  const [pag, setPag] = useState("Pix");
  const [desc, setDesc] = useState("0");
  const [q, setQ] = useState("");
  const [ok, setOk] = useState(false);
  const peca = s.pecas.find((p) => p.id === pecaId);
  const n = Math.max(1, Number(qtd) || 1);
  const total = peca ? Math.max(0, peca.venda * n - (Number(desc) || 0)) : 0;
  const cat = s.pecas.filter((p) => `${p.nome} ${p.codigo}`.toLowerCase().includes(q.toLowerCase()));

  function finalizar() {
    if (!peca || !clienteId || peca.estoque < n) return;
    actions.addVenda({ clienteId, pecaId, qtd: n, pagamento: pag, desconto: Number(desc) || 0, total, custo: peca.custo * n, categoria: peca.categoria });
    setPeca(""); setQtd("1"); setDesc("0"); setOk(true); setTimeout(() => setOk(false), 2500);
  }

  return (
    <Shell title="Vendas & caixa" subtitle="Escolha a revendedora e clique na peça no catálogo.">
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="h-fit space-y-5">
          <h2 className="section-title">Dados do pedido</h2>
          <Field label="Revendedora"><select className="input" value={clienteId} onChange={(e) => setCliente(e.target.value)}>
            <option value="">Selecione…</option>{s.clientes.map((c) => <option key={c.id} value={c.id}>{c.codigo} · {c.nome}</option>)}
          </select></Field>
          <div className="rounded-lg border border-dashed border-border p-4">
            <div className="field-label">Peça selecionada</div>
            <div className="mt-1 font-medium">{peca ? `${peca.nome} — ${brl(peca.venda)}` : "Clique em uma peça ao lado"}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Quantidade"><input type="number" min="1" className="input" value={qtd} onChange={(e) => setQtd(e.target.value)} /></Field>
            <Field label="Desconto (R$)"><input type="number" step="0.01" className="input" value={desc} onChange={(e) => setDesc(e.target.value)} /></Field>
          </div>
          <Field label="Pagamento"><select className="input" value={pag} onChange={(e) => setPag(e.target.value)}>{PAG.map((p) => <option key={p}>{p}</option>)}</select></Field>
          <div className="flex items-baseline justify-between border-t border-border pt-4"><span className="field-label">Total</span><span className="font-display text-3xl">{brl(total)}</span></div>
          <button className="btn-primary w-full" disabled={!peca || !clienteId || (peca && peca.estoque < n)} onClick={finalizar}>
            {ok ? <><Check className="h-4 w-4" /> Venda registrada</> : "Finalizar venda"}
          </button>
          {peca && peca.estoque < n && <p className="text-xs text-destructive">Estoque insuficiente.</p>}
        </Card>
        <Card>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="section-title mb-0">Catálogo</h2>
            <input className="input w-60" placeholder="Filtrar peças…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {!cat.length ? <Empty>Nenhuma peça cadastrada.</Empty> : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {cat.map((p) => (
                <button key={p.id} onClick={() => setPeca(p.id)} className={`product ${p.id === pecaId ? "product-active" : ""}`} disabled={p.estoque <= 0}>
                  <div className="aspect-square overflow-hidden rounded-md bg-muted">
                    {p.foto ? <img src={p.foto} alt={p.nome} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-primary"><Gem className="h-8 w-8" strokeWidth={1.2} /></div>}
                  </div>
                  <div className="mt-2 truncate text-left text-sm font-medium">{p.nome}</div>
                  <div className="flex justify-between text-xs text-muted-foreground"><span>{brl(p.venda)}</span><span>{p.estoque} un.</span></div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Shell>
  );
}
