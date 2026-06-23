import type { GameService } from "@/services/GameService";
import type {
  ActiveGame,
  GameMode,
  GameState,
  ScoreEntry,
  User,
} from "@/services/types";

const BASE = "/api";

async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (res.status === 204) return undefined as T;
  const body = await res.json();
  if (!res.ok) throw new Error(body?.message ?? body?.detail ?? `HTTP ${res.status}`);
  return body as T;
}

export class ApiGameService implements GameService {
  private token: string | null = null;
  private currentUser: User | null = null;
  private authListeners = new Set<(u: User | null) => void>();
  private gamesListeners = new Set<(g: ActiveGame[]) => void>();
  private watcherListeners = new Map<string, Set<(g: ActiveGame | null) => void>>();
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  // ---------- auth ----------

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  async signup(username: string, password: string): Promise<User> {
    const res = await apiFetch<{ token: string; user: User }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    this.token = res.token;
    this.currentUser = res.user;
    this.emitAuth();
    return res.user;
  }

  async login(username: string, password: string): Promise<User> {
    const res = await apiFetch<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    this.token = res.token;
    this.currentUser = res.user;
    this.emitAuth();
    return res.user;
  }

  async logout(): Promise<void> {
    if (this.token) {
      await apiFetch<void>("/auth/logout", { method: "POST" }, this.token).catch(() => {});
    }
    this.token = null;
    this.currentUser = null;
    this.emitAuth();
  }

  onAuthChange(listener: (u: User | null) => void): () => void {
    this.authListeners.add(listener);
    return () => this.authListeners.delete(listener);
  }

  private emitAuth() {
    for (const l of this.authListeners) l(this.currentUser);
  }

  // ---------- scores ----------

  async submitScore(mode: GameMode, score: number): Promise<ScoreEntry> {
    return apiFetch<ScoreEntry>(
      "/scores",
      { method: "POST", body: JSON.stringify({ mode, score }) },
      this.token,
    );
  }

  async getLeaderboard(mode: GameMode, limit = 10): Promise<ScoreEntry[]> {
    return apiFetch<ScoreEntry[]>(`/leaderboard?mode=${mode}&limit=${limit}`);
  }

  // ---------- active games ----------

  async publishGame(state: GameState): Promise<void> {
    if (!this.token) return;
    await apiFetch<ActiveGame>(
      "/games/active",
      { method: "PUT", body: JSON.stringify(state) },
      this.token,
    );
  }

  async endGame(): Promise<void> {
    if (!this.token) return;
    await apiFetch<void>("/games/active", { method: "DELETE" }, this.token);
  }

  async listActiveGames(): Promise<ActiveGame[]> {
    return apiFetch<ActiveGame[]>("/games/active");
  }

  watchGame(userId: string, listener: (g: ActiveGame | null) => void): () => void {
    let set = this.watcherListeners.get(userId);
    if (!set) {
      set = new Set();
      this.watcherListeners.set(userId, set);
    }
    set.add(listener);
    this.ensurePolling();

    // Emit immediately with current state
    this.listActiveGames().then((games) => {
      listener(games.find((g) => g.userId === userId) ?? null);
    });

    return () => {
      const s = this.watcherListeners.get(userId);
      if (s) {
        s.delete(listener);
        if (s.size === 0) this.watcherListeners.delete(userId);
      }
      this.maybeStopPolling();
    };
  }

  onActiveGamesChange(listener: (games: ActiveGame[]) => void): () => void {
    this.gamesListeners.add(listener);
    this.ensurePolling();

    this.listActiveGames().then((games) => listener(games));

    return () => {
      this.gamesListeners.delete(listener);
      this.maybeStopPolling();
    };
  }

  // ---------- polling ----------

  private ensurePolling() {
    if (this.pollInterval !== null) return;
    this.pollInterval = setInterval(() => this.poll(), 1500);
  }

  private maybeStopPolling() {
    if (this.gamesListeners.size === 0 && this.watcherListeners.size === 0) {
      if (this.pollInterval !== null) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }
    }
  }

  private async poll() {
    let games: ActiveGame[];
    try {
      games = await this.listActiveGames();
    } catch {
      return;
    }
    for (const l of this.gamesListeners) l(games);
    for (const [userId, set] of this.watcherListeners) {
      const g = games.find((g) => g.userId === userId) ?? null;
      for (const l of set) l(g);
    }
  }
}
