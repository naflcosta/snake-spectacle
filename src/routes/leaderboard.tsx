import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getGameService } from "@/services";
import type { GameMode, ScoreEntry } from "@/services/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Snake Arena" },
      { name: "description", content: "Top Snake scores per mode." },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const [mode, setMode] = useState<GameMode>("walls");
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    void getGameService()
      .getLeaderboard(mode, 20)
      .then((s) => {
        if (!cancel) {
          setScores(s);
          setLoading(false);
        }
      });
    return () => {
      cancel = true;
    };
  }, [mode]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <Tabs value={mode} onValueChange={(v) => setMode(v as GameMode)}>
          <TabsList>
            <TabsTrigger value="walls">Walls</TabsTrigger>
            <TabsTrigger value="wrap">Pass-through</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {loading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Loading…</p>
        ) : scores.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            No scores yet. Be the first!
          </p>
        ) : (
          <ol className="divide-y divide-border">
            {scores.map((s, i) => (
              <li key={s.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`w-8 font-mono text-sm ${i < 3 ? "font-bold text-primary" : "text-muted-foreground"}`}>
                    #{i + 1}
                  </span>
                  <span className="font-medium">@{s.username}</span>
                </div>
                <span className="font-mono font-bold">{s.score}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </main>
  );
}
