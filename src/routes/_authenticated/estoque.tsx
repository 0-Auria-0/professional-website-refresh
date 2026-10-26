import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2, Gem } from "lucide-react";
import { Shell, Card, Field, Empty } from "@/components/Shell";
import { useStore, actions, novoCodigo, readImage, brl } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/estoque")({
  head: () => ({
    meta: [
      { title: "Peças & estoque — Semijoias" },
      { name: "description", content: "Cadastro de peças com margem de lucro automática e controle de estoque." },
      { property: "og:title", content: "Peças & estoque — Semijoias" },
      { property: "og:description", content: "Cadastro de peças e controle de estoque." },
    ],
  }),
  component: Estoque,
});

const CATS = ["Brinco", "Colar", "Anel", "Pulseira", "Tornozeleira", "Conjunto"];
const QUAL = ["Folheado 10 milésimos", "Banho ouro 18k", "Banho ródio", "Prata 925", "Aço inox"];

function Estoque() {
  const s = useStore();
  const [f, setF] = useState({ nome: "", categoria: "Brinco", qualidade: "Folheado 10 milésimos", estoque: "1", custo: "", margem: "100", numero: "" });
  const [file, setFile] = useState<File>();
  const [q, setQ] = useState("");
  const codigo = novoCodigo("PC", s.pecas);
  const venda = (Number(f.custo) || 0) * (1 + (Number(f.margem) || 0) / 100);
  const list = s.pecas.filter((p) => `${p.nome} ${p.codigo} ${p.categoria} ${p.numero ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.nome) return;
    const foto = await readImage(file);
    const base = { nome: f.nome, categoria: f.categoria, qualidade: f.qualidade, estoque: Number(f.estoque) || 0, custo: Number(f.custo) || 0, venda, foto };
    const numeros = f.categoria === "Anel" ? f.numero.split(/[,;\s]+/).map((t) => t.trim()).filter(Boolean) : [];
    if (numeros.length > 1) {
      let lista: { codigo: string }[] = s.pecas;
      for (const numero of numeros) {
        const cod = novoCodigo("PC", lista);
        actions.addPeca({ ...base, codigo: cod, numero });
        lista = [...lista, { codigo: cod }];
      }
    } else {
      actions.addPeca({ ...base, codigo, numero: numeros[0] ?? undefined });
    }
    setF({ ...f, nome: "", custo: "", estoque: "1", numero: "" }); setFile(undefined);
    (e.target as HTMLFormElement).reset();
  }

  return (
    <Shell title="Peças & estoque" subtitle="Margem de lucro calculada automaticamente."
      action={<input className="input w-72" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />}>
      <Card>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 md:gap-5">
          <Field label="Código"><input className="input font-mono text-primary" value={codigo} readOnly /></Field>
          <Field label="Nome da peça"><input className="input" placeholder="Colar baiano 18k" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></Field>
          <Field label="Categoria"><select className="input" value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Qualidade / banho"><select className="input" value={f.qualidade} onChange={(e) => setF({ ...f, qualidade: e.target.value })}>{QUAL.map((c) => <option key={c}>{c}</option>)}</select></Field>
          {f.categoria === "Anel" ? (
            <Field label="Numerações (anel)">
              <input className="input" placeholder="Ex.: 14, 16, 17, 19" value={f.numero} onChange={(e) => setF({ ...f, numero: e.target.value })} />
              <span className="mt-1 block text-xs text-muted-foreground">Separe por vírgula para cadastrar uma peça em cada numeração.</span>
            </Field>
          ) : null}
          <Field label="Quantidade"><input type="number" min="0" className="input" value={f.estoque} onChange={(e) => setF({ ...f, estoque: e.target.value })} /></Field>
          <Field label="Preço de custo (R$)"><input type="number" step="0.01" className="input" value={f.custo} onChange={(e) => setF({ ...f, custo: e.target.value })} /></Field>
          <Field label="Margem (%)"><input type="number" className="input" value={f.margem} onChange={(e) => setF({ ...f, margem: e.target.value })} /></Field>
          <Field label="Preço de venda"><div className="input flex items-center font-semibold text-primary">{brl(venda)}</div></Field>
          <div className="md:col-span-3"><Field label="Foto da peça"><input type="file" accept="image/*" className="input file-input" onChange={(e) => setFile(e.target.files?.[0])} /></Field></div>
          <div className="flex items-end"><button className="btn-primary w-full">Cadastrar peça</button></div>
        </form>
      </Card>
      <Card className="mt-6 overflow-x-auto p-0">
        <table className="table min-w-[640px]">
          <thead><tr><th>Foto</th><th>Código</th><th>Peça</th><th>Categoria</th><th>Custo</th><th>Venda</th><th>Estoque</th><th /></tr></thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id}>
                <td>{p.foto ? <img src={p.foto} alt="" className="h-10 w-10 rounded-md object-cover" /> : <div className="avatar rounded-md"><Gem className="h-4 w-4" /></div>}</td>
                <td className="font-mono text-xs text-primary">{p.codigo}</td>
                <td><div className="font-medium">{p.nome}</div><div className="text-xs text-muted-foreground">{p.qualidade}</div></td>
                <td>{p.categoria}{p.numero ? <span className="ml-1 font-mono text-xs text-muted-foreground">Nº {p.numero}</span> : null}</td><td className="tabular-nums">{brl(p.custo)}</td><td className="tabular-nums font-medium">{brl(p.venda)}</td>
                <td><span className={p.estoque > 0 ? "badge" : "badge badge-danger"}>{p.estoque} un.</span></td>
                <td className="text-right"><button className="btn-icon" onClick={() => actions.delPeca(p.id)} aria-label="Excluir"><Trash2 className="h-4 w-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && <Empty>Nenhuma peça encontrada.</Empty>}
      </Card>
    </Shell>
  );
}
