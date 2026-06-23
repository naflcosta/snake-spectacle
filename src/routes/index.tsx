import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Snake Arena — Play, compete, spectate" },
      { name: "description", content: "A modern Snake game with walls and pass-through modes, leaderboards, and live spectating." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <section className="text-center">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Snake Arena
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Classic Snake reimagined. Two modes, a global leaderboard, and live spectating.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/play"
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Start playing
          </Link>
          <Link
            to="/leaderboard"
            className="inline-flex items-center justify-center rounded-md border border-input px-5 py-3 text-sm font-medium hover:bg-accent"
          >
            Leaderboard
          </Link>
          <Link
            to="/spectate"
            className="inline-flex items-center justify-center rounded-md border border-input px-5 py-3 text-sm font-medium hover:bg-accent"
          >
            Watch live games
          </Link>
        </div>
      </section>

      <section className="mt-16 grid gap-6 sm:grid-cols-3">
        <Card title="Walls mode" body="Hit a wall, you die. Old-school discipline." />
        <Card title="Pass-through mode" body="Wrap around the edges. New strategies open up." />
        <Card title="Spectate" body="Watch other players' live games in real time." />
      </section>
    </main>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
