import type { GameService } from "@/services/GameService";
import type {
  ActiveGame,
  GameMode,
  GameState,
  ScoreEntry,
  User,
} from "@/services/types";

type StoredUser = { id: string; username: string; password: string };

const USERS_KEY = "snake.users";
const SCORES_KEY = "snake.scores";
const SESSION_KEY = "snake.session";

function hasStorage(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

function loadJSON<T>(key: string, fallback: T): T {
  if (!hasStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: unknown): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function delay<T>(value: T, ms = 50): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export class MockGameService implements GameService {
  private users: StoredUser[];
  private scores: ScoreEntry[];
  private session: User | null;
  private activeGames = new Map<string, ActiveGame>();
  private authListeners = new Set<(u: User | null) => void>();
  private gamesListeners = new Set<(g: ActiveGame[]) => void>();
  private watchers = new Map<string, Set<(g: ActiveGame | null) => void>>();

  constructor() {
    this.users = loadJSON<StoredUser[]>(USERS_KEY, []);
    this.scores = loadJSON<ScoreEntry[]>(SCORES_KEY, []);
    this.session = loadJSON<User | null>(SESSION_KEY, null);

    // Seed a few demo users + scores on first run so the app feels alive.
    if (this.users.length === 0) {
      const seedUsers: StoredUser[] = [
        { id: uid(), username: "demo", password: "demo" },
        { id: uid(), username: "alice", password: "alice" },
        { id: uid(), username: "bob", password: "bob" },
      ];
      this.users = seedUsers;
      saveJSON(USERS_KEY, this.users);

      const seedScores: ScoreEntry[] = [];
      const modes: GameMode[] = ["walls", "wrap"];
      for (const u of seedUsers) {
        for (const m of modes) {
          for (let i = 0; i < 3; i++) {
            seedScores.push({
              id: uid(),
              userId: u.id,
              username: u.username,
              mode: m,
              score: Math.floor(Math.random() * 30) + 5,
              createdAt: Date.now() - Math.floor(Math.random() * 1e7),
            });
          }
        }
      }
      this.scores = seedScores;
      saveJSON(SCORES_KEY, this.scores);
    }
  }

  // ---------- auth ----------
  getCurrentUser(): User | null {
    return this.session;
  }

  private emitAuth() {
    for (const l of this.authListeners) l(this.session);
  }

  async signup(username: string, password: string): Promise<User> {
    const u = username.trim();
    if (u.length < 2) throw new Error("Username must be at least 2 characters");
    if (password.length < 3) throw new Error("Password must be at least 3 characters");
    if (this.users.some((x) => x.username.toLowerCase() === u.toLowerCase())) {
      throw new Error("Username already taken");
    }
    const user: StoredUser = { id: uid(), username: u, password };
    this.users.push(user);
    saveJSON(USERS_KEY, this.users);
    this.session = { id: user.id, username: user.username };
    saveJSON(SESSION_KEY, this.session);
    this.emitAuth();
    return delay(this.session);
  }

  async login(username: string, password: string): Promise<User> {
    const user = this.users.find(
      (x) => x.username.toLowerCase() === username.trim().toLowerCase(),
    );
    if (!user || user.password !== password) throw new Error("Invalid credentials");
    this.session = { id: user.id, username: user.username };
    saveJSON(SESSION_KEY, this.session);
    this.emitAuth();
    return delay(this.session);
  }

  async logout(): Promise<void> {
    if (this.session) {
      this.activeGames.delete(this.session.id);
      this.emitGames();
    }
    this.session = null;
    saveJSON(SESSION_KEY, null);
    this.emitAuth();
  }

  onAuthChange(listener: (u: User | null) => void): () => void {
    this.authListeners.add(listener);
    return () => this.authListeners.delete(listener);
  }

  // ---------- scores ----------
  async submitScore(mode: GameMode, score: number): Promise<ScoreEntry> {
    if (!this.session) throw new Error("Not logged in");
    const entry: ScoreEntry = {
      id: uid(),
      userId: this.session.id,
      username: this.session.username,
      mode,
      score,
      createdAt: Date.now(),
    };
    this.scores.push(entry);
    saveJSON(SCORES_KEY, this.scores);
    return delay(entry);
  }

  async getLeaderboard(mode: GameMode, limit = 10): Promise<ScoreEntry[]> {
    const sorted = this.scores
      .filter((s) => s.mode === mode)
      .sort((a, b) => b.score - a.score || a.createdAt - b.createdAt)
      .slice(0, limit);
    return delay(sorted);
  }

  // ---------- active games ----------
  private emitGames() {
    const arr = Array.from(this.activeGames.values());
    for (const l of this.gamesListeners) l(arr);
  }

  private emitWatchers(userId: string) {
    const set = this.watchers.get(userId);
    if (!set) return;
    const g = this.activeGames.get(userId) ?? null;
    for (const l of set) l(g);
  }

  async publishGame(state: GameState): Promise<void> {
    if (!this.session) return;
    const ag: ActiveGame = {
      userId: this.session.id,
      username: this.session.username,
      mode: state.mode,
      state,
      updatedAt: Date.now(),
    };
    this.activeGames.set(this.session.id, ag);
    this.emitGames();
    this.emitWatchers(this.session.id);
  }

  async endGame(): Promise<void> {
    if (!this.session) return;
    const id = this.session.id;
    this.activeGames.delete(id);
    this.emitGames();
    this.emitWatchers(id);
  }

  async listActiveGames(): Promise<ActiveGame[]> {
    return delay(Array.from(this.activeGames.values()));
  }

  watchGame(userId: string, listener: (g: ActiveGame | null) => void): () => void {
    let set = this.watchers.get(userId);
    if (!set) {
      set = new Set();
      this.watchers.set(userId, set);
    }
    set.add(listener);
    listener(this.activeGames.get(userId) ?? null);
    return () => {
      set!.delete(listener);
    };
  }

  onActiveGamesChange(listener: (games: ActiveGame[]) => void): () => void {
    this.gamesListeners.add(listener);
    listener(Array.from(this.activeGames.values()));
    return () => this.gamesListeners.delete(listener);
  }
}
