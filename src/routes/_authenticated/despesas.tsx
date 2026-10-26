import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Trash2, Paperclip, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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

async function abrirComprovante(path: string) {
  const { data, error } = await supabase.storage.from("comprovantes").createSignedUrl(path, 300);
  if (error || !data) { toast.error("Não foi possível abrir o comprovante."); return; }
  window.open(data.signedUrl, "_blank");
}

function Despesas() {
  const s = useStore();
  const [f, setF] = useState({ descricao: "", valor: "", pagamento: "Pix" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const total = s.despesas.reduce((a, d) => a + d.valor, 0);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.descricao || !Number(f.valor)) { toast.error("Preencha descrição e valor."); return; }
    setBusy(true);
    let comprovante: string | undefined;
    if (file) {
      const { data: u } = await supabase.auth.getUser();
      const ext = file.name.split(".").pop() || "bin";
      const path = `${u.user?.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("comprovantes").upload(path, file, { contentType: file.type });
      if (error) { setBusy(false); toast.error("Falha ao enviar o comprovante."); return; }
      comprovante = path;
    }
    actions.addDespesa({ descricao: f.descricao, valor: Number(f.valor), pagamento: f.pagamento, comprovante });
    setF({ ...f, descricao: "", valor: "" });
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    setBusy(false);
    toast.success("Despesa registrada.");
  }
  return (
    <Shell title="Despesas" subtitle="Custos fixos, embalagens, fretes e insumos."
      action={<div className="text-right"><div className="field-label">Total gasto</div><div className="font-display text-2xl">{brl(total)}</div></div>}>
      <Card>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 md:gap-5">
          <Field label="Descrição"><input className="input" placeholder="Embalagens, frete…" value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} /></Field>
          <Field label="Valor (R$)"><input type="number" step="0.01" className="input" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} /></Field>
          <Field label="Pagamento"><select className="input" value={f.pagamento} onChange={(e) => setF({ ...f, pagamento: e.target.value })}>{PAG.map((p) => <option key={p}>{p}</option>)}</select></Field>
          <Field label="Comprovante">
            <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <button type="button" onClick={() => fileRef.current?.click()} className="input flex items-center gap-2 text-left">
              <Paperclip className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">{file ? file.name : "Anexar arquivo"}</span>
            </button>
          </Field>
          <div className="flex items-end"><button disabled={busy} className="btn-primary w-full disabled:opacity-60">{busy ? "Enviando…" : "Registrar despesa"}</button></div>
        </form>
      </Card>
      <Card className="mt-6 overflow-x-auto p-0">
        <table className="table min-w-[640px]">
          <thead><tr><th>Data</th><th>Descrição</th><th>Pagamento</th><th>Valor</th><th>Comprovante</th><th /></tr></thead>
          <tbody>
            {s.despesas.map((d) => (
              <tr key={d.id}>
                <td className="text-muted-foreground">{new Date(d.data).toLocaleDateString("pt-BR")}</td>
                <td className="font-medium">{d.descricao}</td><td>{d.pagamento}</td><td className="tabular-nums">{brl(d.valor)}</td>
                <td>{d.comprovante
                  ? <button className="inline-flex items-center gap-1 text-primary hover:underline" onClick={() => abrirComprovante(d.comprovante!)}><FileText className="h-4 w-4" />Ver</button>
                  : <span className="text-muted-foreground">—</span>}</td>
                <td className="text-right"><button className="btn-icon" onClick={() => { if (d.comprovante) void supabase.storage.from("comprovantes").remove([d.comprovante]); actions.delDespesa(d.id); }} aria-label="Excluir"><Trash2 className="h-4 w-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!s.despesas.length && <Empty>Nenhuma despesa registrada.</Empty>}
      </Card>
    </Shell>
  );
}
