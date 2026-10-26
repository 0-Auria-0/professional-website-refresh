import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Gem, Check, Plus, Minus, Search, Trash2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

type Carrinho = Record<string, number>;

function Vendas() {
  const s = useStore();
  const [clienteId, setCliente] = useState("");
  const [itens, setItens] = useState<Carrinho>({});
  const [pag, setPag] = useState("Pix");
  const [desc, setDesc] = useState("0");
  const [ok, setOk] = useState(false);
  const [aberto, setAberto] = useState(false);

  const linhas = Object.entries(itens)
    .map(([id, qtd]) => ({ peca: s.pecas.find((p) => p.id === id)!, qtd }))
    .filter((l) => l.peca && l.qtd > 0);
  const bruto = linhas.reduce((a, l) => a + l.peca.venda * l.qtd, 0);
  const desconto = Math.min(bruto, Number(desc) || 0);
  const total = bruto - desconto;
  const pecasTotal = linhas.reduce((a, l) => a + l.qtd, 0);

  function finalizar() {
    if (!clienteId || !linhas.length) return;
    linhas.forEach((l) => {
      const sub = l.peca.venda * l.qtd;
      const d = bruto ? (desconto * sub) / bruto : 0;
      actions.addVenda({ clienteId, pecaId: l.peca.id, qtd: l.qtd, pagamento: pag, desconto: d, total: sub - d, custo: l.peca.custo * l.qtd, categoria: l.peca.categoria });
    });
    setItens({}); setDesc("0"); setOk(true); setTimeout(() => setOk(false), 2500);
    toast.success(`Venda registrada: ${pecasTotal} peça(s).`);
  }

  return (
    <Shell title="Vendas & caixa" subtitle="Escolha a revendedora e adicione as peças vendidas."
      action={<button className="btn-primary" onClick={() => setAberto(true)}><Plus className="h-4 w-4" /> Adicionar peças</button>}>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title mb-0">Peças do lançamento</h2>
            <span className="text-sm text-muted-foreground">{pecasTotal} un.</span>
          </div>
          {!linhas.length ? (
            <button onClick={() => setAberto(true)} className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed border-border py-12 text-sm text-muted-foreground hover:border-primary hover:text-primary">
              <ShoppingBag className="h-6 w-6" strokeWidth={1.4} />Clique para escolher as peças
            </button>
          ) : (
            <ul className="divide-y divide-border">
              {linhas.map(({ peca, qtd }) => (
                <li key={peca.id} className="flex items-center gap-3 py-3">
                  <Thumb foto={peca.foto} nome={peca.nome} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{peca.nome}</div>
                    <div className="text-xs text-muted-foreground">{peca.codigo} · {brl(peca.venda)}</div>
                  </div>
                  <Qtd value={qtd} max={peca.estoque} onChange={(v) => setItens({ ...itens, [peca.id]: v })} />
                  <div className="w-24 text-right tabular-nums">{brl(peca.venda * qtd)}</div>
                  <button className="btn-icon" aria-label="Remover" onClick={() => { const n = { ...itens }; delete n[peca.id]; setItens(n); }}><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="h-fit space-y-5">
          <h2 className="section-title">Dados do pedido</h2>
          <Field label="Revendedora"><select className="input" value={clienteId} onChange={(e) => setCliente(e.target.value)}>
            <option value="">Selecione…</option>{s.clientes.map((c) => <option key={c.id} value={c.id}>{c.codigo} · {c.nome}</option>)}
          </select></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Desconto (R$)"><input type="number" step="0.01" className="input" value={desc} onChange={(e) => setDesc(e.target.value)} /></Field>
            <Field label="Pagamento"><select className="input" value={pag} onChange={(e) => setPag(e.target.value)}>{PAG.map((p) => <option key={p}>{p}</option>)}</select></Field>
          </div>
          <div className="space-y-1 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="tabular-nums">{brl(bruto)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Desconto</span><span className="tabular-nums">− {brl(desconto)}</span></div>
            <div className="flex items-baseline justify-between pt-2"><span className="field-label">Total</span><span className="font-display text-3xl">{brl(total)}</span></div>
          </div>
          <button className="btn-primary w-full" disabled={!linhas.length || !clienteId} onClick={finalizar}>
            {ok ? <><Check className="h-4 w-4" /> Venda registrada</> : "Finalizar venda"}
          </button>
          {!clienteId && linhas.length > 0 && <p className="text-xs text-muted-foreground">Selecione a revendedora para finalizar.</p>}
        </Card>
      </div>
      <SeletorPecas open={aberto} onOpenChange={setAberto} inicial={itens} onConfirm={(c) => { setItens(c); setAberto(false); }} />
    </Shell>
  );
}

function Thumb({ foto, nome }: { foto?: string | undefined; nome: string }) {
  return (
    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
      {foto ? <img src={foto} alt={nome} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-primary"><Gem className="h-5 w-5" strokeWidth={1.2} /></div>}
    </div>
  );
}

function Qtd({ value, max, onChange }: { value: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex shrink-0 items-center rounded-md border border-border">
      <button type="button" className="px-2 py-1 text-muted-foreground hover:text-primary disabled:opacity-40" disabled={value <= 0} onClick={() => onChange(Math.max(0, value - 1))} aria-label="Diminuir"><Minus className="h-3.5 w-3.5" /></button>
      <input className="w-10 bg-transparent text-center text-sm tabular-nums outline-none" value={value}
        onChange={(e) => onChange(Math.min(max, Math.max(0, Number(e.target.value.replace(/\D/g, "")) || 0)))} />
      <button type="button" className="px-2 py-1 text-muted-foreground hover:text-primary disabled:opacity-40" disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))} aria-label="Aumentar"><Plus className="h-3.5 w-3.5" /></button>
    </div>
  );
}

function SeletorPecas({ open, onOpenChange, inicial, onConfirm }: { open: boolean; onOpenChange: (o: boolean) => void; inicial: Carrinho; onConfirm: (c: Carrinho) => void }) {
  const s = useStore();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Carrinho>({});
  useEffect(() => { if (open) { setSel(inicial); setQ(""); } }, [open, inicial]);
  const lista = s.pecas.filter((p) => `${p.nome} ${p.codigo} ${p.categoria}`.toLowerCase().includes(q.toLowerCase()));
  const qtdSel = Object.values(sel).reduce((a, b) => a + b, 0);
  const valor = Object.entries(sel).reduce((a, [id, n]) => a + (s.pecas.find((p) => p.id === id)?.venda ?? 0) * n, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-4">
        <DialogHeader><DialogTitle className="font-display text-2xl">Selecionar peças</DialogTitle></DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input autoFocus className="input pl-9" placeholder="Pesquisar por nome, código ou categoria…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="-mx-2 min-h-0 flex-1 overflow-y-auto px-2">
          {!lista.length ? <Empty>Nenhuma peça encontrada.</Empty> : (
            <ul className="divide-y divide-border">
              {lista.map((p) => {
                const n = sel[p.id] ?? 0;
                return (
                  <li key={p.id} className={`flex items-center gap-3 py-2.5 ${p.estoque <= 0 ? "opacity-50" : ""}`}>
                    <Thumb foto={p.foto} nome={p.nome} />
                    <button type="button" className="min-w-0 flex-1 text-left" disabled={p.estoque <= 0} onClick={() => setSel({ ...sel, [p.id]: n ? 0 : 1 })}>
                      <div className="truncate text-sm font-medium">{p.nome}</div>
                      <div className="text-xs text-muted-foreground">{p.codigo} · {brl(p.venda)} · {p.estoque} em estoque</div>
                    </button>
                    {p.estoque > 0 ? <Qtd value={n} max={p.estoque} onChange={(v) => setSel({ ...sel, [p.id]: v })} /> : <span className="text-xs text-destructive">Esgotada</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <div className="text-sm text-muted-foreground">{qtdSel} peça(s) · <span className="font-medium text-foreground">{brl(valor)}</span></div>
          <div className="flex gap-2">
            <button type="button" className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted" onClick={() => onOpenChange(false)}>Cancelar</button>
            <button type="button" className="btn-primary" onClick={() => onConfirm(Object.fromEntries(Object.entries(sel).filter(([, v]) => v > 0)))}>Adicionar ao lançamento</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
