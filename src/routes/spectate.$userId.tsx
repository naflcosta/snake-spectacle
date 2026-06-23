import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getGameService } from "@/services";
import type { ActiveGame } from "@/services/types";
import { SnakeBoard } from "@/components/SnakeBoard";

export const Route = createFileRoute("/spectate/$userId")({
  head: () => ({
    meta: [
      { title: "Watch live — Snake Arena" },
      { name: "description", content: "Live spectator view of a Snake game." },
    ],
  }),
  component: SpectateGamePage,
});

function SpectateGamePage() {
  const { userId } = Route.useParams();
  const [game, setGame] = useState<ActiveGame | null>(null);

  useEffect(() => {
    return getGameService().watchGame(userId, setGame);
  }, [userId]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/spectate" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to live games
      </Link>

      {!game ? (
        <div className="mt-8 rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          This player isn't currently playing.
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold">@{game.username}</h1>
            <p className="text-sm text-muted-foreground">
              {game.mode === "walls" ? "Walls" : "Pass-through"} · Score{" "}
              <span className="font-mono font-bold text-foreground">{game.state.score}</span>
            </p>
          </div>
          <SnakeBoard state={game.state} />
        </div>
      )}
    </main>
  );
}
