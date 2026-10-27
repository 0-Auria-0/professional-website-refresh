import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowRight, Boxes, ReceiptText, ShieldCheck, ShoppingBag, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Semijoias Gestão" },
      { name: "description", content: "Conheça o sistema de gestão de semijoias e acesse ou crie sua conta." },
      { property: "og:title", content: "Semijoias Gestão — vendas, estoque e finanças" },
      { property: "og:description", content: "Estoque, vendas, revendedoras e despesas em um só lugar, no celular ou no computador." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ animationDelay: `${delay}ms` }} className={`${show ? "animate-rise" : "opacity-0"} ${className}`}>
      {children}
    </div>
  );
}

const areas = [
  {
    n: "01",
    t: "Vendas & caixa",
    d: "Lance uma venda com várias peças de uma vez, parcelamento no cartão em até 12x e desconto dividido entre os itens.",
    b: ["Busca por nome, código ou categoria", "Quantidade ajustável por peça", "Estoque baixado automaticamente"],
    icon: ShoppingBag,
    visual: [
      { l: "Brinco pérola", r: "2 × R$ 89,00" },
      { l: "Anel Nº 17", r: "1 × R$ 129,00" },
      { l: "Cartão de crédito", r: "3x sem juros" },
    ],
  },
  {
    n: "02",
    t: "Peças & estoque",
    d: "Cadastre peças com margem que calcula o preço de venda sozinha e numeração de anéis lançada de uma só vez.",
    b: ["Vários tamanhos por lançamento (14, 16, 17...)", "Preço sugerido pela margem", "Alerta de estoque baixo"],
    icon: Boxes,
    visual: [
      { l: "Peças em estoque", r: "atualizado a cada venda" },
      { l: "Valor em estoque", r: "calculado no sistema" },
      { l: "Alerta", r: "2 unidades ou menos" },
    ],
  },
  {
    n: "03",
    t: "Revendedoras & clientes",
    d: "Encontre qualquer pessoa pelo nome, CPF ou telefone na hora de registrar a venda e acompanhe quem mais vende.",
    b: ["Busca por nome, CPF ou telefone", "Cadastro rápido", "Ranking das melhores vendedoras"],
    icon: Users,
    visual: [
      { l: "Busca", r: "nome, CPF ou telefone" },
      { l: "Ranking", r: "quem mais vende no mês" },
      { l: "Ficha", r: "histórico de compras" },
    ],
  },
  {
    n: "04",
    t: "Despesas & custos",
    d: "Registre cada gasto da operação e guarde o comprovante no arquivo, com foto ou PDF anexado ao lançamento.",
    b: ["Foto ou PDF do comprovante", "Arquivo protegido por conta", "Total do mês sempre à vista"],
    icon: ReceiptText,
    visual: [
      { l: "Comprovante", r: "foto ou PDF" },
      { l: "Acesso", r: "só a sua conta vê" },
      { l: "Resumo", r: "despesas × faturamento" },
    ],
  },
];

