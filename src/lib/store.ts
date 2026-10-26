import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type Cliente = { id: string; codigo: string; nome: string; cpf: string; telefone: string; foto?: string | undefined };
export type Peca = {
  id: string; codigo: string; nome: string; categoria: string; qualidade: string;
  estoque: number; custo: number; venda: number; foto?: string | undefined;
};
export type Venda = {
  id: string; data: string; clienteId: string; pecaId: string; qtd: number;
  pagamento: string; desconto: number; total: number; custo: number; categoria: string;
};
export type Despesa = { id: string; descricao: string; valor: number; pagamento: string; data: string };

type State = { clientes: Cliente[]; pecas: Peca[]; vendas: Venda[]; despesas: Despesa[] };
type Tipo = keyof State;
const empty: State = { clientes: [], pecas: [], vendas: [], despesas: [] };
let state: State = empty;
let loadedFor: string | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((s) => s());

async function load() {
  const { data: u } = await supabase.auth.getUser();
  const uidUser = u.user?.id ?? null;
  if (!uidUser || loadedFor === uidUser) return;
  loadedFor = uidUser;
  const { data, error } = await supabase.from("registros").select("id,tipo,dados").order("created_at");
  if (error) { toast.error("Erro ao carregar dados."); loadedFor = null; return; }
  const next: State = { clientes: [], pecas: [], vendas: [], despesas: [] };
  for (const r of data ?? []) {
    const t = r.tipo as Tipo;
    if (next[t]) (next[t] as unknown[]).push({ ...(r.dados as object), id: r.id });
  }
  state = next;
  emit();
}

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") { state = empty; loadedFor = null; emit(); }
    if (event === "SIGNED_IN") void load();
  });
}

export function useStore() {
  return useSyncExternalStore(
    (cb) => { void load(); subs.add(cb); return () => subs.delete(cb); },
    () => state,
    () => empty,
  );
}

const strip = <T extends { id: string }>(o: T) => { const { id: _id, ...rest } = o; return rest; };

function add<T extends Tipo>(tipo: T, item: State[T][number]) {
  state = { ...state, [tipo]: [...state[tipo], item] };
  emit();
  void supabase.from("registros").insert({ id: item.id, tipo, dados: strip(item) as never }).then(({ error }) => {
    if (error) toast.error("Não foi possível salvar.");
  });
}
function del<T extends Tipo>(tipo: T, id: string) {
  state = { ...state, [tipo]: (state[tipo] as { id: string }[]).filter((x) => x.id !== id) };
  emit();
  void supabase.from("registros").delete().eq("id", id).then(({ error }) => { if (error) toast.error("Não foi possível excluir."); });
}
function update<T extends Tipo>(tipo: T, item: State[T][number]) {
  state = { ...state, [tipo]: (state[tipo] as { id: string }[]).map((x) => (x.id === item.id ? item : x)) };
  emit();
  void supabase.from("registros").update({ dados: strip(item) as never }).eq("id", item.id);
}

const uid = () => crypto.randomUUID();
export const novoCodigo = (prefix: string, list: { codigo: string }[]) =>
  `${prefix}-${String(list.length + 1).padStart(3, "0")}`;

export const actions = {
  addCliente: (c: Omit<Cliente, "id">) => add("clientes", { ...c, id: uid() }),
  delCliente: (id: string) => del("clientes", id),
  addPeca: (p: Omit<Peca, "id">) => add("pecas", { ...p, id: uid() }),
  delPeca: (id: string) => del("pecas", id),
  addDespesa: (d: Omit<Despesa, "id" | "data">) => add("despesas", { ...d, id: uid(), data: new Date().toISOString() }),
  delDespesa: (id: string) => del("despesas", id),
  addVenda: (v: Omit<Venda, "id" | "data">) => {
    add("vendas", { ...v, id: uid(), data: new Date().toISOString() });
    const p = state.pecas.find((x) => x.id === v.pecaId);
    if (p) update("pecas", { ...p, estoque: p.estoque - v.qtd });
  },
};

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function readImage(file?: File): Promise<string | undefined> {
  return new Promise((res) => {
    if (!file) return res(undefined);
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.readAsDataURL(file);
  });
}
