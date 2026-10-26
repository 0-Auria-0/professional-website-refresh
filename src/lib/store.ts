import { useSyncExternalStore } from "react";

export type Cliente = { id: string; codigo: string; nome: string; cpf: string; telefone: string; foto?: string };
export type Peca = {
  id: string; codigo: string; nome: string; categoria: string; qualidade: string;
  estoque: number; custo: number; venda: number; foto?: string;
};
export type Venda = {
  id: string; data: string; clienteId: string; pecaId: string; qtd: number;
  pagamento: string; desconto: number; total: number; custo: number; categoria: string;
};
export type Despesa = { id: string; descricao: string; valor: number; pagamento: string; data: string };

type State = { clientes: Cliente[]; pecas: Peca[]; vendas: Venda[]; despesas: Despesa[] };
const KEY = "semijoias-v1";
const empty: State = { clientes: [], pecas: [], vendas: [], despesas: [] };
let state: State = empty;
let loaded = false;
const subs = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try { state = { ...empty, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { /* ignore */ }
}
function set(fn: (s: State) => State) {
  state = fn(state);
  localStorage.setItem(KEY, JSON.stringify(state));
  subs.forEach((s) => s());
}
export function useStore() {
  return useSyncExternalStore(
    (cb) => { load(); subs.add(cb); cb(); return () => subs.delete(cb); },
    () => { load(); return state; },
    () => empty,
  );
}
const uid = () => Math.random().toString(36).slice(2, 10);
export const novoCodigo = (prefix: string, list: { codigo: string }[]) =>
  `${prefix}-${String(list.length + 1).padStart(3, "0")}`;

export const actions = {
  addCliente: (c: Omit<Cliente, "id">) => set((s) => ({ ...s, clientes: [...s.clientes, { ...c, id: uid() }] })),
  delCliente: (id: string) => set((s) => ({ ...s, clientes: s.clientes.filter((c) => c.id !== id) })),
  addPeca: (p: Omit<Peca, "id">) => set((s) => ({ ...s, pecas: [...s.pecas, { ...p, id: uid() }] })),
  delPeca: (id: string) => set((s) => ({ ...s, pecas: s.pecas.filter((p) => p.id !== id) })),
  addDespesa: (d: Omit<Despesa, "id" | "data">) =>
    set((s) => ({ ...s, despesas: [...s.despesas, { ...d, id: uid(), data: new Date().toISOString() }] })),
  delDespesa: (id: string) => set((s) => ({ ...s, despesas: s.despesas.filter((d) => d.id !== id) })),
  addVenda: (v: Omit<Venda, "id" | "data">) =>
    set((s) => ({
      ...s,
      vendas: [...s.vendas, { ...v, id: uid(), data: new Date().toISOString() }],
      pecas: s.pecas.map((p) => (p.id === v.pecaId ? { ...p, estoque: p.estoque - v.qtd } : p)),
    })),
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
