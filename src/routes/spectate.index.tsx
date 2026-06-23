import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getGameService } from "@/services";
import type { ActiveGame } from "@/services/types";

export const Route = createFileRoute("/spectate/")({
  head: () => ({
    meta: [
      { title: "Spectate live games — Snake Arena" },
      { name: "description", content: "Watch other players' live Snake games." },
    ],
  }),
  component: SpectatePage,
});

function SpectatePage() {
  const [games, setGames] = useState<ActiveGame[]>([]);

  useEffect(() => {
    return getGameService().onActiveGamesChange(setGames);
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Live games</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Open this page in another tab while playing to watch yourself live.
      </p>

      {games.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No active games right now.
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {games.map((g) => (
            <li key={g.userId}>
              <Link
                to="/spectate/$userId"
                params={{ userId: g.userId }}
                className="block rounded-lg border border-border bg-card p-4 hover:bg-accent transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">@{g.username}</span>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {g.mode === "walls" ? "Walls" : "Pass-through"}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Length {g.state.snake.length}</span>
                  <span className="font-mono font-bold">{g.state.score}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
