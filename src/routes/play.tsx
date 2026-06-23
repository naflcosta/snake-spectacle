import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SnakeBoard } from "@/components/SnakeBoard";
import { useSnakeGame } from "@/hooks/use-snake-game";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { GameMode } from "@/services/types";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Play Snake — Snake Arena" },
      { name: "description", content: "Play Snake in walls or pass-through mode." },
    ],
  }),
  component: PlayPage,
});

function PlayPage() {
  const [mode, setMode] = useState<GameMode>("walls");
  const { state, running, start, pause, reset } = useSnakeGame(mode);
  const { user } = useAuth();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Play</h1>
          <p className="text-sm text-muted-foreground">
            Arrow keys or WASD. Space to pause.
          </p>
        </div>
        <Tabs value={mode} onValueChange={(v) => setMode(v as GameMode)}>
          <TabsList>
            <TabsTrigger value="walls">Walls</TabsTrigger>
            <TabsTrigger value="wrap">Pass-through</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="flex w-full max-w-[480px] items-center justify-between text-sm">
          <span className="font-mono">
            Score: <span className="font-bold text-primary">{state.score}</span>
          </span>
          <span className="text-muted-foreground">
            {state.alive ? (running ? "Playing" : "Paused") : "Game over"}
          </span>
        </div>

        <SnakeBoard state={state} />

        <div className="flex gap-2">
          {!state.alive ? (
            <Button onClick={reset}>Play again</Button>
          ) : running ? (
            <Button variant="outline" onClick={pause}>Pause</Button>
          ) : (
            <Button onClick={start}>Start</Button>
          )}
          <Button variant="ghost" onClick={reset}>Reset</Button>
        </div>

        {!user && (
          <p className="text-sm text-muted-foreground text-center">
            <Link to="/auth" className="underline">Log in</Link> to save your scores to the leaderboard.
          </p>
        )}
      </div>
    </main>
  );
}
