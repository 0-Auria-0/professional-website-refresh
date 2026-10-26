import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Shell, Card, Field, Empty } from "@/components/Shell";
import { useStore, actions, brl } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/despesas")({
  head: () => ({
    meta: [
      { title: "Despesas — Semijoias" },
      { name: "description", content: "Controle de custos fixos, embalagens e fretes da loja." },
      { property: "og:title", content: "Despesas — Semijoias" },
      { property: "og:description", content: "Controle de custos da loja." },
    ],
  }),
  component: Despesas,
});

const PAG = ["Pix", "Dinheiro", "Cartão de débito", "Cartão de crédito", "Boleto"];

function Despesas() {
  const s = useStore();
  const [f, setF] = useState({ descricao: "", valor: "", pagamento: "Pix" });
  const total = s.despesas.reduce((a, d) => a + d.valor, 0);
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.descricao || !Number(f.valor)) return;
    actions.addDespesa({ descricao: f.descricao, valor: Number(f.valor), pagamento: f.pagamento });
    setF({ ...f, descricao: "", valor: "" });
  }
  return (
    <Shell title="Despesas" subtitle="Custos fixos, embalagens, fretes e insumos."
      action={<div className="text-right"><div className="field-label">Total gasto</div><div className="font-display text-2xl">{brl(total)}</div></div>}>
      <Card>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 md:gap-5">
          <Field label="Descrição"><input className="input" placeholder="Embalagens, frete…" value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} /></Field>
          <Field label="Valor (R$)"><input type="number" step="0.01" className="input" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} /></Field>
          <Field label="Pagamento"><select className="input" value={f.pagamento} onChange={(e) => setF({ ...f, pagamento: e.target.value })}>{PAG.map((p) => <option key={p}>{p}</option>)}</select></Field>
          <div className="flex items-end"><button className="btn-primary w-full">Registrar despesa</button></div>
        </form>
      </Card>
      <Card className="mt-6 overflow-x-auto p-0">
        <table className="table min-w-[640px]">
          <thead><tr><th>Data</th><th>Descrição</th><th>Pagamento</th><th>Valor</th><th /></tr></thead>
          <tbody>
            {s.despesas.map((d) => (
              <tr key={d.id}>
                <td className="text-muted-foreground">{new Date(d.data).toLocaleDateString("pt-BR")}</td>
                <td className="font-medium">{d.descricao}</td><td>{d.pagamento}</td><td className="tabular-nums">{brl(d.valor)}</td>
                <td className="text-right"><button className="btn-icon" onClick={() => actions.delDespesa(d.id)} aria-label="Excluir"><Trash2 className="h-4 w-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!s.despesas.length && <Empty>Nenhuma despesa registrada.</Empty>}
      </Card>
    </Shell>
  );
}
