import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Semijoias Gestão" },
      { name: "description", content: "Acesse ou crie sua conta no sistema de gestão de semijoias." },
      { property: "og:title", content: "Entrar — Semijoias Gestão" },
      { property: "og:description", content: "Acesse ou crie sua conta no sistema de gestão de semijoias." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/", replace: true }); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => { if (s) navigate({ to: "/", replace: true }); });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (modo === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) toast.error("E-mail ou senha incorretos.");
    } else {
      const { error } = await supabase.auth.signUp({ email, password: senha, options: { emailRedirectTo: window.location.origin } });
      if (error) toast.error(error.message);
      else toast.success("Conta criada! Confirme pelo link enviado ao seu e-mail.");
    }
    setBusy(false);
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Não foi possível entrar com Google.");
  }

  const recursos = [
    { t: "Vendas & caixa", d: "Lançamento com várias peças, parcelas no cartão e baixa automática de estoque." },
    { t: "Peças & estoque", d: "Cadastro com margem automática, numeração de anéis e alerta de estoque baixo." },
    { t: "Revendedoras", d: "Busca por nome, CPF ou telefone e ranking das melhores vendedoras." },
    { t: "Despesas", d: "Controle de custos com comprovantes salvos com segurança na nuvem." },
  ];
  return (
    <div className="grid min-h-screen bg-sidebar lg:grid-cols-[1.15fr_1fr]">
      <section className="relative flex flex-col justify-between overflow-hidden px-6 py-10 text-sidebar-foreground sm:px-12 lg:py-14">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-sidebar-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-sidebar-primary/10 blur-3xl" />
        <div className="relative">
          <div className="font-display text-3xl tracking-wide">Semijoias</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.25em] text-sidebar-primary">Gestão & ateliê</div>
        </div>
        <div className="relative my-10 max-w-xl">
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">
            A gestão do seu negócio de semijoias, <span className="text-sidebar-primary">elegante e completa.</span>
          </h1>
          <p className="mt-4 text-sm text-sidebar-foreground/70 sm:text-base">
            Estoque, vendas, revendedoras e finanças em um só lugar — no computador ou no celular.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {recursos.map((r) => (
              <div key={r.t} className="rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold"><span className="h-1.5 w-1.5 rounded-full bg-sidebar-primary" />{r.t}</div>
                <p className="mt-1.5 text-xs leading-relaxed text-sidebar-foreground/65">{r.d}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-xs text-sidebar-foreground/50">Dados protegidos e salvos na nuvem · Cada conta vê apenas os próprios dados</div>
      </section>
      <div className="flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm rounded-xl bg-card p-8 shadow-xl">
        <div className="text-center">
          <div className="font-display text-3xl text-foreground">Semijoias</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.25em] text-primary">Gestão & ateliê</div>
          <p className="mt-6 text-sm text-muted-foreground">{modo === "entrar" ? "Entre na sua conta" : "Crie sua conta gratuita"}</p>
        </div>
        <button onClick={google} className="mt-6 flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background py-2.5 text-sm font-medium text-foreground hover:bg-muted">
          <svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="currentColor" d="M21.35 11.1H12v2.9h5.35c-.25 1.5-1.7 4.4-5.35 4.4-3.2 0-5.85-2.65-5.85-5.9S8.8 6.6 12 6.6c1.85 0 3.05.8 3.75 1.45l2.55-2.45C16.7 4.1 14.55 3 12 3 7 3 3 7 3 12s4 9 9 9c5.2 0 8.65-3.65 8.65-8.8 0-.6-.05-1.05-.3-1.1z"/></svg>
          Continuar com Google
        </button>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />ou<span className="h-px flex-1 bg-border" /></div>
        <form onSubmit={submit} className="space-y-3">
          <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" type="email" required placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" type="password" required minLength={6} placeholder="Senha (mín. 6 caracteres)" value={senha} onChange={(e) => setSenha(e.target.value)} />
          <button disabled={busy} className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {modo === "entrar" ? "Entrar" : "Criar conta"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          {modo === "entrar" ? "Ainda não tem conta? " : "Já tem conta? "}
          <button className="font-medium text-primary hover:underline" onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")}>
            {modo === "entrar" ? "Criar conta" : "Entrar"}
          </button>
        </p>
      </div>
      </div>
    </div>
  );
}
