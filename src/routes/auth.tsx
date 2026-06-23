import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Log in or sign up — Snake Arena" },
      { name: "description", content: "Create an account or log in to save your scores." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { login, signup, user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  if (user) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <p>You're logged in as @{user.username}.</p>
        <Button className="mt-4" onClick={() => navigate({ to: "/play" })}>
          Go play
        </Button>
      </main>
    );
  }

  async function submit(kind: "login" | "signup", u: string, p: string) {
    setBusy(true);
    try {
      if (kind === "login") await login(u, p);
      else await signup(u, p);
      toast.success(kind === "login" ? "Welcome back!" : "Account created!");
      navigate({ to: "/play" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-bold mb-6 text-center">Welcome</h1>
      <Tabs defaultValue="login">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Log in</TabsTrigger>
          <TabsTrigger value="signup">Sign up</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <AuthForm busy={busy} cta="Log in" onSubmit={(u, p) => submit("login", u, p)} />
          <p className="mt-4 text-xs text-muted-foreground text-center">
            Try demo / demo
          </p>
        </TabsContent>
        <TabsContent value="signup">
          <AuthForm busy={busy} cta="Create account" onSubmit={(u, p) => submit("signup", u, p)} />
        </TabsContent>
      </Tabs>
    </main>
  );
}

function AuthForm({
  busy,
  cta,
  onSubmit,
}: {
  busy: boolean;
  cta: string;
  onSubmit: (u: string, p: string) => void;
}) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  return (
    <form
      className="mt-4 space-y-4 rounded-lg border border-border bg-card p-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(u, p);
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" value={u} onChange={(e) => setU(e.target.value)} required minLength={2} autoComplete="username" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" value={p} onChange={(e) => setP(e.target.value)} required minLength={3} autoComplete="current-password" />
      </div>
      <Button className="w-full" type="submit" disabled={busy}>
        {busy ? "…" : cta}
      </Button>
    </form>
  );
}