const passos = [
  { n: "1", t: "Crie sua conta", d: "Entre com Google ou cadastre e-mail e senha. Leva menos de um minuto." },
  { n: "2", t: "Cadastre suas peças", d: "Informe custo e margem: o preço de venda sai pronto, com numeração de anéis." },
  { n: "3", t: "Registre as vendas", d: "Escolha as peças, a revendedora e a forma de pagamento. O estoque e o caixa se ajustam." },
];

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

  async function esqueci() {
    if (!email) { toast.error("Digite seu e-mail no campo acima primeiro."); return; }
    setBusy(true);
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    toast.success("Se o e-mail estiver cadastrado, enviamos um link para criar nova senha.");
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const KEY = "login-tentativas";
    const reg = JSON.parse(localStorage.getItem(KEY) || '{"n":0,"ate":0}') as { n: number; ate: number };
    if (reg.ate > Date.now()) {
      const min = Math.ceil((reg.ate - Date.now()) / 60000);
      toast.error(`Muitas tentativas. Tente de novo em ${min} min ou use "Esqueci minha senha".`);
      return;
    }
    if (modo === "criar" && (senha.length < 8 || !/[A-Za-z]/.test(senha) || !/\d/.test(senha))) {
      toast.error("A senha precisa ter 8 caracteres ou mais, com letras e números.");
      return;
    }
    setBusy(true);
    if (modo === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) {
        const n = reg.n + 1;
        const bloqueia = n >= 5;
        localStorage.setItem(KEY, JSON.stringify({ n: bloqueia ? 0 : n, ate: bloqueia ? Date.now() + 15 * 60000 : 0 }));
        toast.error(bloqueia ? "5 tentativas erradas. Acesso bloqueado por 15 minutos." : `E-mail ou senha incorretos. Restam ${5 - n} tentativas.`);
      } else localStorage.removeItem(KEY);
    } else {
      const { error } = await supabase.auth.signUp({ email, password: senha, options: { emailRedirectTo: window.location.origin } });
      if (error) toast.error(/pwned|leak|compromised|weak/i.test(error.message) ? "Essa senha já apareceu em vazamentos na internet. Escolha outra." : error.message);
      else toast.success("Conta criada! Confirme pelo link enviado ao seu e-mail.");
    }
    setBusy(false);
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Não foi possível entrar com Google.");
  }

  function irParaLogin(novoModo?: "entrar" | "criar") {
    if (novoModo) setModo(novoModo);
    document.getElementById("entrar")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-sidebar-border/50 bg-sidebar/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div>
            <div className="font-display text-xl tracking-wide text-sidebar-foreground">Semijoias</div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-sidebar-primary">Gestão & ateliê</div>
          </div>
          <button onClick={() => irParaLogin()} className="rounded-md border border-sidebar-primary/40 px-4 py-2 text-xs font-semibold text-sidebar-primary transition hover:bg-sidebar-primary hover:text-sidebar">
            Entrar
          </button>
        </div>
      </header>

      <section className="relative overflow-hidden bg-sidebar px-5 pb-16 pt-14 text-sidebar-foreground sm:pb-24 sm:pt-20">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-sidebar-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-sidebar-primary/10 blur-3xl" />
        <div className="relative mx-auto max-w-3xl text-center">
          <Reveal>
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-sidebar-border px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-sidebar-foreground/70">
              <span className="h-1.5 w-1.5 rounded-full bg-sidebar-primary" /> Sistema de gestão para joalherias
            </div>
          </Reveal>
          <Reveal delay={90}>
            <h1 className="mt-6 font-display text-4xl leading-[1.1] sm:text-6xl">
              A gestão do seu negócio de semijoias, <span className="gold-shimmer">elegante e completa.</span>
            </h1>
          </Reveal>
          <Reveal delay={180}>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-sidebar-foreground/70 sm:text-base">
              Estoque, vendas, revendedoras e despesas em um só lugar — no computador ou no celular, com os dados salvos na nuvem.
            </p>
          </Reveal>
          <Reveal delay={260}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button onClick={() => irParaLogin("criar")} className="btn-primary w-full bg-sidebar-primary text-sidebar sm:w-auto">
                Criar minha conta <ArrowRight className="h-4 w-4" />
              </button>
              <button onClick={() => irParaLogin("entrar")} className="w-full rounded-md border border-sidebar-border px-5 py-2.5 text-sm font-semibold text-sidebar-foreground transition hover:bg-sidebar-accent sm:w-auto">
                Já tenho conta
              </button>
            </div>
          </Reveal>
          <Reveal delay={340}>
            <div className="mt-12 grid grid-cols-3 gap-3 border-t border-sidebar-border pt-6 text-center">
              {[
                { k: "4 áreas", v: "vendas, estoque, clientes e despesas" },
                { k: "Celular & PC", v: "o mesmo sistema nos dois" },
                { k: "Na nuvem", v: "cada conta vê só os seus dados" },
              ].map((s) => (
                <div key={s.k}>
                  <div className="font-display text-lg text-sidebar-primary sm:text-2xl">{s.k}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-sidebar-foreground/55 sm:text-xs">{s.v}</div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={420}>
            <button onClick={() => document.getElementById("areas")?.scrollIntoView({ behavior: "smooth" })} className="mt-12 inline-flex flex-col items-center gap-1 text-[11px] uppercase tracking-[0.2em] text-sidebar-foreground/50 transition hover:text-sidebar-primary">
              role para conhecer
              <ArrowDown className="h-4 w-4 animate-bounce" />
            </button>
          </Reveal>
        </div>
      </section>

      <div id="areas" className="scroll-mt-20" />

      {areas.map((a, i) => {
        const Icon = a.icon;
        return (
          <section key={a.n} className={`px-5 py-14 sm:py-20 ${i % 2 === 1 ? "bg-muted/60" : "bg-background"}`}>
            <div className="mx-auto grid max-w-5xl items-center gap-8 lg:grid-cols-2 lg:gap-14">
              <Reveal className={i % 2 === 1 ? "lg:order-2" : ""}>
                <div className="flex items-center gap-3">
                  <span className="font-display text-4xl text-primary/35">{a.n}</span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <h2 className="mt-4 font-display text-3xl leading-tight text-foreground sm:text-4xl">{a.t}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{a.d}</p>
                <ul className="mt-6 space-y-2.5">
                  {a.b.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-foreground/80">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {b}
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={120} className={i % 2 === 1 ? "lg:order-1" : ""}>
                <div className="card lift">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="field-label mb-0">{a.t}</span>
                    <span className="h-2 w-2 rounded-full bg-primary/60" />
                  </div>
                  <div className="mt-3 space-y-2.5">
                    {a.visual.map((v) => (
                      <div key={v.l} className="flex items-center justify-between rounded-md bg-muted/70 px-3 py-2.5">
                        <span className="text-sm font-medium text-foreground">{v.l}</span>
                        <span className="text-xs text-muted-foreground">{v.r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
          </section>
        );
      })}

      <section className="bg-sidebar px-5 py-14 text-sidebar-foreground sm:py-20">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="text-center">
              <div className="text-[11px] uppercase tracking-[0.22em] text-sidebar-primary">Como começar</div>
              <h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">Em três passos você já está vendendo</h2>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {passos.map((p, i) => (
              <Reveal key={p.n} delay={i * 110}>
                <div className="h-full rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-6">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-sidebar-primary/40 font-display text-lg text-sidebar-primary">{p.n}</div>
                  <div className="mt-4 text-base font-semibold text-sidebar-accent-foreground">{p.t}</div>
                  <p className="mt-2 text-sm leading-relaxed text-sidebar-foreground/65">{p.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={340}>
            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-sidebar-foreground/55">
              <ShieldCheck className="h-4 w-4 text-sidebar-primary" />
              Dados protegidos e salvos na nuvem · Cada conta vê apenas os próprios dados
            </div>
          </Reveal>
        </div>
      </section>

      <section id="entrar" className="scroll-mt-16 bg-background px-5 py-14 sm:py-20">
        <div className="mx-auto max-w-md">
          <Reveal>
            <div className="text-center">
              <div className="text-[11px] uppercase tracking-[0.22em] text-primary">Acesse o sistema</div>
              <h2 className="mt-3 font-display text-3xl text-foreground sm:text-4xl">{modo === "entrar" ? "Entre na sua conta" : "Crie sua conta gratuita"}</h2>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="card mt-8 p-6 sm:p-8">
              <button onClick={google} className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background py-2.5 text-sm font-medium text-foreground hover:bg-muted">
                <svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="currentColor" d="M21.35 11.1H12v2.9h5.35c-.25 1.5-1.7 4.4-5.35 4.4-3.2 0-5.85-2.65-5.85-5.9S8.8 6.6 12 6.6c1.85 0 3.05.8 3.75 1.45l2.55-2.45C16.7 4.1 14.55 3 12 3 7 3 3 7 3 12s4 9 9 9c5.2 0 8.65-3.65 8.65-8.8 0-.6-.05-1.05-.3-1.1z" /></svg>
                Continuar com Google
              </button>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />ou<span className="h-px flex-1 bg-border" /></div>
              <form onSubmit={submit} className="space-y-3">
                <input className="input" type="email" required placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input className="input" type="password" required minLength={modo === "criar" ? 8 : 6} placeholder={modo === "criar" ? "Senha (8+ caracteres, letras e números)" : "Senha"} value={senha} onChange={(e) => setSenha(e.target.value)} />
                <button disabled={busy} className="btn-primary w-full">
                  {modo === "entrar" ? "Entrar" : "Criar conta"}
                </button>
              </form>
              {modo === "entrar" && (
                <button type="button" onClick={esqueci} disabled={busy} className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-primary hover:underline">
                  Esqueci minha senha
                </button>
              )}
              <p className="mt-5 text-center text-sm text-muted-foreground">
                {modo === "entrar" ? "Ainda não tem conta? " : "Já tem conta? "}
                <button className="font-medium text-primary hover:underline" onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")}>
                  {modo === "entrar" ? "Criar conta" : "Entrar"}
                </button>
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-border bg-muted/60 px-5 py-8 text-center text-xs text-muted-foreground">
        Semijoias Gestão · vendas, estoque, revendedoras e despesas em um só lugar
      </footer>
    </div>
  );
}
