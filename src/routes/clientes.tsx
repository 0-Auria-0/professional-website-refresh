import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Shell, Card, Field, Empty } from "@/components/Shell";
import { useStore, actions, novoCodigo, readImage } from "@/lib/store";

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [
      { title: "Revendedoras — Semijoias" },
      { name: "description", content: "Cadastro de revendedoras e clientes com foto, CPF e telefone." },
      { property: "og:title", content: "Revendedoras — Semijoias" },
      { property: "og:description", content: "Cadastro de revendedoras e clientes." },
    ],
  }),
  component: Clientes,
});

function Clientes() {
  const s = useStore();
  const [f, setF] = useState({ nome: "", cpf: "", telefone: "" });
  const [file, setFile] = useState<File>();
  const [q, setQ] = useState("");
  const codigo = novoCodigo("CLI", s.clientes);
  const list = s.clientes.filter((c) => `${c.nome} ${c.codigo} ${c.cpf}`.toLowerCase().includes(q.toLowerCase()));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.nome) return;
    actions.addCliente({ ...f, codigo, foto: await readImage(file) });
    setF({ nome: "", cpf: "", telefone: "" }); setFile(undefined);
    (e.target as HTMLFormElement).reset();
  }

  return (
    <Shell title="Revendedoras" subtitle="Cadastro com foto e busca por nome, código ou CPF."
      action={<input className="input w-72" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />}>
      <Card>
        <form onSubmit={submit} className="grid gap-5 md:grid-cols-4">
          <Field label="Código"><input className="input font-mono text-primary" value={codigo} readOnly /></Field>
          <Field label="Nome completo"><input className="input" placeholder="Maria Oliveira" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></Field>
          <Field label="CPF"><input className="input" placeholder="000.000.000-00" value={f.cpf} onChange={(e) => setF({ ...f, cpf: e.target.value })} /></Field>
          <Field label="Telefone / WhatsApp"><input className="input" placeholder="(33) 99999-8888" value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} /></Field>
          <div className="md:col-span-3"><Field label="Foto"><input type="file" accept="image/*" className="input file-input" onChange={(e) => setFile(e.target.files?.[0])} /></Field></div>
          <div className="flex items-end"><button className="btn-primary w-full">Cadastrar</button></div>
        </form>
      </Card>
      <Card className="mt-6 overflow-x-auto p-0">
        <table className="table">
          <thead><tr><th>Foto</th><th>Código</th><th>Nome</th><th>CPF</th><th>Telefone</th><th /></tr></thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id}>
                <td>{c.foto ? <img src={c.foto} alt="" className="h-9 w-9 rounded-full object-cover" /> : <div className="avatar">{c.nome[0]}</div>}</td>
                <td className="font-mono text-xs text-primary">{c.codigo}</td><td className="font-medium">{c.nome}</td><td>{c.cpf}</td><td>{c.telefone}</td>
                <td className="text-right"><button className="btn-icon" onClick={() => actions.delCliente(c.id)} aria-label="Excluir"><Trash2 className="h-4 w-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && <Empty>Nenhuma revendedora cadastrada.</Empty>}
      </Card>
    </Shell>
  );
}
