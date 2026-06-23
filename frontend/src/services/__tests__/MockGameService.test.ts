import { beforeEach, describe, expect, it } from "vitest";
import { MockGameService } from "@/services/MockGameService";
import { initialState } from "@/lib/snake-engine";

describe("MockGameService", () => {
  let svc: MockGameService;

  beforeEach(() => {
    if (typeof window !== "undefined") window.localStorage.clear();
    svc = new MockGameService();
  });

  it("signs up a new user and sets the session", async () => {
    const u = await svc.signup("newbie", "pw123");
    expect(u.username).toBe("newbie");
    expect(svc.getCurrentUser()?.id).toBe(u.id);
  });

  it("rejects duplicate signups", async () => {
    await svc.signup("dup", "pw123");
    await svc.logout();
    await expect(svc.signup("dup", "pw123")).rejects.toThrow(/taken/i);
  });

  it("logs in with correct credentials and fails with wrong ones", async () => {
    await svc.signup("alice2", "secret");
    await svc.logout();
    await expect(svc.login("alice2", "wrong")).rejects.toThrow();
    const u = await svc.login("alice2", "secret");
    expect(u.username).toBe("alice2");
  });

  it("emits auth changes to listeners", async () => {
    const events: (string | null)[] = [];
    svc.onAuthChange((u) => events.push(u?.username ?? null));
    await svc.signup("listenu", "pw123");
    await svc.logout();
    expect(events).toEqual(["listenu", null]);
  });

  it("submits and ranks scores per mode", async () => {
    await svc.signup("scorer", "pw123");
    await svc.submitScore("walls", 5);
    await svc.submitScore("walls", 20);
    await svc.submitScore("wrap", 100);
    const walls = await svc.getLeaderboard("walls", 100);
    const wrap = await svc.getLeaderboard("wrap", 100);
    const wallsMine = walls.filter((s) => s.username === "scorer");
    expect(wallsMine[0].score).toBe(20);
    expect(wallsMine[1].score).toBe(5);
    expect(wrap.find((s) => s.username === "scorer")?.score).toBe(100);
  });

  it("publishes and removes active games", async () => {
    await svc.signup("watcher", "pw123");
    const state = initialState("walls");
    await svc.publishGame(state);
    let games = await svc.listActiveGames();
    expect(games.find((g) => g.username === "watcher")).toBeTruthy();
    await svc.endGame();
    games = await svc.listActiveGames();
    expect(games.find((g) => g.username === "watcher")).toBeUndefined();
  });

  it("notifies spectator watchers when a game updates", async () => {
    const me = await svc.signup("streamer", "pw123");
    const events: (number | null)[] = [];
    svc.watchGame(me.id, (g) => events.push(g?.state.score ?? null));
    await svc.publishGame({ ...initialState("walls"), score: 7 });
    await svc.publishGame({ ...initialState("walls"), score: 9 });
    await svc.endGame();
    // initial null + 7 + 9 + null
    expect(events).toEqual([null, 7, 9, null]);
  });
});
