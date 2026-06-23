import type {
  ActiveGame,
  GameMode,
  GameState,
  ScoreEntry,
  User,
} from "@/services/types";

export interface GameService {
  // auth
  getCurrentUser(): User | null;
  signup(username: string, password: string): Promise<User>;
  login(username: string, password: string): Promise<User>;
  logout(): Promise<void>;
  onAuthChange(listener: (u: User | null) => void): () => void;

  // scores
  submitScore(mode: GameMode, score: number): Promise<ScoreEntry>;
  getLeaderboard(mode: GameMode, limit?: number): Promise<ScoreEntry[]>;

  // active games (spectator)
  publishGame(state: GameState): Promise<void>;
  endGame(): Promise<void>;
  listActiveGames(): Promise<ActiveGame[]>;
  watchGame(userId: string, listener: (g: ActiveGame | null) => void): () => void;
  onActiveGamesChange(listener: (games: ActiveGame[]) => void): () => void;
}
