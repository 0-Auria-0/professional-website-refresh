import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — Semijoias Gestão" },
      { name: "description", content: "Crie uma nova senha para sua conta do Semijoias Gestão." },
      { property: "og:title", content: "Nova senha — Semijoias Gestão" },
      { property: "og:description", content: "Redefina a senha da sua conta com segurança." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [conf, setConf] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (senha.length < 8 || !/[A-Za-z]/.test(senha) || !/\d/.test(senha)) { toast.error("Use 8 caracteres ou mais, com letras e números."); return; }
    if (senha !== conf) { toast.error("As senhas não são iguais."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setBusy(false);
    if (error) { toast.error(/pwned|leak|compromised|weak/i.test(error.message) ? "Essa senha já apareceu em vazamentos. Escolha outra." : "Link expirado ou inválido. Peça um novo em Esqueci minha senha."); return; }
    toast.success("Senha alterada com sucesso!");
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <form onSubmit={submit} className="card w-full max-w-md space-y-3 p-6 sm:p-8">
        <h1 className="font-display text-3xl text-foreground">Criar nova senha</h1>
        <p className="text-sm text-muted-foreground">Escolha uma senha forte, com letras e números.</p>
        <input className="input" type="password" required placeholder="Nova senha" value={senha} onChange={(e) => setSenha(e.target.value)} />
        <input className="input" type="password" required placeholder="Repita a nova senha" value={conf} onChange={(e) => setConf(e.target.value)} />
        <button disabled={busy} className="btn-primary w-full">Salvar nova senha</button>
      </form>
    </div>
  );
}
